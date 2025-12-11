import { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "../../generated/prisma";
import { getLogger } from "../../helper/logger";
import { transformFormDataToObject } from "../../helper/transformObject";
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

export const controller = (prisma: PrismaClient) => {
	const create = async (req: Request, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
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
			if (validation.data.rateTypeId) {
				let rateType = null;
				try {
					rateType = await prisma.rateType.findUnique({
						where: { id: validation.data.rateTypeId },
					});
				} catch (lookupError) {
					facilityTypeLogger.error(
						`RateType lookup failed: ${validation.data.rateTypeId}`,
						lookupError,
					);
					const errorResponse = buildErrorResponse(
						"Unable to verify rateType",
						503,
						[{ field: "rateTypeId", message: "Temporary issue verifying rate type" }],
					);
					res.status(503).json(errorResponse);
					return;
				}

				if (!rateType) {
					const errorResponse = buildErrorResponse("RateType not found", 400, [
						{ field: "rateTypeId", message: "RateType does not exist" },
					]);
					res.status(400).json(errorResponse);
					return;
				}
			}

			const facilityType = await prisma.facilityType.create({ data: validation.data });
			facilityTypeLogger.info(`FacilityType created successfully: ${facilityType.id}`);

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
				facilityType,
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

			const [facilityTypes, total] = await Promise.all([
				document ? prisma.facilityType.findMany(findManyQuery) : [],
				count ? prisma.facilityType.count({ where: whereClause }) : 0,
			]);

			facilityTypeLogger.info(`Retrieved ${facilityTypes.length} facilityTypes`);
			const processedData =
				groupBy && document ? groupDataByField(facilityTypes, groupBy as string) : facilityTypes;

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
				facilityTypeLogger.error(`${config.ERROR.QUERY_PARAMS.INVALID_POPULATE}: ${fields}`);
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
					facilityType = await redisClient.getJSON(cacheKey);
					if (facilityType) {
						facilityTypeLogger.info(`FacilityType ${id} retrieved from direct Redis cache`);
					}
				}
			} catch (cacheError) {
				facilityTypeLogger.warn(`Redis cache retrieval failed for facilityType ${id}:`, cacheError);
			}

			if (!facilityType) {
				const query: Prisma.FacilityTypeFindFirstArgs = {
					where: { id },
				};

				query.select = getNestedFields(fields);

				facilityType = await prisma.facilityType.findFirst(query);

				if (facilityType && redisClient.isClientConnected()) {
					try {
						await redisClient.setJSON(cacheKey, facilityType, 3600);
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

			facilityTypeLogger.info(`${config.SUCCESS.FACILITYTYPE.RETRIEVED}: ${(facilityType as any).id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.FACILITYTYPE.RETRIEVED,
				facilityType,
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

			const validationResult = UpdateFacilityTypeSchema.safeParse(req.body);

			if (!validationResult.success) {
				const formattedErrors = formatZodErrors(validationResult.error);
				facilityTypeLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
				const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
				res.status(400).json(errorResponse);
				return;
			}

			if (Object.keys(req.body).length === 0) {
				facilityTypeLogger.error(config.ERROR.COMMON.NO_UPDATE_FIELDS);
				const errorResponse = buildErrorResponse(config.ERROR.COMMON.NO_UPDATE_FIELDS, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validatedData = validationResult.data;

			facilityTypeLogger.info(`Updating facilityType: ${id}`);

			const existingFacilityType = await prisma.facilityType.findFirst({
				where: { id },
			});

			if (!existingFacilityType) {
				facilityTypeLogger.error(`${config.ERROR.FACILITYTYPE.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.FACILITYTYPE.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

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

			facilityTypeLogger.info(`${config.SUCCESS.FACILITYTYPE.UPDATED}: ${updatedFacilityType.id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.FACILITYTYPE.UPDATED,
				{ facilityType: updatedFacilityType },
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

			facilityTypeLogger.info(`${config.SUCCESS.FACILITYTYPE.DELETED}: ${id}`);

			const existingFacilityType = await prisma.facilityType.findFirst({
				where: { id },
			});

			if (!existingFacilityType) {
				facilityTypeLogger.error(`${config.ERROR.FACILITYTYPE.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.FACILITYTYPE.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

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
			const successResponse = buildSuccessResponse(config.SUCCESS.FACILITYTYPE.DELETED, {}, 200);
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
