import { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "../../generated/prisma";
import { getLogger } from "../../helper/logger";
import {
	transformFormDataToObject,
	isFormOrMultipartContentType,
} from "../../helper/transformObject";
import { validateQueryParams } from "../../helper/validation-helper";
import {
	buildFilterConditions,
	buildFindManyQuery,
	buildSearchConditions,
	getNestedFields,
} from "../../helper/query-builder";
import { buildSuccessResponse, buildPagination } from "../../helper/success-handler";
import { groupDataByField } from "../../helper/dataGrouping";
import { buildErrorResponse, formatZodErrors } from "../../helper/error-handler";
import { CreateFacilityTypeSchema, UpdateFacilityTypeSchema } from "../../zod/facilityType.zod";
import { logActivity } from "../../utils/activityLogger";
import { logAudit } from "../../utils/auditLogger";
import { config } from "../../config/constant";
import { redisClient } from "../../config/redis";
import { invalidateCache } from "../../middleware/cache";

const logger = getLogger();
const facilityTypeLogger = logger.child({ module: "facilityType" });

// Helper function to remove images field from facilityType (legacy field)
const removeImagesField = (facilityType: any) => {
	if (!facilityType) return facilityType;
	const { images, ...rest } = facilityType;
	return rest;
};

// Helper function to remove images from array of facilityTypes
const removeImagesFromArray = (facilityTypes: any[]) => {
	return facilityTypes.map(removeImagesField);
};

export const controller = (prisma: PrismaClient) => {
	const create = async (req: Request, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		if (isFormOrMultipartContentType(contentType)) {
			facilityTypeLogger.info("Original form data:", JSON.stringify(req.body, null, 2));
			requestData = transformFormDataToObject(req.body);
			facilityTypeLogger.info(
				"Transformed form data to object structure:",
				JSON.stringify(requestData, null, 2),
			);
		}

		const validation = CreateFacilityTypeSchema.safeParse(requestData);
		if (!validation.success) {
			const formattedErrors = formatZodErrors(validation.error);
			facilityTypeLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
			const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			// Prepare data for Prisma
			const facilityType = await prisma.facilityType.create({
				data: {
					name: validation.data.name,
					code: validation.data.code,
					description: validation.data.description,
					spaceType: validation.data.spaceType,
					subtype: validation.data.subtype,
					organizationId: validation.data.organizationId,
					path: validation.data.path,
				},
			});
			facilityTypeLogger.info(`FacilityType created successfully: ${facilityType.id}`);

			// Remove images field if it exists (legacy data)
			const { images, ...facilityTypeWithoutImages } = facilityType as any;

			logActivity(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.ACTIVITY_LOG.FACILITYTYPE.ACTIONS.CREATE_FACILITYTYPE,
				description: `${config.ACTIVITY_LOG.FACILITYTYPE.DESCRIPTIONS.FACILITYTYPE_CREATED}: ${facilityType.name || facilityType.id}`,
				page: {
					url: req.originalUrl,
					title: config.ACTIVITY_LOG.FACILITYTYPE.PAGES.FACILITYTYPE_CREATION,
				},
			});

			logAudit(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.AUDIT_LOG.ACTIONS.CREATE,
				resource: config.AUDIT_LOG.RESOURCES.FACILITYTYPE,
				severity: config.AUDIT_LOG.SEVERITY.LOW,
				entityType: config.AUDIT_LOG.ENTITY_TYPES.FACILITYTYPE,
				entityId: facilityType.id,
				changesBefore: null,
				changesAfter: {
					id: facilityType.id,
					name: facilityType.name,
					description: facilityType.description,
					createdAt: facilityType.createdAt,
					updatedAt: facilityType.updatedAt,
				},
				description: `${config.AUDIT_LOG.FACILITYTYPE.DESCRIPTIONS.FACILITYTYPE_CREATED}: ${facilityType.name || facilityType.id}`,
			});

			try {
				await invalidateCache.byPattern("cache:facilityType:list:*");
				facilityTypeLogger.info("FacilityType list cache invalidated after creation");
			} catch (cacheError) {
				facilityTypeLogger.warn(
					"Failed to invalidate cache after facilityType creation:",
					cacheError,
				);
			}

			const successResponse = buildSuccessResponse(
				config.SUCCESS.FACILITYTYPE.CREATED,
				facilityTypeWithoutImages,
				201,
			);
			res.status(201).json(successResponse);
		} catch (error) {
			facilityTypeLogger.error(`${config.ERROR.FACILITYTYPE.CREATE_FAILED}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};
	const getAll = async (req: Request, res: Response, _next: NextFunction) => {
		const validationResult = validateQueryParams(req, facilityTypeLogger);

		if (!validationResult.isValid) {
			res.status(400).json(validationResult.errorResponse);
			return;
		}

		const {
			page,
			limit,
			order,
			fields,
			sort,
			skip,
			query,
			document,
			pagination,
			count,
			filter,
			groupBy,
		} = validationResult.validatedParams!;

		facilityTypeLogger.info(
			`Getting facilityTypes, page: ${page}, limit: ${limit}, query: ${query}, order: ${order}, groupBy: ${groupBy}`,
		);

		try {
			// Base where clause
			const whereClause: Prisma.FacilityTypeWhereInput = {};

			// search fields sample ("name", "description", "code")
			const searchFields = ["name", "description", "code", "spaceType", "subtype"];
			if (query) {
				const searchConditions = buildSearchConditions("FacilityType", query, searchFields);
				if (searchConditions.length > 0) {
					whereClause.OR = searchConditions;
				}
			}

			if (filter) {
				const filterConditions = buildFilterConditions("FacilityType", filter);
				if (filterConditions.length > 0) {
					whereClause.AND = filterConditions;
				}
			}
			const findManyQuery = buildFindManyQuery(whereClause, skip, limit, order, sort, fields);

			// Always include rateType relation to get rateUnit
			// If fields are specified, merge with existing select, otherwise use include
			if (findManyQuery.select) {
				// If select is used, ensure rateType is included with rateUnit
				if (!findManyQuery.select.rateType) {
					findManyQuery.select.rateType = {
						select: {
							id: true,
							rateUnit: true,
							name: true,
							baseRate: true,
							currency: true,
						},
					};
				} else if (
					typeof findManyQuery.select.rateType === "object" &&
					findManyQuery.select.rateType !== null
				) {
					// If rateType is already in select as an object, ensure rateUnit is included
					if (!findManyQuery.select.rateType.select) {
						findManyQuery.select.rateType.select = {};
					}
					findManyQuery.select.rateType.select.rateUnit = true;
				}
				// If rateType is true (all fields), rateUnit will be included automatically
			} else {
				// If no select, use include
				findManyQuery.include = {
					rateType: {
						select: {
							id: true,
							rateUnit: true,
							name: true,
							baseRate: true,
							currency: true,
						},
					},
					facilities: true,
				};
			}

			const [facilityTypes, total] = await Promise.all([
				document ? prisma.facilityType.findMany(findManyQuery) : [],
				count ? prisma.facilityType.count({ where: whereClause }) : 0,
			]);

			facilityTypeLogger.info(`Retrieved ${facilityTypes.length} facilityTypes`);

			// Remove images field from all facilityTypes
			const facilityTypesWithoutImages = removeImagesFromArray(facilityTypes);

			const processedData =
				groupBy && document
					? groupDataByField(facilityTypesWithoutImages, groupBy as string)
					: facilityTypesWithoutImages;

			const responseData: Record<string, any> = {
				...(document && { facilityTypes: processedData }),
				...(count && { count: total }),
				...(pagination && { pagination: buildPagination(total, page, limit) }),
				...(groupBy && { groupedBy: groupBy }),
			};

			res.status(200).json(
				buildSuccessResponse(config.SUCCESS.FACILITYTYPE.RETRIEVED_ALL, responseData, 200),
			);
		} catch (error) {
			facilityTypeLogger.error(`${config.ERROR.FACILITYTYPE.GET_ALL_FAILED}: ${error}`);
			res.status(500).json(
				buildErrorResponse(config.ERROR.COMMON.INTERNAL_SERVER_ERROR, 500),
			);
		}
	};
	const getById = async (req: Request, res: Response, _next: NextFunction) => {
		const { id } = req.params;
		const { fields } = req.query;

		try {
			if (!id) {
				facilityTypeLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			if (fields && typeof fields !== "string") {
				facilityTypeLogger.error(
					`${config.ERROR.QUERY_PARAMS.INVALID_POPULATE}: ${fields}`,
				);
				const errorResponse = buildErrorResponse(
					config.ERROR.QUERY_PARAMS.POPULATE_MUST_BE_STRING,
					400,
				);
				res.status(400).json(errorResponse);
				return;
			}

			facilityTypeLogger.info(`${config.SUCCESS.FACILITYTYPE.GETTING_BY_ID}: ${id}`);

			const cacheKey = `cache:facilityType:byId:${id}:${fields || "full"}`;
			let facilityType = null;

			try {
				if (redisClient.isClientConnected()) {
					const cachedFacilityType = await redisClient.getJSON(cacheKey);
					if (cachedFacilityType) {
						facilityTypeLogger.info(
							`FacilityType ${id} retrieved from direct Redis cache`,
						);
						// Remove images field from cached data
						facilityType = removeImagesField(cachedFacilityType);
					}
				}
			} catch (cacheError) {
				facilityTypeLogger.warn(
					`Redis cache retrieval failed for facilityType ${id}:`,
					cacheError,
				);
			}

			if (!facilityType) {
				const query: Prisma.FacilityTypeFindFirstArgs = {
					where: { id },
				};

				query.select = getNestedFields(fields);

				facilityType = await prisma.facilityType.findFirst(query);

				if (facilityType && redisClient.isClientConnected()) {
					try {
						// Store without images field in cache
						const facilityTypeWithoutImages = removeImagesField(facilityType);
						await redisClient.setJSON(cacheKey, facilityTypeWithoutImages, 3600);
						facilityTypeLogger.info(`FacilityType ${id} stored in direct Redis cache`);
					} catch (cacheError) {
						facilityTypeLogger.warn(
							`Failed to store facilityType ${id} in Redis cache:`,
							cacheError,
						);
					}
				}
			}

			if (!facilityType) {
				facilityTypeLogger.error(`${config.ERROR.FACILITYTYPE.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.FACILITYTYPE.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			facilityTypeLogger.info(
				`${config.SUCCESS.FACILITYTYPE.RETRIEVED}: ${(facilityType as any).id}`,
			);
			const facilityTypeWithoutImages = removeImagesField(facilityType);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.FACILITYTYPE.RETRIEVED,
				facilityTypeWithoutImages,
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			facilityTypeLogger.error(`${config.ERROR.FACILITYTYPE.ERROR_GETTING}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	const update = async (req: Request, res: Response, _next: NextFunction) => {
		const { id } = req.params;

		try {
			if (!id) {
				facilityTypeLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			let requestData = req.body;
			const contentType = req.get("Content-Type") || "";

			if (isFormOrMultipartContentType(contentType)) {
				facilityTypeLogger.info("Original form data:", JSON.stringify(req.body, null, 2));
				requestData = transformFormDataToObject(req.body);
				facilityTypeLogger.info(
					"Transformed form data to object structure:",
					JSON.stringify(requestData, null, 2),
				);
			}

			const existingFacilityType = await prisma.facilityType.findFirst({
				where: { id },
			});

			if (!existingFacilityType) {
				facilityTypeLogger.error(`${config.ERROR.FACILITYTYPE.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.FACILITYTYPE.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			const validationResult = UpdateFacilityTypeSchema.safeParse(requestData);

			if (!validationResult.success) {
				const formattedErrors = formatZodErrors(validationResult.error);
				facilityTypeLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
				const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
				res.status(400).json(errorResponse);
				return;
			}

			// Check if there's actually data to update
			if (Object.keys(req.body).length === 0) {
				facilityTypeLogger.error(config.ERROR.COMMON.NO_UPDATE_FIELDS);
				const errorResponse = buildErrorResponse(config.ERROR.COMMON.NO_UPDATE_FIELDS, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validatedData = validationResult.data;

			facilityTypeLogger.info(`Updating facilityType: ${id}`);

			const prismaData = { ...validatedData };

			const updatedFacilityType = await prisma.facilityType.update({
				where: { id },
				data: prismaData,
			});

			try {
				await invalidateCache.byPattern(`cache:facilityType:byId:${id}:*`);
				await invalidateCache.byPattern("cache:facilityType:list:*");
				facilityTypeLogger.info(`Cache invalidated after facilityType ${id} update`);
			} catch (cacheError) {
				facilityTypeLogger.warn(
					"Failed to invalidate cache after facilityType update:",
					cacheError,
				);
			}

			facilityTypeLogger.info(
				`${config.SUCCESS.FACILITYTYPE.UPDATED}: ${updatedFacilityType.id}`,
			);
			const updatedFacilityTypeWithoutImages = removeImagesField(updatedFacilityType);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.FACILITYTYPE.UPDATED,
				updatedFacilityTypeWithoutImages,
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			facilityTypeLogger.error(`${config.ERROR.FACILITYTYPE.ERROR_UPDATING}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	const remove = async (req: Request, res: Response, _next: NextFunction) => {
		const { id } = req.params;

		try {
			if (!id) {
				facilityTypeLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			facilityTypeLogger.info(`Deleting facilityType: ${id}`);

			const existingFacilityType = await prisma.facilityType.findFirst({
				where: { id },
			});

			if (!existingFacilityType) {
				facilityTypeLogger.error(`${config.ERROR.FACILITYTYPE.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.FACILITYTYPE.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Delete the facilityType from database
			await prisma.facilityType.delete({
				where: { id },
			});

			try {
				await invalidateCache.byPattern(`cache:facilityType:byId:${id}:*`);
				await invalidateCache.byPattern("cache:facilityType:list:*");
				facilityTypeLogger.info(`Cache invalidated after facilityType ${id} deletion`);
			} catch (cacheError) {
				facilityTypeLogger.warn(
					"Failed to invalidate cache after facilityType deletion:",
					cacheError,
				);
			}

			facilityTypeLogger.info(`${config.SUCCESS.FACILITYTYPE.DELETED}: ${id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.FACILITYTYPE.DELETED,
				{},
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			facilityTypeLogger.error(`${config.ERROR.FACILITYTYPE.DELETE_FAILED}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	return { create, getAll, getById, update, remove };
};
