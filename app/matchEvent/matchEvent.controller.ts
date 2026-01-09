import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
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
import {
	CreateMatchEventSchema,
	UpdateMatchEventSchema,
	CreateMatchParticipantSchema,
	UpdateMatchParticipantSchema,
	JoinMatchEventSchema,
} from "../../zod/matchEvent.zod";
import { logActivity } from "../../utils/activityLogger";
import { logAudit } from "../../utils/auditLogger";
import { config } from "../../config/constant";
import { invalidateCache } from "../../middleware/cache";
import { AuthRequest } from "../../middleware/verifyToken";

const logger = getLogger();
const matchEventLogger = logger.child({ module: "matchEvent" });

export const controller = (prisma: PrismaClient) => {
	// Create a match event for an existing reservation
	const create = async (req: AuthRequest, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
			matchEventLogger.info("Original form data:", JSON.stringify(req.body, null, 2));
			requestData = transformFormDataToObject(req.body);
		}

		const validation = CreateMatchEventSchema.safeParse(requestData);
		if (!validation.success) {
			const formattedErrors = formatZodErrors(validation.error.format());
			matchEventLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
			const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			const userId = req.userId;
			const organizationId = req.organizationId || validation.data.organizationId;

			// Verify reservation exists and belongs to the user (or user has permission)
			const reservation = await prisma.reservation.findUnique({
				where: { id: validation.data.reservationId },
				include: { facility: true },
			});

			if (!reservation) {
				const errorResponse = buildErrorResponse("Reservation not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Check if reservation already has a match event
			const existingMatchEvent = await prisma.matchEvent.findUnique({
				where: { reservationId: validation.data.reservationId },
			});

			if (existingMatchEvent) {
				const errorResponse = buildErrorResponse(
					"This reservation already has a match event",
					400,
				);
				res.status(400).json(errorResponse);
				return;
			}

			// Create match event
			const matchEvent = await prisma.matchEvent.create({
				data: {
					...validation.data,
					createdBy:
						// If auth user exists, prioritize constructing createdBy from auth context (secure)
						userId
							? {
									userId,
									firstName: (req as any).user?.firstName,
									lastName: (req as any).user?.lastName,
									email: (req as any).user?.email,
								}
							: // Fallback to payload's createdBy if no auth user (e.g. admin or testing),
								// or if we want to allow payload to override some fields?
								// For now, if userId is missing, use payload.
								validation.data.createdBy || undefined,
					organizationId: organizationId || reservation.organizationId || undefined,
					status: validation.data.status || "OPEN", // Default to OPEN if not specified
				},
				include: {
					reservation: {
						include: {
							facility: true,
						},
					},
					participants: {
						where: {
							status: { in: ["ACCEPTED", "CONFIRMED", "CHECKED_IN"] },
						},
					},
				},
			});

			matchEventLogger.info(`Match event created successfully: ${matchEvent.id}`);

			const successResponse = buildSuccessResponse(
				"Match event created successfully",
				matchEvent,
				201,
			);
			res.status(201).json(successResponse);
		} catch (error) {
			matchEventLogger.error(`Failed to create match event: ${error}`);
			const errorResponse = buildErrorResponse("Failed to create match event", 500);
			res.status(500).json(errorResponse);
		}
	};

	// Get match event by ID
	const getById = async (req: Request, res: Response, _next: NextFunction) => {
		try {
			const { id } = req.params;
			const { fields } = req.query;

			if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
				const errorResponse = buildErrorResponse("Invalid match event ID", 400);
				res.status(400).json(errorResponse);
				return;
			}

			const query: Prisma.MatchEventFindUniqueArgs = {
				where: { id },
			};

			const selectedFields = getNestedFields(fields as string);
			if (selectedFields) {
				// If using select, add relations to the select object
				query.select = {
					...selectedFields,
					reservation: {
						select: {
							id: true,
							facilityId: true,
							status: true,
							guestCount: true,
							bookingPeriod: true,
							confirmationCode: true,
							facility: {
								select: {
									id: true,
									identifier: true,
									displayName: true,
									spaceType: true,
									subtype: true,
								},
							},
						},
					},
					participants: {
						select: {
							id: true,
							user: true,
							status: true,
							joinedAt: true,
						},
					},
				};
			} else {
				// If not using select, use include
				query.include = {
					reservation: {
						include: {
							facility: true,
						},
					},
					participants: true,
				};
			}

			const matchEvent = await prisma.matchEvent.findUnique(query);

			if (!matchEvent) {
				const errorResponse = buildErrorResponse("Match event not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			const successResponse = buildSuccessResponse("Match event retrieved successfully", {
				matchEvent,
			});
			res.status(200).json(successResponse);
		} catch (error) {
			matchEventLogger.error(`Failed to get match event: ${error}`);
			const errorResponse = buildErrorResponse("Failed to get match event", 500);
			res.status(500).json(errorResponse);
		}
	};

	// Get all match events (with filtering, pagination, etc.)
	const getAll = async (req: Request, res: Response, _next: NextFunction) => {
		try {
			const validationResult = validateQueryParams(req, matchEventLogger);

			if (!validationResult.isValid) {
				res.status(400).json(validationResult.errorResponse);
				return;
			}

			const {
				page,
				limit,
				sort,
				order,
				query,
				filter,
				fields,
				groupBy,
				document,
				pagination,
				count,
				skip,
			} = validationResult.validatedParams!;

			// Build filter conditions
			let whereConditions: Prisma.MatchEventWhereInput = {};

			// Apply search query
			if (query) {
				whereConditions = {
					...whereConditions,
					OR: [
						{ title: { contains: query, mode: "insensitive" } },
						{ description: { contains: query, mode: "insensitive" } },
					],
				};
			}

			// Apply filter conditions
			if (filter) {
				const filterConditions = buildFilterConditions("MatchEvent", filter);
				if (filterConditions.length > 0) {
					whereConditions.AND = filterConditions;
				}
			}

			// Only show public events by default (unless filtering by isPublic or createdBy)
			// Check if filter contains isPublic or createdBy
			const hasIsPublicFilter = filter && filter.includes("isPublic:");
			const hasCreatedByFilter = filter && filter.includes("createdBy:");
			if (!hasIsPublicFilter && !hasCreatedByFilter) {
				whereConditions.isPublic = true;
			}

			// Build query
			const findManyQuery = buildFindManyQuery(
				whereConditions,
				skip,
				limit,
				order,
				sort,
				fields,
				"MatchEvent",
			);

			// Add relations
			// If select is present, we must add relations to select (cannot use include)
			if (findManyQuery.select) {
				findManyQuery.select = {
					...findManyQuery.select,
					// Always select necessary fields for calculation if not already selected
					maxParticipants: true,

					participants: {
						where: {
							status: { in: ["ACCEPTED", "CONFIRMED", "CHECKED_IN"] },
						},
					},
					_count: {
						select: {
							participants: {
								where: {
									status: { in: ["ACCEPTED", "CONFIRMED", "CHECKED_IN"] },
								},
							},
						},
					},
				};
			} else {
				// Use include if no select is present
				findManyQuery.include = {
					reservation: true,
					participants: {
						where: {
							status: { in: ["ACCEPTED", "CONFIRMED", "CHECKED_IN"] },
						},
					},
					_count: {
						select: {
							participants: {
								where: {
									status: { in: ["ACCEPTED", "CONFIRMED", "CHECKED_IN"] },
								},
							},
						},
					},
				};
			}

			const [matchEvents, totalCount] = await Promise.all([
				document ? prisma.matchEvent.findMany(findManyQuery) : Promise.resolve([]),
				count ? prisma.matchEvent.count({ where: whereConditions }) : Promise.resolve(0),
			]);

			// Group data if requested
			let groupedData: any = {};
			if (groupBy && document) {
				groupedData = groupDataByField(matchEvents, groupBy);
			}

			const responseData: any = {};
			if (document) {
				if (groupBy) {
					responseData.groups = groupedData;
				} else {
					// enrich match events with spots left
					responseData.matchEvents = matchEvents.map((event: any) => {
						const confirmedParticipantsCount = event._count?.participants || 0;
						const spotsLeft = Math.max(
							0,
							event.maxParticipants - confirmedParticipantsCount,
						);
						return {
							...event,
							spotsLeft,
						};
					});
				}
			}
			if (count) {
				responseData.count = totalCount;
			}
			if (pagination) {
				responseData.pagination = buildPagination(page, limit, totalCount);
			}

			const successResponse = buildSuccessResponse(
				"Match events retrieved successfully",
				responseData,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			matchEventLogger.error(`Failed to get match events: ${error}`);
			const errorResponse = buildErrorResponse("Failed to get match events", 500);
			res.status(500).json(errorResponse);
		}
	};

	// Update match event
	const update = async (req: AuthRequest, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
			requestData = transformFormDataToObject(req.body);
		}

		const validation = UpdateMatchEventSchema.safeParse(requestData);
		if (!validation.success) {
			const formattedErrors = formatZodErrors(validation.error.format());
			const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			const { id } = req.params;
			const userId = req.userId;

			// Check if match event exists and user has permission
			const existingMatchEvent = await prisma.matchEvent.findUnique({
				where: { id },
			});

			if (!existingMatchEvent) {
				const errorResponse = buildErrorResponse("Match event not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Check if user is the creator (simple authorization check)
			if (
				existingMatchEvent.createdBy?.userId &&
				existingMatchEvent.createdBy.userId !== userId
			) {
				const errorResponse = buildErrorResponse(
					"Unauthorized to update this match event",
					403,
				);
				res.status(403).json(errorResponse);
				return;
			}

			const matchEvent = await prisma.matchEvent.update({
				where: { id },
				data: validation.data,
				include: {
					reservation: {
						include: {
							facility: true,
						},
					},
					participants: true,
				},
			});

			// Update status to FULL if participants reach max
			const participantCount = await prisma.matchParticipant.count({
				where: {
					matchEventId: id,
					status: { in: ["ACCEPTED", "CONFIRMED", "CHECKED_IN"] },
				},
			});

			if (participantCount >= matchEvent.maxParticipants && matchEvent.status === "OPEN") {
				await prisma.matchEvent.update({
					where: { id },
					data: { status: "FULL" },
				});
				matchEvent.status = "FULL";
			}

			matchEventLogger.info(`Match event updated successfully: ${matchEvent.id}`);

			// Invalidate cache
			try {
				await invalidateCache.byPattern("cache:matchEvent:list:*");
				await invalidateCache.byPattern(`cache:matchEvent:byId:${id}:*`);
			} catch (cacheError) {
				matchEventLogger.warn("Failed to invalidate cache:", cacheError);
			}

			const successResponse = buildSuccessResponse("Match event updated successfully", {
				matchEvent,
			});
			res.status(200).json(successResponse);
		} catch (error) {
			matchEventLogger.error(`Failed to update match event: ${error}`);
			const errorResponse = buildErrorResponse("Failed to update match event", 500);
			res.status(500).json(errorResponse);
		}
	};

	// Delete match event
	const remove = async (req: AuthRequest, res: Response, _next: NextFunction) => {
		try {
			const { id } = req.params;
			const userId = req.userId;

			const existingMatchEvent = await prisma.matchEvent.findUnique({
				where: { id },
			});

			if (!existingMatchEvent) {
				const errorResponse = buildErrorResponse("Match event not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Check if user is the creator
			if (
				existingMatchEvent.createdBy?.userId &&
				existingMatchEvent.createdBy.userId !== userId
			) {
				const errorResponse = buildErrorResponse(
					"Unauthorized to delete this match event",
					403,
				);
				res.status(403).json(errorResponse);
				return;
			}

			await prisma.matchEvent.delete({
				where: { id },
			});

			matchEventLogger.info(`Match event deleted successfully: ${id}`);

			// Invalidate cache
			try {
				await invalidateCache.byPattern("cache:matchEvent:list:*");
				await invalidateCache.byPattern(`cache:matchEvent:byId:${id}:*`);
			} catch (cacheError) {
				matchEventLogger.warn("Failed to invalidate cache:", cacheError);
			}

			const successResponse = buildSuccessResponse("Match event deleted successfully", {});
			res.status(200).json(successResponse);
		} catch (error) {
			matchEventLogger.error(`Failed to delete match event: ${error}`);
			const errorResponse = buildErrorResponse("Failed to delete match event", 500);
			res.status(500).json(errorResponse);
		}
	};

	// Join a match event
	const joinEvent = async (req: AuthRequest, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		// Get matchEventId from params if not in body (for /:id/join endpoint)
		if (!requestData.matchEventId && req.params.id) {
			requestData = { ...requestData, matchEventId: req.params.id };
		}

		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
			requestData = transformFormDataToObject(requestData);
		}

		try {
			// Validate request with JoinMatchEventSchema (includes groupMembers)
			const validation = JoinMatchEventSchema.safeParse(requestData);
			if (!validation.success) {
				const formattedErrors = formatZodErrors(validation.error.format());
				const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
				res.status(400).json(errorResponse);
				return;
			}

			// Check if user is authenticated
			const authUserId = (req as AuthRequest).userId;

			// Get userId from request body (public join) or from auth (authenticated join)
			// If no userId/personId but groupMembers exist, allow joining as a group without main user
			const userId = validation.data.user?.userId || authUserId || undefined;
			const personId = validation.data.personId || undefined;
			const matchEventId = validation.data.matchEventId;
			const notes = validation.data.notes;
			const groupMembers = validation.data.groupMembers || [];

			// Validate: must have at least userId, personId, or groupMembers
			if (!userId && !personId && groupMembers.length === 0) {
				const errorResponse = buildErrorResponse(
					"Either userId, personId, or groupMembers must be provided",
					400,
				);
				res.status(400).json(errorResponse);
				return;
			}

			// Get match event
			const matchEvent = await prisma.matchEvent.findUnique({
				where: { id: matchEventId },
				include: {
					participants: {
						where: {
							status: { in: ["ACCEPTED", "CONFIRMED", "CHECKED_IN", "PENDING"] },
						},
					},
				},
			});

			if (!matchEvent) {
				const errorResponse = buildErrorResponse("Match event not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Check if event is open for joining
			if (!["OPEN", "FULL"].includes(matchEvent.status)) {
				const errorResponse = buildErrorResponse(
					`Cannot join event with status: ${matchEvent.status}`,
					400,
				);
				res.status(400).json(errorResponse);
				return;
			}

			// Check if user already joined (by userId or personId)
			const whereCondition: any = {
				matchEventId,
				status: { not: "REJECTED" },
			};

			if (userId && personId) {
				whereCondition.OR = [{ user: { userId } }, { personId }];
			} else if (userId) {
				whereCondition.user = { userId };
			} else if (personId) {
				whereCondition.personId = personId;
			}

			const existingParticipant = await prisma.matchParticipant.findFirst({
				where: whereCondition,
			});

			if (existingParticipant) {
				const errorResponse = buildErrorResponse("You have already joined this event", 400);
				res.status(400).json(errorResponse);
				return;
			}

			// Count current accepted participants
			const acceptedCount = matchEvent.participants.filter(
				(p) =>
					p.status === "ACCEPTED" ||
					p.status === "CONFIRMED" ||
					p.status === "CHECKED_IN",
			).length;

			// Calculate total participants being added (main user + group members)
			const totalNewParticipants = (userId || personId ? 1 : 0) + groupMembers.length;
			const totalAfterJoin = acceptedCount + totalNewParticipants;

			// Determine participant status based on capacity
			let participantStatus: "PENDING" | "ACCEPTED" | "WAITLIST" = "PENDING";
			if (matchEvent.autoAccept) {
				if (totalAfterJoin <= matchEvent.maxParticipants) {
					// All participants can be accepted
					participantStatus = "ACCEPTED";
				} else if (matchEvent.allowWaitlist) {
					// Some or all go to waitlist
					participantStatus = "WAITLIST";
				} else {
					const errorResponse = buildErrorResponse(
						`Event does not have enough space for ${totalNewParticipants} participants. Available: ${matchEvent.maxParticipants - acceptedCount}`,
						400,
					);
					res.status(400).json(errorResponse);
					return;
				}
			} else {
				// Manual approval required - check if there's any space
				if (totalAfterJoin > matchEvent.maxParticipants && !matchEvent.allowWaitlist) {
					const errorResponse = buildErrorResponse(
						`Event does not have enough space for ${totalNewParticipants} participants. Available: ${matchEvent.maxParticipants - acceptedCount}`,
						400,
					);
					res.status(400).json(errorResponse);
					return;
				}
			}

			// Create Person records for unregistered group members
			const createdPersonIds: string[] = [];
			if (groupMembers.length > 0) {
				const organizationId = matchEvent.organizationId || undefined;

				for (const member of groupMembers) {
					const person = await prisma.person.create({
						data: {
							organizationId: organizationId || "",
							personalInfo: {
								firstName: member.firstName,
								lastName: member.lastName,
							},
							contactInfo: {
								email: member.email || undefined,
								phones: member.phone
									? [
											{
												type: "mobile",
												number: member.phone,
												isPrimary: true,
											},
										]
									: [],
							},
							metadata: {
								isActive: true,
								isDeleted: false,
							},
						},
					});
					createdPersonIds.push(person.id);
				}
			}

			// Create participants - main user (if provided) + group members
			const participantsToCreate: any[] = [];

			// Add main user participant if userId or personId provided
			if (userId || personId) {
				participantsToCreate.push({
					matchEventId,
					user: userId
						? {
								userId,
								// We might want to fetch user details here if possible, but for now just ID
								// Or query user service? But we don't have it here easily.
								// Assuming basic info for now or we trust the schema validation handled it?
								// Actually better to fetch user details from auth middleware if available
								firstName: (req as any).user?.firstName,
								lastName: (req as any).user?.lastName,
								email: (req as any).user?.email,
							}
						: undefined,
					personId: personId || undefined,
					status: participantStatus,
					notes: notes || undefined,
					acceptedAt: participantStatus === "ACCEPTED" ? new Date() : undefined,
					metadata: groupMembers.length > 0 ? { isGroupLeader: true } : undefined,
				});
			}

			// Add group members as participants
			for (const personId of createdPersonIds) {
				participantsToCreate.push({
					matchEventId,
					personId,
					status: participantStatus,
					notes: `Group member added by ${userId || personId || "user"}`,
					acceptedAt: participantStatus === "ACCEPTED" ? new Date() : undefined,
					metadata: { isGroupMember: true, groupLeader: userId || personId },
				});
			}

			// Create all participants in a transaction
			const createdParticipants = await Promise.all(
				participantsToCreate.map((data) =>
					prisma.matchParticipant.create({
						data,
						include: {
							matchEvent: {
								include: {
									reservation: {
										include: {
											facility: true,
										},
									},
								},
							},
						},
					}),
				),
			);

			// Update match event status if needed
			const newAcceptedCount =
				acceptedCount + (participantStatus === "ACCEPTED" ? totalNewParticipants : 0);
			if (newAcceptedCount >= matchEvent.maxParticipants && matchEvent.status === "OPEN") {
				await prisma.matchEvent.update({
					where: { id: matchEventId },
					data: { status: "FULL" },
				});
			}

			matchEventLogger.info(
				`User ${userId || personId || "group"} joined match event ${matchEventId} with ${totalNewParticipants} participant(s), status: ${participantStatus}`,
			);

			const successResponse = buildSuccessResponse(
				`Successfully joined match event with ${totalNewParticipants} participant(s). Status: ${participantStatus}`,
				{
					participants: createdParticipants,
					totalParticipants: totalNewParticipants,
					groupMembers: groupMembers.length,
				},
				201,
			);
			res.status(201).json(successResponse);
		} catch (error) {
			matchEventLogger.error(`Failed to join match event: ${error}`);
			const errorResponse = buildErrorResponse("Failed to join match event", 500);
			res.status(500).json(errorResponse);
		}
	};

	// Leave a match event
	const leaveEvent = async (req: AuthRequest, res: Response, _next: NextFunction) => {
		try {
			const { id } = req.params; // matchEventId
			const userId = req.userId;

			if (!userId) {
				const errorResponse = buildErrorResponse("User authentication required", 401);
				res.status(401).json(errorResponse);
				return;
			}

			const participant = await prisma.matchParticipant.findFirst({
				where: {
					matchEventId: id,
					user: { userId },
					status: { notIn: ["REJECTED", "LEFT"] },
				},
			});

			if (!participant) {
				const errorResponse = buildErrorResponse(
					"You are not a participant in this event",
					404,
				);
				res.status(404).json(errorResponse);
				return;
			}

			await prisma.matchParticipant.update({
				where: { id: participant.id },
				data: {
					status: "LEFT",
					leftAt: new Date(),
				},
			});

			// Update match event status if it was FULL and now has space
			const matchEvent = await prisma.matchEvent.findUnique({
				where: { id },
				include: {
					participants: {
						where: {
							status: { in: ["ACCEPTED", "CONFIRMED", "CHECKED_IN"] },
						},
					},
				},
			});

			if (matchEvent && matchEvent.status === "FULL") {
				const acceptedCount = matchEvent.participants.length;
				if (acceptedCount < matchEvent.maxParticipants) {
					await prisma.matchEvent.update({
						where: { id },
						data: { status: "OPEN" },
					});
				}
			}

			matchEventLogger.info(`User ${userId} left match event ${id}`);

			const successResponse = buildSuccessResponse("Successfully left match event", {});
			res.status(200).json(successResponse);
		} catch (error) {
			matchEventLogger.error(`Failed to leave match event: ${error}`);
			const errorResponse = buildErrorResponse("Failed to leave match event", 500);
			res.status(500).json(errorResponse);
		}
	};

	// Update participant status (for event creator to accept/reject)
	const updateParticipant = async (req: AuthRequest, res: Response, _next: NextFunction) => {
		let requestData = req.body;
		const contentType = req.get("Content-Type") || "";

		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
			requestData = transformFormDataToObject(req.body);
		}

		const validation = UpdateMatchParticipantSchema.safeParse(requestData);
		if (!validation.success) {
			const formattedErrors = formatZodErrors(validation.error.format());
			const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			const { participantId } = req.params;
			const userId = req.userId;

			// Get participant with match event
			const participant = await prisma.matchParticipant.findUnique({
				where: { id: participantId },
				include: {
					matchEvent: true,
				},
			});

			if (!participant) {
				const errorResponse = buildErrorResponse("Participant not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Check if user is the event creator (allow if createdBy is null for public events)
			if (
				participant.matchEvent.createdBy?.userId &&
				participant.matchEvent.createdBy.userId !== userId &&
				userId // Only check if user is authenticated
			) {
				const errorResponse = buildErrorResponse(
					"Only the event creator can update participant status",
					403,
				);
				res.status(403).json(errorResponse);
				return;
			}

			// Check if this is a group leader being approved
			const participantMetadata = participant.metadata as any;
			const isGroupLeader =
				participantMetadata &&
				typeof participantMetadata === "object" &&
				"isGroupLeader" in participantMetadata &&
				participantMetadata.isGroupLeader === true;

			const isApprovingToAccepted =
				validation.data.status === "ACCEPTED" && participant.status !== "ACCEPTED";

			// Validate maxParticipants limit BEFORE updating
			if (isApprovingToAccepted) {
				// Get current accepted count
				const currentAcceptedCount = await prisma.matchParticipant.count({
					where: {
						matchEventId: participant.matchEventId,
						status: { in: ["ACCEPTED", "CONFIRMED", "CHECKED_IN"] },
					},
				});

				// Check if there's space for this participant
				if (currentAcceptedCount >= participant.matchEvent.maxParticipants) {
					const errorResponse = buildErrorResponse(
						`Cannot approve participant: Event is full. Maximum ${participant.matchEvent.maxParticipants} participants allowed, but ${currentAcceptedCount} are already accepted.`,
						400,
					);
					res.status(400).json(errorResponse);
					return;
				}

				// If approving a group leader, check if there's space for all group members too
				if (isGroupLeader) {
					const leaderId = participant.user?.userId || participant.personId;
					if (leaderId) {
						// Find group members that would be auto-approved
						const allParticipants = await prisma.matchParticipant.findMany({
							where: {
								matchEventId: participant.matchEventId,
								id: { not: participantId },
								status: { in: ["PENDING", "WAITLIST", "REJECTED"] },
							},
						});

						const groupMembers = allParticipants.filter((member) => {
							const memberMetadata = member.metadata as any;
							if (!memberMetadata || typeof memberMetadata !== "object") {
								return false;
							}
							return (
								memberMetadata.groupLeader === leaderId ||
								(memberMetadata.isGroupMember === true &&
									(member.user?.userId === leaderId ||
										member.personId === leaderId))
							);
						});

						// Calculate total participants that would be accepted (leader + group members)
						const totalToAccept = 1 + groupMembers.length; // 1 for leader + group members

						if (
							currentAcceptedCount + totalToAccept >
							participant.matchEvent.maxParticipants
						) {
							const availableSpots =
								participant.matchEvent.maxParticipants - currentAcceptedCount;
							const errorResponse = buildErrorResponse(
								`Cannot approve group leader: Event would exceed maximum participants. Maximum ${participant.matchEvent.maxParticipants} participants allowed, ${currentAcceptedCount} already accepted. Only ${availableSpots} spot(s) available, but trying to approve ${totalToAccept} participant(s) (1 leader + ${groupMembers.length} group members).`,
								400,
							);
							res.status(400).json(errorResponse);
							return;
						}
					}
				}
			}

			// Update participant
			const updateData: any = { ...validation.data };
			const acceptedTimestamp = new Date();
			if (updateData.status === "ACCEPTED" && !participant.acceptedAt) {
				updateData.acceptedAt = acceptedTimestamp;
			}
			if (updateData.status === "CONFIRMED" && !participant.confirmedAt) {
				updateData.confirmedAt = new Date();
			}

			const updatedParticipant = await prisma.matchParticipant.update({
				where: { id: participantId },
				data: updateData,
				include: {
					matchEvent: {
						include: {
							reservation: {
								include: {
									facility: true,
								},
							},
						},
					},
				},
			});

			// If approving a group leader, automatically approve all group members
			let approvedGroupMembers: any[] = [];
			if (isGroupLeader && isApprovingToAccepted) {
				// Find the group leader's userId or personId
				const leaderId = participant.user?.userId || participant.personId;

				if (leaderId) {
					// Fetch all participants for this event that are not already accepted/confirmed
					const allParticipants = await prisma.matchParticipant.findMany({
						where: {
							matchEventId: participant.matchEventId,
							id: { not: participantId }, // Exclude the leader
							status: { in: ["PENDING", "WAITLIST", "REJECTED"] }, // Only update non-accepted members
						},
					});

					// Filter to find group members (check metadata for groupLeader or isGroupMember)
					const groupMembers = allParticipants.filter((member) => {
						const memberMetadata = member.metadata as any;
						if (!memberMetadata || typeof memberMetadata !== "object") {
							return false;
						}

						// Check if this member belongs to the leader's group
						return (
							memberMetadata.groupLeader === leaderId ||
							(memberMetadata.isGroupMember === true &&
								(member.user?.userId === leaderId || member.personId === leaderId))
						);
					});

					// Update group members to ACCEPTED, but only up to the available space
					if (groupMembers.length > 0) {
						// Get current accepted count after leader was accepted
						const acceptedAfterLeader = await prisma.matchParticipant.count({
							where: {
								matchEventId: participant.matchEventId,
								status: { in: ["ACCEPTED", "CONFIRMED", "CHECKED_IN"] },
							},
						});

						// Calculate how many group members we can actually approve
						const availableSpots =
							participant.matchEvent.maxParticipants - acceptedAfterLeader;
						const membersToApprove = Math.min(groupMembers.length, availableSpots);

						if (membersToApprove > 0) {
							const membersToUpdate = groupMembers.slice(0, membersToApprove);
							const groupMemberUpdates = membersToUpdate.map((member) =>
								prisma.matchParticipant.update({
									where: { id: member.id },
									data: {
										status: "ACCEPTED",
										acceptedAt: member.acceptedAt || acceptedTimestamp,
										notes: member.notes || `Auto-approved with group leader`,
									},
								}),
							);

							approvedGroupMembers = await Promise.all(groupMemberUpdates);
							matchEventLogger.info(
								`Auto-approved ${membersToApprove} of ${groupMembers.length} group members when approving leader ${participantId}`,
							);

							// If not all members could be approved, log a warning
							if (membersToApprove < groupMembers.length) {
								const remaining = groupMembers.length - membersToApprove;
								matchEventLogger.warn(
									`Could not approve ${remaining} group member(s) due to maxParticipants limit. Event is now full.`,
								);
							}
						}
					}
				}
			}

			// Update match event status if needed
			const acceptedCount = await prisma.matchParticipant.count({
				where: {
					matchEventId: participant.matchEventId,
					status: { in: ["ACCEPTED", "CONFIRMED", "CHECKED_IN"] },
				},
			});

			// Update event status based on participant count
			let newEventStatus = participant.matchEvent.status;
			if (acceptedCount >= participant.matchEvent.maxParticipants) {
				newEventStatus = "FULL";
			} else if (
				acceptedCount < participant.matchEvent.maxParticipants &&
				participant.matchEvent.status === "FULL"
			) {
				newEventStatus = "OPEN"; // Reopen event if space available
			}

			if (newEventStatus !== participant.matchEvent.status) {
				await prisma.matchEvent.update({
					where: { id: participant.matchEventId },
					data: { status: newEventStatus },
				});
			}

			matchEventLogger.info(`Participant ${participantId} updated successfully`);

			const responseData: any = {
				participant: updatedParticipant,
			};

			// Include group members if any were auto-approved
			if (approvedGroupMembers.length > 0) {
				responseData.autoApprovedGroupMembers = approvedGroupMembers;
				responseData.totalAutoApproved = approvedGroupMembers.length;
			}

			const successResponse = buildSuccessResponse(
				approvedGroupMembers.length > 0
					? `Participant updated successfully. Auto-approved ${approvedGroupMembers.length} group member(s).`
					: "Participant updated successfully",
				responseData,
			);
			res.status(200).json(successResponse);
		} catch (error) {
			matchEventLogger.error(`Failed to update participant: ${error}`);
			const errorResponse = buildErrorResponse("Failed to update participant", 500);
			res.status(500).json(errorResponse);
		}
	};

	// Get participants for a match event
	const getParticipants = async (req: Request, res: Response, _next: NextFunction) => {
		try {
			const { id } = req.params; // matchEventId
			const { status, fields } = req.query as any;

			// Verify match event exists
			const matchEvent = await prisma.matchEvent.findUnique({
				where: { id },
			});

			if (!matchEvent) {
				const errorResponse = buildErrorResponse("Match event not found", 404);
				res.status(404).json(errorResponse);
				return;
			}

			const where: Prisma.MatchParticipantWhereInput = {
				matchEventId: id,
			};

			if (status) {
				where.status = status as any;
			}

			const selectFields = fields ? getNestedFields(fields) : undefined;

			const participants = await prisma.matchParticipant.findMany({
				where,
				select: selectFields,
				orderBy: {
					joinedAt: "asc",
				},
			});

			const successResponse = buildSuccessResponse("Participants retrieved successfully", {
				participants,
				total: participants.length,
			});
			res.status(200).json(successResponse);
		} catch (error) {
			matchEventLogger.error(`Failed to get participants: ${error}`);
			const errorResponse = buildErrorResponse("Failed to get participants", 500);
			res.status(500).json(errorResponse);
		}
	};

	return {
		create,
		getById,
		getAll,
		update,
		remove,
		joinEvent,
		leaveEvent,
		updateParticipant,
		getParticipants,
	};
};
