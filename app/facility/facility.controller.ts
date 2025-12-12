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
import { CreateFacilitySchema, UpdateFacilitySchema } from "../../zod/facility.zod";
import { logActivity } from "../../utils/activityLogger";
import { logAudit } from "../../utils/auditLogger";
import { DEFAULT_BLOCKING_STATUSES } from "../../helper/reservation-availability";
import { config } from "../../config/constant";
import { redisClient } from "../../config/redis";
import { invalidateCache } from "../../middleware/cache";

const logger = getLogger();
const facilityLogger = logger.child({ module: "facility" });

export const controller = (prisma: PrismaClient) => {
	const create = async (req: Request, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
			facilityLogger.info("Original form data:", JSON.stringify(req.body, null, 2));
			requestData = transformFormDataToObject(req.body);
			facilityLogger.info(
				"Transformed form data to object structure:",
				JSON.stringify(requestData, null, 2),
			);
		}

		const validation = CreateFacilitySchema.safeParse(requestData);
		if (!validation.success) {
			const formattedErrors = formatZodErrors(validation.error.format());
			facilityLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
			const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			const facility = await prisma.facility.create({ data: validation.data });
			facilityLogger.info(`Facility created successfully: ${facility.id}`);

			logActivity(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.ACTIVITY_LOG.FACILITY.ACTIONS.CREATE_FACILITY,
				description: `${config.ACTIVITY_LOG.FACILITY.DESCRIPTIONS.FACILITY_CREATED}: ${facility.displayName || facility.identifier || facility.id}`,
				page: {
					url: req.originalUrl,
					title: config.ACTIVITY_LOG.FACILITY.PAGES.FACILITY_CREATION,
				},
			});

			logAudit(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.AUDIT_LOG.ACTIONS.CREATE,
				resource: config.AUDIT_LOG.RESOURCES.FACILITY,
				severity: config.AUDIT_LOG.SEVERITY.LOW,
				entityType: config.AUDIT_LOG.ENTITY_TYPES.FACILITY,
				entityId: facility.id,
				changesBefore: null,
				changesAfter: {
					id: facility.id,
					identifier: facility.identifier,
					displayName: facility.displayName,
					createdAt: facility.createdAt,
					updatedAt: facility.updatedAt,
				},
				description: `${config.AUDIT_LOG.FACILITY.DESCRIPTIONS.FACILITY_CREATED}: ${facility.displayName || facility.identifier || facility.id}`,
			});

			try {
				await invalidateCache.byPattern("cache:facility:list:*");
				facilityLogger.info("Facility list cache invalidated after creation");
			} catch (cacheError) {
				facilityLogger.warn(
					"Failed to invalidate cache after facility creation:",
					cacheError,
				);
			}

			const successResponse = buildSuccessResponse(
				config.SUCCESS.FACILITY.CREATED,
				facility,
				201,
			);
			res.status(201).json(successResponse);
		} catch (error: any) {
			facilityLogger.error(`${config.ERROR.FACILITY.CREATE_FAILED}: ${error}`);

			// Handle unique constraint violation
			if (error.code === "P2002") {
				const fields = error.meta?.target || ["organizationId", "identifier"];
				const errorResponse = buildErrorResponse(
					`A facility with this ${fields.join(" and ")} already exists in this organization`,
					409,
					[
						{
							field: fields.join(", "),
							message: `Duplicate facility: A facility with identifier "${validation.data.identifier}" already exists for this organization`,
						},
					],
				);
				res.status(409).json(errorResponse);
				return;
			}

			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};
	const getAll = async (req: Request, res: Response, _next: NextFunction) => {
		const validationResult = validateQueryParams(req, facilityLogger);

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

		facilityLogger.info(
			`Getting facilities, page: ${page}, limit: ${limit}, query: ${query}, order: ${order}, groupBy: ${groupBy}`,
		);

		try {
			// Base where clause
			const whereClause: Prisma.FacilityWhereInput = {};

			// Search fields (identifier, displayName)
			const searchFields = ["identifier", "displayName"];
			if (query) {
				const searchConditions = buildSearchConditions("Facility", query, searchFields);
				if (searchConditions.length > 0) {
					whereClause.OR = searchConditions;
				}
			}

			if (filter) {
				const filterConditions = buildFilterConditions("Facility", filter);
				if (filterConditions.length > 0) {
					whereClause.AND = filterConditions;
				}
			}

			const findManyQuery = buildFindManyQuery(whereClause, skip, limit, order, sort, fields);

			// Include related location and facilityType
			findManyQuery.include = {
				location: true,
				facilityType: true,
			};

			const [facilities, total] = await Promise.all([
				document ? prisma.facility.findMany(findManyQuery) : [],
				count ? prisma.facility.count({ where: whereClause }) : 0,
			]);

			facilityLogger.info(`Retrieved ${facilities.length} facilities`);

			const processedData =
				groupBy && document ? groupDataByField(facilities, groupBy as string) : facilities;

			const responseData: Record<string, any> = {
				...(document && { facilities: processedData }),
				...(count && { count: total }),
				...(pagination && { pagination: buildPagination(total, page, limit) }),
				...(groupBy && { groupedBy: groupBy }),
			};

			res.status(200).json(
				buildSuccessResponse(config.SUCCESS.FACILITY.RETRIEVED_ALL, responseData, 200),
			);
		} catch (error) {
			facilityLogger.error(`${config.ERROR.FACILITY.GET_ALL_FAILED}: ${error}`);
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
				facilityLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			if (fields && typeof fields !== "string") {
				facilityLogger.error(`${config.ERROR.QUERY_PARAMS.INVALID_POPULATE}: ${fields}`);
				const errorResponse = buildErrorResponse(
					config.ERROR.QUERY_PARAMS.POPULATE_MUST_BE_STRING,
					400,
				);
				res.status(400).json(errorResponse);
				return;
			}

			facilityLogger.info(`${config.SUCCESS.FACILITY.GETTING_BY_ID}: ${id}`);

			const cacheKey = `cache:facility:byId:${id}:${fields || "full"}`;
			let facility = null;

			try {
				if (redisClient.isClientConnected()) {
					facility = await redisClient.getJSON(cacheKey);
					if (facility) {
						facilityLogger.info(`Facility ${id} retrieved from direct Redis cache`);
					}
				}
			} catch (cacheError) {
				facilityLogger.warn(`Redis cache retrieval failed for facility ${id}:`, cacheError);
			}

			if (!facility) {
				const query: Prisma.FacilityFindFirstArgs = {
					where: { id },
				};

				query.select = getNestedFields(fields);

				// Include related location and facilityType
				query.include = {
					location: true,
					facilityType: true,
				};

				facility = await prisma.facility.findFirst(query);

				if (facility && redisClient.isClientConnected()) {
					try {
						await redisClient.setJSON(cacheKey, facility, 3600);
						facilityLogger.info(`Facility ${id} stored in direct Redis cache`);
					} catch (cacheError) {
						facilityLogger.warn(
							`Failed to store facility ${id} in Redis cache:`,
							cacheError,
						);
					}
				}
			}

			if (!facility) {
				facilityLogger.error(`${config.ERROR.FACILITY.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.FACILITY.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			facilityLogger.info(`${config.SUCCESS.FACILITY.RETRIEVED}: ${(facility as any).id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.FACILITY.RETRIEVED,
				facility,
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			facilityLogger.error(`${config.ERROR.FACILITY.ERROR_GETTING}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	const getAvailable = async (req: Request, res: Response, _next: NextFunction) => {
		const { startDateTime, endDateTime } = req.query;
		const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 200);
		const skip = parseInt((req.query.skip as string) || "0", 10);

		if (
			!startDateTime ||
			!endDateTime ||
			typeof startDateTime !== "string" ||
			typeof endDateTime !== "string"
		) {
			const errorResponse = buildErrorResponse(
				"startDateTime and endDateTime query params are required",
				400,
			);
			res.status(400).json(errorResponse);
			return;
		}

		const start = new Date(startDateTime);
		const end = new Date(endDateTime);

		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			const errorResponse = buildErrorResponse(
				"Invalid date format for startDateTime or endDateTime",
				400,
			);
			res.status(400).json(errorResponse);
			return;
		}

		if (end <= start) {
			const errorResponse = buildErrorResponse(
				"endDateTime must be after startDateTime",
				400,
			);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			const facilities = await prisma.facility.findMany({
				where: {
					reservations: {
						none: {
							status: { in: DEFAULT_BLOCKING_STATUSES },
							bookingPeriod: {
								is: {
									startDateTime: { lt: end },
									endDateTime: { gt: start },
								},
							},
						},
					},
				},
				include: {
					location: true,
					facilityType: true,
				},
				take: limit,
				skip,
			});

			const responseData = {
				availableFacilities: facilities,
				window: { startDateTime: start.toISOString(), endDateTime: end.toISOString() },
			};

			res.status(200).json(
				buildSuccessResponse(config.SUCCESS.FACILITY.RETRIEVED_ALL, responseData, 200),
			);
		} catch (error) {
			facilityLogger.error(`Failed to get available facilities: ${error}`);
			res.status(500).json(
				buildErrorResponse(config.ERROR.COMMON.INTERNAL_SERVER_ERROR, 500),
			);
		}
	};

	const update = async (req: Request, res: Response, _next: NextFunction) => {
		const { id } = req.params;

		try {
			if (!id) {
				facilityLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validationResult = UpdateFacilitySchema.safeParse(req.body);

			if (!validationResult.success) {
				const formattedErrors = formatZodErrors(validationResult.error.format());
				facilityLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
				const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
				res.status(400).json(errorResponse);
				return;
			}

			if (Object.keys(req.body).length === 0) {
				facilityLogger.error(config.ERROR.COMMON.NO_UPDATE_FIELDS);
				const errorResponse = buildErrorResponse(config.ERROR.COMMON.NO_UPDATE_FIELDS, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validatedData = validationResult.data;

			facilityLogger.info(`Updating facility: ${id}`);

			const existingFacility = await prisma.facility.findFirst({
				where: { id },
			});

			if (!existingFacility) {
				facilityLogger.error(`${config.ERROR.FACILITY.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.FACILITY.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			const prismaData = { ...validatedData };

			const updatedFacility = await prisma.facility.update({
				where: { id },
				data: prismaData,
			});

			try {
				await invalidateCache.byPattern(`cache:facility:byId:${id}:*`);
				await invalidateCache.byPattern("cache:facility:list:*");
				facilityLogger.info(`Cache invalidated after facility ${id} update`);
			} catch (cacheError) {
				facilityLogger.warn(
					"Failed to invalidate cache after facility update:",
					cacheError,
				);
			}

			facilityLogger.info(`${config.SUCCESS.FACILITY.UPDATED}: ${updatedFacility.id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.FACILITY.UPDATED,
				{ facility: updatedFacility },
				200,
			);
			res.status(200).json(successResponse);
		} catch (error: any) {
			facilityLogger.error(`${config.ERROR.FACILITY.ERROR_UPDATING}: ${error}`);

			// Handle unique constraint violation
			if (error.code === "P2002") {
				const fields = error.meta?.target || ["organizationId", "identifier"];
				const errorResponse = buildErrorResponse(
					`A facility with this ${fields.join(" and ")} already exists in this organization`,
					409,
					[
						{
							field: fields.join(", "),
							message: `Duplicate facility: A facility with this identifier already exists for this organization`,
						},
					],
				);
				res.status(409).json(errorResponse);
				return;
			}

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
				facilityLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			facilityLogger.info(`${config.SUCCESS.FACILITY.DELETED}: ${id}`);

			const existingFacility = await prisma.facility.findFirst({
				where: { id },
			});

			if (!existingFacility) {
				facilityLogger.error(`${config.ERROR.FACILITY.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.FACILITY.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			await prisma.facility.delete({
				where: { id },
			});

			try {
				await invalidateCache.byPattern(`cache:facility:byId:${id}:*`);
				await invalidateCache.byPattern("cache:facility:list:*");
				facilityLogger.info(`Cache invalidated after facility ${id} deletion`);
			} catch (cacheError) {
				facilityLogger.warn(
					"Failed to invalidate cache after facility deletion:",
					cacheError,
				);
			}

			facilityLogger.info(`${config.SUCCESS.FACILITY.DELETED}: ${id}`);
			const successResponse = buildSuccessResponse(config.SUCCESS.FACILITY.DELETED, {}, 200);
			res.status(200).json(successResponse);
		} catch (error) {
			facilityLogger.error(`${config.ERROR.FACILITY.DELETE_FAILED}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	return { create, getAll, getById, getAvailable, update, remove };
};
