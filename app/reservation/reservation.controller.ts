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
import { CreateReservationSchema, UpdateReservationSchema } from "../../zod/reservation.zod";
import { logActivity } from "../../utils/activityLogger";
import { logAudit } from "../../utils/auditLogger";
import { checkFacilityReservationConflicts } from "../../helper/reservation-availability";
import { computeReservationPricing } from "../../helper/reservation-pricing";
import { config } from "../../config/constant";
import { redisClient } from "../../config/redis";
import { invalidateCache } from "../../middleware/cache";

const logger = getLogger();
const reservationLogger = logger.child({ module: "reservation" });

export const controller = (prisma: PrismaClient) => {
	const create = async (req: Request, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
			reservationLogger.info("Original form data:", JSON.stringify(req.body, null, 2));
			requestData = transformFormDataToObject(req.body);
			reservationLogger.info(
				"Transformed form data to object structure:",
				JSON.stringify(requestData, null, 2),
			);
		}

		const validation = CreateReservationSchema.safeParse(requestData);
		if (!validation.success) {
			const formattedErrors = formatZodErrors(validation.error.format());
			reservationLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
			const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			// Ensure booking window exists and is available
			const { bookingPeriod, facilityId } = validation.data;
			if (!bookingPeriod?.startDateTime || !bookingPeriod?.endDateTime) {
				const errorResponse = buildErrorResponse(
					"bookingPeriod.startDateTime and bookingPeriod.endDateTime are required",
					400,
				);
				res.status(400).json(errorResponse);
				return;
			}

			// Fetch facility + rateType to compute pricing
			const facility = await prisma.facility.findUnique({
				where: { id: facilityId },
				include: {
					facilityType: {
						include: {
							rateType: true,
						},
					},
				},
			});

			if (!facility) {
				const errorResponse = buildErrorResponse("Facility not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			const availability = await checkFacilityReservationConflicts({
				prisma,
				facilityId,
				startDateTime: bookingPeriod.startDateTime,
				endDateTime: bookingPeriod.endDateTime,
			});

			if (!availability.isAvailable) {
				const conflictErrors = availability.conflicts.map((conflict) => ({
					field: "bookingPeriod",
					message: `Conflicts with reservation ${conflict.id} (${conflict.status}) from ${conflict.bookingPeriod?.startDateTime.toISOString()} to ${conflict.bookingPeriod?.endDateTime.toISOString()}`,
				}));
				const errorResponse = buildErrorResponse(
					"Facility is not available for the selected period",
					409,
					conflictErrors,
				);
				res.status(409).json(errorResponse);
				return;
			}

			// Auto-calculate pricing when rateType is available
			let data = { ...validation.data };
			const rateType = facility.facilityType?.rateType;
			if (rateType) {
				const pricing = computeReservationPricing(
					rateType,
					{
						...bookingPeriod,
						numberOfDays: bookingPeriod.numberOfDays ?? undefined,
						numberOfHours: bookingPeriod.numberOfHours ?? undefined,
						extendedHours: bookingPeriod.extendedHours ?? undefined,
					},
					data.charges || {},
					data.discounts || undefined,
				);

				data = {
					...data,
					pricingBase: pricing.pricingBase,
					charges: pricing.charges,
					taxes: pricing.taxes,
					discounts: pricing.discounts,
					totals: pricing.totals,
					// currency field is not in model; kept for future use if added
				};
			}

			const reservation = await prisma.reservation.create({ data });
			reservationLogger.info(`Reservation created successfully: ${reservation.id}`);

			logActivity(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.ACTIVITY_LOG.RESERVATION.ACTIONS.CREATE_RESERVATION,
				description: `${config.ACTIVITY_LOG.RESERVATION.DESCRIPTIONS.RESERVATION_CREATED}: ${reservation.confirmationCode || reservation.id}`,
				page: {
					url: req.originalUrl,
					title: config.ACTIVITY_LOG.RESERVATION.PAGES.RESERVATION_CREATION,
				},
			});

			logAudit(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.AUDIT_LOG.ACTIONS.CREATE,
				resource: config.AUDIT_LOG.RESOURCES.RESERVATION,
				severity: config.AUDIT_LOG.SEVERITY.LOW,
				entityType: config.AUDIT_LOG.ENTITY_TYPES.RESERVATION,
				entityId: reservation.id,
				changesBefore: null,
				changesAfter: {
					id: reservation.id,
					startDateTime: reservation.bookingPeriod?.startDateTime,
					endDateTime: reservation.bookingPeriod?.endDateTime,
					totalAmount: reservation.totals?.totalAmount,
					createdAt: reservation.createdAt,
					updatedAt: reservation.updatedAt,
				},
				description: `${config.AUDIT_LOG.RESERVATION.DESCRIPTIONS.RESERVATION_CREATED}: ${reservation.confirmationCode || reservation.id}`,
			});

			try {
				await invalidateCache.byPattern("cache:reservation:list:*");
				reservationLogger.info("Reservation list cache invalidated after creation");
			} catch (cacheError) {
				reservationLogger.warn(
					"Failed to invalidate cache after reservation creation:",
					cacheError,
				);
			}

			const successResponse = buildSuccessResponse(
				config.SUCCESS.RESERVATION.CREATED,
				reservation,
				201,
			);
			res.status(201).json(successResponse);
		} catch (error) {
			reservationLogger.error(`${config.ERROR.RESERVATION.CREATE_FAILED}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};
	const getAll = async (req: Request, res: Response, _next: NextFunction) => {
		const validationResult = validateQueryParams(req, reservationLogger);

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

		reservationLogger.info(
			`Getting reservations, page: ${page}, limit: ${limit}, query: ${query}, order: ${order}, groupBy: ${groupBy}`,
		);

		try {
			// Base where clause
			const whereClause: Prisma.ReservationWhereInput = {};

			// search fields sample ("confirmationCode", "bookingSource", "status")
			const searchFields = ["confirmationCode", "bookingSource", "status", "currency"];
			if (query) {
				const searchConditions = buildSearchConditions("Reservation", query, searchFields);
				if (searchConditions.length > 0) {
					whereClause.OR = searchConditions;
				}
			}

			if (filter) {
				const filterConditions = buildFilterConditions("Reservation", filter);
				if (filterConditions.length > 0) {
					whereClause.AND = filterConditions;
				}
			}
			const findManyQuery = buildFindManyQuery(whereClause, skip, limit, order, sort, fields);

			const reservationPromise = document ? prisma.reservation.findMany(findManyQuery) : Promise.resolve([]);
			const countPromise = count ? prisma.reservation.count({ where: whereClause }) : Promise.resolve(0);

			const [reservations, total] = await Promise.all([reservationPromise, countPromise]);

			reservationLogger.info(`Retrieved ${reservations.length} reservations`);
			const processedData =
				groupBy && document ? groupDataByField(reservations, groupBy as string) : reservations;

			const responseData: Record<string, any> = {
				...(document && { reservations: processedData }),
				...(count && { count: total }),
				...(pagination && { pagination: buildPagination(total, page, limit) }),
				...(groupBy && { groupedBy: groupBy }),
			};

			res.status(200).json(
				buildSuccessResponse(config.SUCCESS.RESERVATION.RETRIEVED_ALL, responseData, 200),
			);
		} catch (error) {
			reservationLogger.error(`${config.ERROR.RESERVATION.GET_ALL_FAILED}: ${error}`);
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
				reservationLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			if (fields && typeof fields !== "string") {
				reservationLogger.error(`${config.ERROR.QUERY_PARAMS.INVALID_POPULATE}: ${fields}`);
				const errorResponse = buildErrorResponse(
					config.ERROR.QUERY_PARAMS.POPULATE_MUST_BE_STRING,
					400,
				);
				res.status(400).json(errorResponse);
				return;
			}

			reservationLogger.info(`${config.SUCCESS.RESERVATION.GETTING_BY_ID}: ${id}`);

			const cacheKey = `cache:reservation:byId:${id}:${fields || "full"}`;
			let reservation = null;

			try {
				if (redisClient.isClientConnected()) {
					reservation = await redisClient.getJSON(cacheKey);
					if (reservation) {
						reservationLogger.info(`Reservation ${id} retrieved from direct Redis cache`);
					}
				}
			} catch (cacheError) {
				reservationLogger.warn(`Redis cache retrieval failed for reservation ${id}:`, cacheError);
			}

			if (!reservation) {
				const query: Prisma.ReservationFindFirstArgs = {
					where: { id },
				};

				query.select = getNestedFields(fields);

				reservation = await prisma.reservation.findFirst(query);

				if (reservation && redisClient.isClientConnected()) {
					try {
						await redisClient.setJSON(cacheKey, reservation, 3600);
						reservationLogger.info(`Reservation ${id} stored in direct Redis cache`);
					} catch (cacheError) {
						reservationLogger.warn(
							`Failed to store reservation ${id} in Redis cache:`,
							cacheError,
						);
					}
				}
			}

			if (!reservation) {
				reservationLogger.error(`${config.ERROR.RESERVATION.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.RESERVATION.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			reservationLogger.info(`${config.SUCCESS.RESERVATION.RETRIEVED}: ${(reservation as any).id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.RESERVATION.RETRIEVED,
				reservation,
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			reservationLogger.error(`${config.ERROR.RESERVATION.ERROR_GETTING}: ${error}`);
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
				reservationLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validationResult = UpdateReservationSchema.safeParse(req.body);

			if (!validationResult.success) {
				const formattedErrors = formatZodErrors(validationResult.error.format());
				reservationLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
				const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
				res.status(400).json(errorResponse);
				return;
			}

			if (Object.keys(req.body).length === 0) {
				reservationLogger.error(config.ERROR.COMMON.NO_UPDATE_FIELDS);
				const errorResponse = buildErrorResponse(config.ERROR.COMMON.NO_UPDATE_FIELDS, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validatedData = validationResult.data;

			reservationLogger.info(`Updating reservation: ${id}`);

			const existingReservation = await prisma.reservation.findFirst({
				where: { id },
			});

			if (!existingReservation) {
				reservationLogger.error(`${config.ERROR.RESERVATION.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.RESERVATION.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			const prismaData = { ...validatedData };

			const updatedReservation = await prisma.reservation.update({
				where: { id },
				data: prismaData,
			});

			try {
				await invalidateCache.byPattern(`cache:reservation:byId:${id}:*`);
				await invalidateCache.byPattern("cache:reservation:list:*");
				reservationLogger.info(`Cache invalidated after reservation ${id} update`);
			} catch (cacheError) {
				reservationLogger.warn(
					"Failed to invalidate cache after reservation update:",
					cacheError,
				);
			}

			reservationLogger.info(`${config.SUCCESS.RESERVATION.UPDATED}: ${updatedReservation.id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.RESERVATION.UPDATED,
				{ reservation: updatedReservation },
				200,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			reservationLogger.error(`${config.ERROR.RESERVATION.ERROR_UPDATING}: ${error}`);
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
				reservationLogger.error(config.ERROR.QUERY_PARAMS.MISSING_ID);
				const errorResponse = buildErrorResponse(config.ERROR.QUERY_PARAMS.MISSING_ID, 400);
				res.status(400).json(errorResponse);
				return;
			}

			reservationLogger.info(`${config.SUCCESS.RESERVATION.DELETED}: ${id}`);

			const existingReservation = await prisma.reservation.findFirst({
				where: { id },
			});

			if (!existingReservation) {
				reservationLogger.error(`${config.ERROR.RESERVATION.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.RESERVATION.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			await prisma.reservation.delete({
				where: { id },
			});

			try {
				await invalidateCache.byPattern(`cache:reservation:byId:${id}:*`);
				await invalidateCache.byPattern("cache:reservation:list:*");
				reservationLogger.info(`Cache invalidated after reservation ${id} deletion`);
			} catch (cacheError) {
				reservationLogger.warn(
					"Failed to invalidate cache after reservation deletion:",
					cacheError,
				);
			}

			reservationLogger.info(`${config.SUCCESS.RESERVATION.DELETED}: ${id}`);
			const successResponse = buildSuccessResponse(config.SUCCESS.RESERVATION.DELETED, {}, 200);
			res.status(200).json(successResponse);
		} catch (error) {
			reservationLogger.error(`${config.ERROR.RESERVATION.DELETE_FAILED}: ${error}`);
			const errorResponse = buildErrorResponse(
				config.ERROR.COMMON.INTERNAL_SERVER_ERROR,
				500,
			);
			res.status(500).json(errorResponse);
		}
	};

	return { create, getAll, getById, update, remove };
};
