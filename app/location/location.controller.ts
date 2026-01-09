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
import { CreateLocationSchema, UpdateLocationSchema } from "../../zod/location.zod";
import { logActivity } from "../../utils/activityLogger";
import { logAudit } from "../../utils/auditLogger";
import { config } from "../../config/constant";
import { redisClient } from "../../config/redis";
import { invalidateCache } from "../../middleware/cache";

const logger = getLogger();
const locationLogger = logger.child({ module: "location" });

export const controller = (prisma: PrismaClient) => {
	const create = async (req: Request, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
			locationLogger.info("Original form data:", JSON.stringify(req.body, null, 2));
			requestData = transformFormDataToObject(req.body);
			locationLogger.info(
				"Transformed form data to object structure:",
				JSON.stringify(requestData, null, 2),
			);
		}

		const validation = CreateLocationSchema.safeParse(requestData);
		if (!validation.success) {
			const formattedErrors = formatZodErrors(validation.error);
			locationLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
			const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			// Remove undefined values to satisfy Prisma's type requirements
			const cleanData = Object.fromEntries(
				Object.entries(validation.data).filter(([_, value]) => value !== undefined),
			) as Prisma.LocationCreateInput;

			const location = await prisma.location.create({ data: cleanData });
			locationLogger.info(`Location created successfully: ${location.id}`);

			logActivity(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.ACTIVITY_LOG.LOCATION.ACTIONS.CREATE_LOCATION,
				description: `${config.ACTIVITY_LOG.LOCATION.DESCRIPTIONS.LOCATION_CREATED}: ${location.name || location.id}`,
				page: {
					url: req.originalUrl,
					title: config.ACTIVITY_LOG.LOCATION.PAGES.LOCATION_CREATION,
				},
			});

			logAudit(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.AUDIT_LOG.ACTIONS.CREATE,
				resource: config.AUDIT_LOG.RESOURCES.LOCATION,
				severity: config.AUDIT_LOG.SEVERITY.LOW,
				entityType: config.AUDIT_LOG.ENTITY_TYPES.LOCATION,
				entityId: location.id,
				changesBefore: null,
				changesAfter: {
					id: location.id,
					name: location.name,
					description: location.description,
					createdAt: location.createdAt,
					updatedAt: location.updatedAt,
				},
				description: `${config.AUDIT_LOG.LOCATION.DESCRIPTIONS.LOCATION_CREATED}: ${location.name || location.id}`,
			});

			try {
				await invalidateCache.byPattern("cache:location:list:*");
				locationLogger.info("Location list cache invalidated after creation");
			} catch (cacheError) {
				locationLogger.warn(
					"Failed to invalidate cache after location creation:",
					cacheError,
				);
			}

			const successResponse = buildSuccessResponse(
				config.SUCCESS.LOCATION.CREATED,
				location,
				201,
			);
			res.status(201).json(successResponse);
		} catch (error) {
			locationLogger.error(`${config.ERROR.LOCATION.CREATE_FAILED}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};
	const getAll = async (req: Request, res: Response, _next: NextFunction) => {
		const validationResult = validateQueryParams(req, locationLogger);

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

		locationLogger.info(
			`Getting locations, page: ${page}, limit: ${limit}, query: ${query}, order: ${order}, groupBy: ${groupBy}`,
		);

		try {
			// Base where clause
			const whereClause: Prisma.LocationWhereInput = {};

			// search fields sample ("name", "description", "city")
			const searchFields = ["name", "description", "city", "country", "address", "code"];
			if (query) {
				const searchConditions = buildSearchConditions("Location", query, searchFields);
				if (searchConditions.length > 0) {
					whereClause.OR = searchConditions;
				}
			}

			if (filter) {
				const filterConditions = buildFilterConditions("Location", filter);
				locationLogger.info(
					`Filter conditions generated: ${JSON.stringify(filterConditions)}`,
				);
				if (filterConditions.length > 0) {
					whereClause.AND = filterConditions;
				}
			}

			locationLogger.info(`Final where clause: ${JSON.stringify(whereClause)}`);
			const findManyQuery = buildFindManyQuery(whereClause, skip, limit, order, sort, fields);

			const [locations, total] = await Promise.all([
				document ? prisma.location.findMany(findManyQuery) : [],
				count ? prisma.location.count({ where: whereClause }) : 0,
			]);

			locationLogger.info(`Retrieved ${locations.length} locations`);
			const processedData =
				groupBy && document ? groupDataByField(locations, groupBy as string) : locations;

			const responseData: Record<string, any> = {
				...(document && { locations: processedData }),
				...(count && { count: total }),
				...(pagination && { pagination: buildPagination(total, page, limit) }),
				...(groupBy && { groupedBy: groupBy }),
			};

			res.status(200).json(
				buildSuccessResponse(config.SUCCESS.LOCATION.RETRIEVED_ALL, responseData, 200),
			);
		} catch (error) {
			locationLogger.error(`${config.ERROR.LOCATION.GET_ALL_FAILED}: ${error}`);
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
				locationLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			if (fields && typeof fields !== "string") {
				locationLogger.error(`${config.ERROR.QUERY_PARAMS.INVALID_POPULATE}: ${fields}`);
				const errorResponse = buildErrorResponse(
					config.ERROR.QUERY_PARAMS.POPULATE_MUST_BE_STRING,
					400,
				);
				res.status(400).json(errorResponse);
				return;
			}

			locationLogger.info(`${config.SUCCESS.LOCATION.GETTING_BY_ID}: ${id}`);

			const cacheKey = `cache:location:byId:${id}:${fields || "full"}`;
			let location = null;

			try {
				if (redisClient.isClientConnected()) {
					location = await redisClient.getJSON(cacheKey);
					if (location) {
						locationLogger.info(`Location ${id} retrieved from direct Redis cache`);
					}
				}
			} catch (cacheError) {
				locationLogger.warn(`Redis cache retrieval failed for location ${id}:`, cacheError);
			}

			if (!location) {
				const query: Prisma.LocationFindFirstArgs = {
					where: { id },
				};

				query.select = getNestedFields(fields);

				location = await prisma.location.findFirst(query);

				if (location && redisClient.isClientConnected()) {
					try {
						await redisClient.setJSON(cacheKey, location, 3600);
						locationLogger.info(`Location ${id} stored in direct Redis cache`);
					} catch (cacheError) {
						locationLogger.warn(
							`Failed to store location ${id} in Redis cache:`,
							cacheError,
						);
					}
				}
			}

			if (!location) {
				locationLogger.error(`${config.ERROR.LOCATION.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.LOCATION.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			locationLogger.info(`${config.SUCCESS.LOCATION.RETRIEVED}: ${(location as any).id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.LOCATION.RETRIEVED,
				location,
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			locationLogger.error(`${config.ERROR.LOCATION.ERROR_GETTING}: ${error}`);
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
				locationLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validationResult = UpdateLocationSchema.safeParse(req.body);

			if (!validationResult.success) {
				const formattedErrors = formatZodErrors(validationResult.error);
				locationLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
				const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
				res.status(400).json(errorResponse);
				return;
			}

			if (Object.keys(req.body).length === 0) {
				locationLogger.error(config.ERROR.COMMON.NO_UPDATE_FIELDS);
				const errorResponse = buildErrorResponse(config.ERROR.COMMON.NO_UPDATE_FIELDS, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validatedData = validationResult.data;

			locationLogger.info(`Updating location: ${id}`);

			const existingLocation = await prisma.location.findFirst({
				where: { id },
			});

			if (!existingLocation) {
				locationLogger.error(`${config.ERROR.LOCATION.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.LOCATION.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Remove undefined values to satisfy Prisma's type requirements
			const prismaData = Object.fromEntries(
				Object.entries(validatedData).filter(([_, value]) => value !== undefined),
			) as Prisma.LocationUpdateInput;

			const updatedLocation = await prisma.location.update({
				where: { id },
				data: prismaData,
			});

			try {
				await invalidateCache.byPattern(`cache:location:byId:${id}:*`);
				await invalidateCache.byPattern("cache:location:list:*");
				locationLogger.info(`Cache invalidated after location ${id} update`);
			} catch (cacheError) {
				locationLogger.warn(
					"Failed to invalidate cache after location update:",
					cacheError,
				);
			}

			locationLogger.info(`${config.SUCCESS.LOCATION.UPDATED}: ${updatedLocation.id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.LOCATION.UPDATED,
				{ location: updatedLocation },
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			locationLogger.error(`${config.ERROR.LOCATION.ERROR_UPDATING}: ${error}`);
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
				locationLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			locationLogger.info(`${config.SUCCESS.LOCATION.DELETED}: ${id}`);

			const existingLocation = await prisma.location.findFirst({
				where: { id },
			});

			if (!existingLocation) {
				locationLogger.error(`${config.ERROR.LOCATION.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.LOCATION.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			await prisma.location.delete({
				where: { id },
			});

			try {
				await invalidateCache.byPattern(`cache:location:byId:${id}:*`);
				await invalidateCache.byPattern("cache:location:list:*");
				locationLogger.info(`Cache invalidated after location ${id} deletion`);
			} catch (cacheError) {
				locationLogger.warn(
					"Failed to invalidate cache after location deletion:",
					cacheError,
				);
			}

			locationLogger.info(`${config.SUCCESS.LOCATION.DELETED}: ${id}`);
			const successResponse = buildSuccessResponse(config.SUCCESS.LOCATION.DELETED, {}, 200);
			res.status(200).json(successResponse);
		} catch (error) {
			locationLogger.error(`${config.ERROR.LOCATION.DELETE_FAILED}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	return { create, getAll, getById, update, remove };
};
