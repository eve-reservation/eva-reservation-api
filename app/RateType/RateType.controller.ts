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
import { CreateRateTypeSchema, UpdateRateTypeSchema } from "../../zod/RateType.zod";
import { logActivity } from "../../utils/activityLogger";
import { logAudit } from "../../utils/auditLogger";
import { config } from "../../config/constant";
import { redisClient } from "../../config/redis";
import { invalidateCache } from "../../middleware/cache";

const logger = getLogger();
const RateTypeLogger = logger.child({ module: "RateType" });

export const controller = (prisma: PrismaClient) => {
	const create = async (req: Request, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
			RateTypeLogger.info("Original form data:", JSON.stringify(req.body, null, 2));
			requestData = transformFormDataToObject(req.body);
			RateTypeLogger.info(
				"Transformed form data to object structure:",
				JSON.stringify(requestData, null, 2),
			);
		}

		const validation = CreateRateTypeSchema.safeParse(requestData);
		if (!validation.success) {
			const formattedErrors = formatZodErrors(validation.error.format());
			RateTypeLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
			const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			const RateType = await prisma.rateType.create({ data: validation.data });
			RateTypeLogger.info(`RateType created successfully: ${RateType.id}`);

			logActivity(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.ACTIVITY_LOG.RATETYPE.ACTIONS.CREATE_RATETYPE,
				description: `${config.ACTIVITY_LOG.RATETYPE.DESCRIPTIONS.RATETYPE_CREATED}: ${RateType.name || RateType.id}`,
				page: {
					url: req.originalUrl,
					title: config.ACTIVITY_LOG.RATETYPE.PAGES.RATETYPE_CREATION,
				},
			});

			logAudit(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.AUDIT_LOG.ACTIONS.CREATE,
				resource: config.AUDIT_LOG.RESOURCES.RATETYPE,
				severity: config.AUDIT_LOG.SEVERITY.LOW,
				entityType: config.AUDIT_LOG.ENTITY_TYPES.RATETYPE,
				entityId: RateType.id,
				changesBefore: null,
				changesAfter: {
					id: RateType.id,
					name: RateType.name,
					description: RateType.description,
					createdAt: RateType.createdAt,
					updatedAt: RateType.updatedAt,
				},
				description: `${config.AUDIT_LOG.RATETYPE.DESCRIPTIONS.RATETYPE_CREATED}: ${RateType.name || RateType.id}`,
			});

			try {
				await invalidateCache.byPattern("cache:RateType:list:*");
				RateTypeLogger.info("RateType list cache invalidated after creation");
			} catch (cacheError) {
				RateTypeLogger.warn(
					"Failed to invalidate cache after RateType creation:",
					cacheError,
				);
			}

			const successResponse = buildSuccessResponse(
				config.SUCCESS.RATETYPE.CREATED,
				RateType,
				201,
			);
			res.status(201).json(successResponse);
		} catch (error) {
			RateTypeLogger.error(`${config.ERROR.RATETYPE.CREATE_FAILED}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};
	const getAll = async (req: Request, res: Response, _next: NextFunction) => {
		const validationResult = validateQueryParams(req, RateTypeLogger);

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

		RateTypeLogger.info(
			`Getting RateTypes, page: ${page}, limit: ${limit}, query: ${query}, order: ${order}, groupBy: ${groupBy}`,
		);

		try {
			// Base where clause
			const whereClause: Prisma.RateTypeWhereInput = {};

			// search fields sample ("name", "description")
			const searchFields = ["name", "description"];
			if (query) {
				const searchConditions = buildSearchConditions("RateType", query, searchFields);
				if (searchConditions.length > 0) {
					whereClause.OR = searchConditions;
				}
			}

			if (filter) {
				const filterConditions = buildFilterConditions("RateType", filter);
				if (filterConditions.length > 0) {
					whereClause.AND = filterConditions;
				}
			}
			const findManyQuery = buildFindManyQuery(whereClause, skip, limit, order, sort, fields);

			const [RateTypes, total] = await Promise.all([
				document ? prisma.rateType.findMany(findManyQuery) : [],
				count ? prisma.rateType.count({ where: whereClause }) : 0,
			]);

			RateTypeLogger.info(`Retrieved ${RateTypes.length} RateTypes`);
			const processedData =
				groupBy && document ? groupDataByField(RateTypes, groupBy as string) : RateTypes;

			const responseData: Record<string, any> = {
				...(document && { RateTypes: processedData }),
				...(count && { count: total }),
				...(pagination && { pagination: buildPagination(total, page, limit) }),
				...(groupBy && { groupedBy: groupBy }),
			};

			res.status(200).json(
				buildSuccessResponse(config.SUCCESS.RATETYPE.RETRIEVED_ALL, responseData, 200),
			);
		} catch (error) {
			RateTypeLogger.error(`${config.ERROR.RATETYPE.GET_ALL_FAILED}: ${error}`);
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
				RateTypeLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			if (fields && typeof fields !== "string") {
				RateTypeLogger.error(`${config.ERROR.QUERY_PARAMS.INVALID_POPULATE}: ${fields}`);
				const errorResponse = buildErrorResponse(
					config.ERROR.QUERY_PARAMS.POPULATE_MUST_BE_STRING,
					400,
				);
				res.status(400).json(errorResponse);
				return;
			}

			RateTypeLogger.info(`${config.SUCCESS.RATETYPE.GETTING_BY_ID}: ${id}`);

			const cacheKey = `cache:RateType:byId:${id}:${fields || "full"}`;
			let RateType = null;

			try {
				if (redisClient.isClientConnected()) {
					RateType = await redisClient.getJSON(cacheKey);
					if (RateType) {
						RateTypeLogger.info(`RateType ${id} retrieved from direct Redis cache`);
					}
				}
			} catch (cacheError) {
				RateTypeLogger.warn(`Redis cache retrieval failed for RateType ${id}:`, cacheError);
			}

			if (!RateType) {
				const query: Prisma.RateTypeFindFirstArgs = {
					where: { id },
				};

				query.select = getNestedFields(fields);

				RateType = await prisma.rateType.findFirst(query);

				if (RateType && redisClient.isClientConnected()) {
					try {
						await redisClient.setJSON(cacheKey, RateType, 3600);
						RateTypeLogger.info(`RateType ${id} stored in direct Redis cache`);
					} catch (cacheError) {
						RateTypeLogger.warn(
							`Failed to store RateType ${id} in Redis cache:`,
							cacheError,
						);
					}
				}
			}

			if (!RateType) {
				RateTypeLogger.error(`${config.ERROR.RATETYPE.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.RATETYPE.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			RateTypeLogger.info(`${config.SUCCESS.RATETYPE.RETRIEVED}: ${(RateType as any).id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.RATETYPE.RETRIEVED,
				RateType,
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			RateTypeLogger.error(`${config.ERROR.RATETYPE.ERROR_GETTING}: ${error}`);
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
				RateTypeLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validationResult = UpdateRateTypeSchema.safeParse(req.body);

			if (!validationResult.success) {
				const formattedErrors = formatZodErrors(validationResult.error.format());
				RateTypeLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
				const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
				res.status(400).json(errorResponse);
				return;
			}

			if (Object.keys(req.body).length === 0) {
				RateTypeLogger.error(config.ERROR.COMMON.NO_UPDATE_FIELDS);
				const errorResponse = buildErrorResponse(config.ERROR.COMMON.NO_UPDATE_FIELDS, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validatedData = validationResult.data;

			RateTypeLogger.info(`Updating RateType: ${id}`);

			const existingRateType = await prisma.rateType.findFirst({
				where: { id },
			});

			if (!existingRateType) {
				RateTypeLogger.error(`${config.ERROR.RATETYPE.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.RATETYPE.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			const prismaData = { ...validatedData };

			const updatedRateType = await prisma.rateType.update({
				where: { id },
				data: prismaData,
			});

			try {
				await invalidateCache.byPattern(`cache:RateType:byId:${id}:*`);
				await invalidateCache.byPattern("cache:RateType:list:*");
				RateTypeLogger.info(`Cache invalidated after RateType ${id} update`);
			} catch (cacheError) {
				RateTypeLogger.warn(
					"Failed to invalidate cache after RateType update:",
					cacheError,
				);
			}

			RateTypeLogger.info(`${config.SUCCESS.RATETYPE.UPDATED}: ${updatedRateType.id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.RATETYPE.UPDATED,
				{ RateType: updatedRateType },
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			RateTypeLogger.error(`${config.ERROR.RATETYPE.ERROR_UPDATING}: ${error}`);
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
				RateTypeLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			RateTypeLogger.info(`${config.SUCCESS.RATETYPE.DELETED}: ${id}`);

			const existingRateType = await prisma.rateType.findFirst({
				where: { id },
			});

			if (!existingRateType) {
				RateTypeLogger.error(`${config.ERROR.RATETYPE.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.RATETYPE.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			await prisma.rateType.delete({
				where: { id },
			});

			try {
				await invalidateCache.byPattern(`cache:RateType:byId:${id}:*`);
				await invalidateCache.byPattern("cache:RateType:list:*");
				RateTypeLogger.info(`Cache invalidated after RateType ${id} deletion`);
			} catch (cacheError) {
				RateTypeLogger.warn(
					"Failed to invalidate cache after RateType deletion:",
					cacheError,
				);
			}

			RateTypeLogger.info(`${config.SUCCESS.RATETYPE.DELETED}: ${id}`);
			const successResponse = buildSuccessResponse(config.SUCCESS.RATETYPE.DELETED, {}, 200);
			res.status(200).json(successResponse);
		} catch (error) {
			RateTypeLogger.error(`${config.ERROR.RATETYPE.DELETE_FAILED}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	return { create, getAll, getById, update, remove };
};
