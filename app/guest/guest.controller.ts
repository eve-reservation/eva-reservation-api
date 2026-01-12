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
import { CreateGuestSchema, UpdateGuestSchema } from "../../zod/guest.zod";
import { logActivity } from "../../utils/activityLogger";
import { logAudit } from "../../utils/auditLogger";
import { config } from "../../config/constant";
import { redisClient } from "../../config/redis";
import { invalidateCache } from "../../middleware/cache";

const logger = getLogger();
const guestLogger = logger.child({ module: "guest" });

export const controller = (prisma: PrismaClient) => {
	const create = async (req: Request, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
			guestLogger.info("Original form data:", JSON.stringify(req.body, null, 2));
			requestData = transformFormDataToObject(req.body);
			guestLogger.info(
				"Transformed form data to object structure:",
				JSON.stringify(requestData, null, 2),
			);
		}

		const validation = CreateGuestSchema.safeParse(requestData);
		if (!validation.success) {
			const formattedErrors = formatZodErrors(validation.error.format());
			guestLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
			const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			// Verify reservation exists
			const reservation = await prisma.reservation.findUnique({
				where: { id: validation.data.reservationId },
			});

			if (!reservation) {
				const errorResponse = buildErrorResponse("Reservation not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Verify person exists if personId is provided
			if (validation.data.personId) {
				const person = await prisma.person.findUnique({
					where: { id: validation.data.personId },
				});

				if (!person) {
					const errorResponse = buildErrorResponse("Person not found", 404);
					res.status(404).json(errorResponse);
					return;
				}
			}

			const guest = await prisma.guest.create({ data: validation.data });
			guestLogger.info(`Guest created successfully: ${guest.id}`);

			// Update reservation guest count
			const guestCount = await prisma.guest.count({
				where: {
					reservationId: validation.data.reservationId,
					isDeleted: false,
				},
			});

			await prisma.reservation.update({
				where: { id: validation.data.reservationId },
				data: { guestCount },
			});

			logActivity(req, {
				userId: (req as any).user?.id || "unknown",
				action: "CREATE_GUEST",
				description: `Created guest: ${guest.firstName} ${guest.lastName}`,
				page: {
					url: req.originalUrl,
					title: "Guest Creation",
				},
			});

			logAudit(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.AUDIT_LOG.ACTIONS.CREATE,
				resource: "GUEST",
				severity: config.AUDIT_LOG.SEVERITY.LOW,
				entityType: "GUEST",
				entityId: guest.id,
				changesBefore: null,
				changesAfter: {
					id: guest.id,
					firstName: guest.firstName,
					lastName: guest.lastName,
					reservationId: guest.reservationId,
					createdAt: guest.createdAt,
					updatedAt: guest.updatedAt,
				},
				description: `Created guest: ${guest.firstName} ${guest.lastName}`,
			});

			try {
				await invalidateCache.byPattern("cache:guest:list:*");
				await invalidateCache.byPattern(`cache:guest:byId:${guest.id}:*`);
				await invalidateCache.byPattern(
					`cache:reservation:byId:${validation.data.reservationId}:*`,
				);
				guestLogger.info("Guest list cache invalidated after creation");
			} catch (cacheError) {
				guestLogger.warn("Failed to invalidate cache after guest creation:", cacheError);
			}

			const successResponse = buildSuccessResponse("Guest created successfully", guest, 201);
			res.status(201).json(successResponse);
		} catch (error) {
			guestLogger.error(`Error creating guest: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	const getAll = async (req: Request, res: Response, _next: NextFunction) => {
		const validationResult = validateQueryParams(req, guestLogger);

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

		guestLogger.info(
			`Getting guests, page: ${page}, limit: ${limit}, query: ${query}, order: ${order}, groupBy: ${groupBy}`,
		);

		try {
			// Base where clause
			const whereClause: Prisma.GuestWhereInput = {
				isDeleted: false,
			};

			// Search fields
			const searchFields = ["firstName", "lastName", "email", "phone"];
			if (query) {
				const searchConditions = buildSearchConditions("Guest", query, searchFields);
				if (searchConditions.length > 0) {
					whereClause.OR = searchConditions;
				}
			}

			if (filter) {
				const filterConditions = buildFilterConditions("Guest", filter);
				if (filterConditions.length > 0) {
					whereClause.AND = filterConditions;
				}
			}

			const findManyQuery = buildFindManyQuery(whereClause, skip, limit, order, sort, fields);

			const guestPromise = document
				? prisma.guest.findMany(findManyQuery)
				: Promise.resolve([]);
			const countPromise = count
				? prisma.guest.count({ where: whereClause })
				: Promise.resolve(0);

			const [guests, total] = await Promise.all([guestPromise, countPromise]);

			guestLogger.info(`Retrieved ${guests.length} guests`);
			const processedData =
				groupBy && document ? groupDataByField(guests, groupBy as string) : guests;

			const responseData: Record<string, any> = {
				...(document && { guests: processedData }),
				...(count && { count: total }),
				...(pagination && { pagination: buildPagination(total, page, limit) }),
				...(groupBy && { groupedBy: groupBy }),
			};

			res.status(200).json(
				buildSuccessResponse("Guests retrieved successfully", responseData, 200),
			);
		} catch (error) {
			guestLogger.error(`Error getting guests: ${error}`);
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
				guestLogger.error("Missing guest ID");
				const errorResponse = buildErrorResponse("Missing guest ID", 400);
				res.status(400).json(errorResponse);
				return;
			}

			if (fields && typeof fields !== "string") {
				guestLogger.error(`Invalid fields parameter: ${fields}`);
				const errorResponse = buildErrorResponse("Fields parameter must be a string", 400);
				res.status(400).json(errorResponse);
				return;
			}

			guestLogger.info(`Getting guest by ID: ${id}`);

			const cacheKey = `cache:guest:byId:${id}:${fields || "full"}`;
			let guest = null;

			try {
				if (redisClient.isClientConnected()) {
					guest = await redisClient.getJSON(cacheKey);
					if (guest) {
						guestLogger.info(`Guest ${id} retrieved from direct Redis cache`);
					}
				}
			} catch (cacheError) {
				guestLogger.warn(`Redis cache retrieval failed for guest ${id}:`, cacheError);
			}

			if (!guest) {
				const query: Prisma.GuestFindFirstArgs = {
					where: { id, isDeleted: false },
				};

				query.select = getNestedFields(fields);

				guest = await prisma.guest.findFirst(query);

				if (guest && redisClient.isClientConnected()) {
					try {
						await redisClient.setJSON(cacheKey, guest, 3600);
						guestLogger.info(`Guest ${id} stored in direct Redis cache`);
					} catch (cacheError) {
						guestLogger.warn(`Failed to store guest ${id} in Redis cache:`, cacheError);
					}
				}
			}

			if (!guest) {
				guestLogger.error(`Guest not found: ${id}`);
				const errorResponse = buildErrorResponse("Guest not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			guestLogger.info(`Guest retrieved: ${(guest as any).id}`);
			const successResponse = buildSuccessResponse(
				"Guest retrieved successfully",
				guest,
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			guestLogger.error(`Error getting guest: ${error}`);
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
				guestLogger.error("Missing guest ID");
				const errorResponse = buildErrorResponse("Missing guest ID", 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validationResult = UpdateGuestSchema.safeParse(req.body);

			if (!validationResult.success) {
				const formattedErrors = formatZodErrors(validationResult.error.format());
				guestLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
				const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
				res.status(400).json(errorResponse);
				return;
			}

			if (Object.keys(req.body).length === 0) {
				guestLogger.error("No update fields provided");
				const errorResponse = buildErrorResponse("No update fields provided", 400);
				res.status(400).json(errorResponse);
				return;
			}

			guestLogger.info(`Updating guest: ${id}`);

			const existingGuest = await prisma.guest.findFirst({
				where: { id, isDeleted: false },
			});

			if (!existingGuest) {
				guestLogger.error(`Guest not found: ${id}`);
				const errorResponse = buildErrorResponse("Guest not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Verify person exists if personId is being updated
			if (validationResult.data.personId) {
				const person = await prisma.person.findUnique({
					where: { id: validationResult.data.personId },
				});

				if (!person) {
					const errorResponse = buildErrorResponse("Person not found", 404);
					res.status(404).json(errorResponse);
					return;
				}
			}

			const prismaData = { ...validationResult.data };

			const updatedGuest = await prisma.guest.update({
				where: { id },
				data: prismaData,
			});

			try {
				await invalidateCache.byPattern(`cache:guest:byId:${id}:*`);
				await invalidateCache.byPattern("cache:guest:list:*");
				await invalidateCache.byPattern(
					`cache:reservation:byId:${existingGuest.reservationId}:*`,
				);
				guestLogger.info(`Cache invalidated after guest ${id} update`);
			} catch (cacheError) {
				guestLogger.warn("Failed to invalidate cache after guest update:", cacheError);
			}

			guestLogger.info(`Guest updated: ${updatedGuest.id}`);
			const successResponse = buildSuccessResponse(
				"Guest updated successfully",
				{ guest: updatedGuest },
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			guestLogger.error(`Error updating guest: ${error}`);
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
				guestLogger.error("Missing guest ID");
				const errorResponse = buildErrorResponse("Missing guest ID", 400);
				res.status(400).json(errorResponse);
				return;
			}

			guestLogger.info(`Deleting guest: ${id}`);

			const existingGuest = await prisma.guest.findFirst({
				where: { id, isDeleted: false },
			});

			if (!existingGuest) {
				guestLogger.error(`Guest not found: ${id}`);
				const errorResponse = buildErrorResponse("Guest not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Soft delete
			await prisma.guest.update({
				where: { id },
				data: { isDeleted: true },
			});

			// Update reservation guest count
			const guestCount = await prisma.guest.count({
				where: {
					reservationId: existingGuest.reservationId,
					isDeleted: false,
				},
			});

			await prisma.reservation.update({
				where: { id: existingGuest.reservationId },
				data: { guestCount },
			});

			try {
				await invalidateCache.byPattern(`cache:guest:byId:${id}:*`);
				await invalidateCache.byPattern("cache:guest:list:*");
				await invalidateCache.byPattern(
					`cache:reservation:byId:${existingGuest.reservationId}:*`,
				);
				guestLogger.info(`Cache invalidated after guest ${id} deletion`);
			} catch (cacheError) {
				guestLogger.warn("Failed to invalidate cache after guest deletion:", cacheError);
			}

			guestLogger.info(`Guest deleted: ${id}`);
			const successResponse = buildSuccessResponse("Guest deleted successfully", {}, 200);
			res.status(200).json(successResponse);
		} catch (error) {
			guestLogger.error(`Error deleting guest: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	return { create, getAll, getById, update, remove };
};
