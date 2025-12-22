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
import { CreateAddonSchema, UpdateAddonSchema } from "../../zod/addon.zod";
import { logActivity } from "../../utils/activityLogger";
import { logAudit } from "../../utils/auditLogger";
import { config } from "../../config/constant";
import { redisClient } from "../../config/redis";
import { invalidateCache } from "../../middleware/cache";
import { isValidObjectId } from "mongoose";

const logger = getLogger();
const addonLogger = logger.child({ module: "addon" });

export const controller = (prisma: PrismaClient) => {
	const create = async (req: Request, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
			addonLogger.info("Original form data:", JSON.stringify(req.body, null, 2));
			requestData = transformFormDataToObject(req.body);
			addonLogger.info(
				"Transformed form data to object structure:",
				JSON.stringify(requestData, null, 2),
			);
		}

		const validation = CreateAddonSchema.safeParse(requestData);
		if (!validation.success) {
			const formattedErrors = formatZodErrors(validation.error.format());
			addonLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
			const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			const addon = await prisma.addon.create({ data: validation.data });
			addonLogger.info(`Addon created successfully: ${addon.id}`);

			logActivity(req, {
				userId: (req as any).user?.id || "unknown",
				action: "CREATE_ADDON",
				description: `Addon created: ${addon.name || addon.id}`,
				page: {
					url: req.originalUrl,
					title: "Addon creation",
				},
			});

			logAudit(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.AUDIT_LOG.ACTIONS.CREATE,
				resource: "ADDON",
				severity: config.AUDIT_LOG.SEVERITY.LOW,
				entityType: "ADDON",
				entityId: addon.id,
				changesBefore: null,
				changesAfter: {
					id: addon.id,
					name: addon.name,
					description: addon.description,
					price: addon.price,
					createdAt: addon.createdAt,
					updatedAt: addon.updatedAt,
				},
				description: `Addon created: ${addon.name || addon.id}`,
			});

			try {
				await invalidateCache.byPattern("cache:addon:list:*");
				addonLogger.info("Addon list cache invalidated after creation");
			} catch (cacheError) {
				addonLogger.warn("Failed to invalidate cache after addon creation:", cacheError);
			}

			const successResponse = buildSuccessResponse("Addon created successfully", addon, 201);
			res.status(201).json(successResponse);
		} catch (error) {
			addonLogger.error(`Addon create failed: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	const getAll = async (req: Request, res: Response, _next: NextFunction) => {
		const validationResult = validateQueryParams(req, addonLogger);

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

		addonLogger.info(
			`Getting addons, page: ${page}, limit: ${limit}, query: ${query}, order: ${order}, groupBy: ${groupBy}`,
		);

		try {
			const whereClause: Prisma.AddonWhereInput = {};

			const searchFields = ["name", "description", "currency"];
			if (query) {
				const searchConditions = buildSearchConditions("Addon", query, searchFields);
				if (searchConditions.length > 0) {
					whereClause.OR = searchConditions;
				}
			}

			if (filter) {
				const filterConditions = buildFilterConditions("Addon", filter);
				if (filterConditions.length > 0) {
					whereClause.AND = filterConditions;
				}
			}

			const findManyQuery = buildFindManyQuery(whereClause, skip, limit, order, sort, fields);

			const [addons, total] = await Promise.all([
				document ? prisma.addon.findMany(findManyQuery) : [],
				count ? prisma.addon.count({ where: whereClause }) : 0,
			]);

			addonLogger.info(`Retrieved ${addons.length} addons`);
			const processedData =
				groupBy && document ? groupDataByField(addons, groupBy as string) : addons;

			const responseData: Record<string, any> = {
				...(document && { addons: processedData }),
				...(count && { count: total }),
				...(pagination && { pagination: buildPagination(total, page, limit) }),
				...(groupBy && { groupedBy: groupBy }),
			};

			res.status(200).json(
				buildSuccessResponse("Addons retrieved successfully", responseData, 200),
			);
		} catch (error) {
			addonLogger.error(`Addon getAll failed: ${error}`);
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
				addonLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			if (!isValidObjectId(id)) {
				addonLogger.error(`Invalid addon ID format: ${id}`);
				const errorResponse = buildErrorResponse("Invalid addon ID format", 400, [
					{
						field: "id",
						message:
							'Addon ID must be a valid MongoDB ObjectId (24-character hex string, e.g. "507f1f77bcf86cd799439011")',
					},
				]);
				res.status(400).json(errorResponse);
				return;
			}

			if (fields && typeof fields !== "string") {
				addonLogger.error(`${config.ERROR.QUERY_PARAMS.INVALID_POPULATE}: ${fields}`);
				const errorResponse = buildErrorResponse(
					config.ERROR.QUERY_PARAMS.POPULATE_MUST_BE_STRING,
					400,
				);
				res.status(400).json(errorResponse);
				return;
			}

			addonLogger.info(`Getting addon by id: ${id}`);

			const cacheKey = `cache:addon:byId:${id}:${fields || "full"}`;
			let addon = null;

			try {
				if (redisClient.isClientConnected()) {
					addon = await redisClient.getJSON(cacheKey);
					if (addon) {
						addonLogger.info(`Addon ${id} retrieved from direct Redis cache`);
					}
				}
			} catch (cacheError) {
				addonLogger.warn(`Redis cache retrieval failed for addon ${id}:`, cacheError);
			}

			if (!addon) {
				const query: Prisma.AddonFindFirstArgs = {
					where: { id },
				};

				const selectedFields = getNestedFields(fields);
				if (selectedFields) {
					query.select = selectedFields;
				}

				addon = await prisma.addon.findFirst(query);

				if (addon && redisClient.isClientConnected()) {
					try {
						await redisClient.setJSON(cacheKey, addon, 3600);
						addonLogger.info(`Addon ${id} stored in direct Redis cache`);
					} catch (cacheError) {
						addonLogger.warn(`Failed to store addon ${id} in Redis cache:`, cacheError);
					}
				}
			}

			if (!addon) {
				addonLogger.error(`Addon not found: ${id}`);
				const errorResponse = buildErrorResponse("Addon not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			addonLogger.info(`Addon retrieved: ${(addon as any).id}`);
			const successResponse = buildSuccessResponse(
				"Addon retrieved successfully",
				addon,
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			addonLogger.error(`Error getting addon: ${error}`);
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
				addonLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			if (!isValidObjectId(id)) {
				addonLogger.error(`Invalid addon ID format: ${id}`);
				const errorResponse = buildErrorResponse("Invalid addon ID format", 400, [
					{
						field: "id",
						message:
							'Addon ID must be a valid MongoDB ObjectId (24-character hex string, e.g. "507f1f77bcf86cd799439011")',
					},
				]);
				res.status(400).json(errorResponse);
				return;
			}

			const validationResult = UpdateAddonSchema.safeParse(req.body);

			if (!validationResult.success) {
				const formattedErrors = formatZodErrors(validationResult.error.format());
				addonLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
				const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
				res.status(400).json(errorResponse);
				return;
			}

			if (Object.keys(req.body).length === 0) {
				addonLogger.error(config.ERROR.COMMON.NO_UPDATE_FIELDS);
				const errorResponse = buildErrorResponse(config.ERROR.COMMON.NO_UPDATE_FIELDS, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validatedData = validationResult.data;

			addonLogger.info(`Updating addon: ${id}`);

			const existingAddon = await prisma.addon.findFirst({
				where: { id },
			});

			if (!existingAddon) {
				addonLogger.error(`Addon not found: ${id}`);
				const errorResponse = buildErrorResponse("Addon not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			const prismaData = { ...validatedData };

			const updatedAddon = await prisma.addon.update({
				where: { id },
				data: prismaData,
			});

			try {
				await invalidateCache.byPattern(`cache:addon:byId:${id}:*`);
				await invalidateCache.byPattern("cache:addon:list:*");
				addonLogger.info(`Cache invalidated after addon ${id} update`);
			} catch (cacheError) {
				addonLogger.warn("Failed to invalidate cache after addon update:", cacheError);
			}

			addonLogger.info(`Addon updated: ${updatedAddon.id}`);
			const successResponse = buildSuccessResponse(
				"Addon updated successfully",
				{ addon: updatedAddon },
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			addonLogger.error(`Error updating addon: ${error}`);
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
				addonLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			if (!isValidObjectId(id)) {
				addonLogger.error(`Invalid addon ID format: ${id}`);
				const errorResponse = buildErrorResponse("Invalid addon ID format", 400, [
					{
						field: "id",
						message:
							'Addon ID must be a valid MongoDB ObjectId (24-character hex string, e.g. "507f1f77bcf86cd799439011")',
					},
				]);
				res.status(400).json(errorResponse);
				return;
			}

			addonLogger.info(`Addon delete requested: ${id}`);

			const existingAddon = await prisma.addon.findFirst({
				where: { id },
			});

			if (!existingAddon) {
				addonLogger.error(`Addon not found: ${id}`);
				const errorResponse = buildErrorResponse("Addon not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			await prisma.addon.delete({
				where: { id },
			});

			try {
				await invalidateCache.byPattern(`cache:addon:byId:${id}:*`);
				await invalidateCache.byPattern("cache:addon:list:*");
				addonLogger.info(`Cache invalidated after addon ${id} deletion`);
			} catch (cacheError) {
				addonLogger.warn("Failed to invalidate cache after addon deletion:", cacheError);
			}

			addonLogger.info(`Addon deleted: ${id}`);
			const successResponse = buildSuccessResponse("Addon deleted successfully", {}, 200);
			res.status(200).json(successResponse);
		} catch (error) {
			addonLogger.error(`Addon delete failed: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	return { create, getAll, getById, update, remove };
};
