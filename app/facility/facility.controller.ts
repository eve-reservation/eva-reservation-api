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
import {
	CreateFacilitySchema,
	UpdateFacilitySchema,
	validateFacilityMetadata,
} from "../../zod/facility.zod";
import { logActivity } from "../../utils/activityLogger";
import { logAudit } from "../../utils/auditLogger";
import { DEFAULT_BLOCKING_STATUSES } from "../../helper/reservation-availability";
import { config } from "../../config/constant";
import { redisClient } from "../../config/redis";
import { invalidateCache } from "../../middleware/cache";
import {
	uploadMultipleToCloudinary,
	deleteMultipleFromCloudinary,
	extractPublicIdFromUrl,
} from "../../helper/cloudinary-upload";
import { FacilityImageType } from "../../zod/facilityType.zod";

// Map multipart field names to FacilityImageType enum values
const FACILITY_IMAGE_TYPE_MAP: Record<string, FacilityImageType> = {
	coverImages: "COVER",
	featuredImages: "FEATURED",
	galleryImages: "GALLERY",
	thumbnailImages: "THUMBNAIL",
	floorPlanImages: "FLOOR_PLAN",
	exteriorImages: "EXTERIOR",
	interiorImages: "INTERIOR",
	amenityImages: "AMENITY",
	images: "GALLERY", // fallback for generic images
};

// Structure for uploaded image info for Facility
interface FacilityUploadedImageInfo {
	name: string;
	url: string;
	type: FacilityImageType;
}

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

		// Handle image uploads if files are present (multipart/form-data)
		let facilityImages: FacilityUploadedImageInfo[] = [];
		if (req.files && Object.keys(req.files as any).length > 0) {
			try {
				const files = req.files as { [fieldname: string]: Express.Multer.File[] };

				// Count total images for logging
				let totalImages = 0;
				for (const fieldName of Object.keys(FACILITY_IMAGE_TYPE_MAP)) {
					const fieldFiles = files[fieldName] || [];
					totalImages += fieldFiles.length;
				}

				facilityLogger.info(`Processing ${totalImages} uploaded facility images`);

				// Process each image type field
				for (const [fieldName, imageType] of Object.entries(FACILITY_IMAGE_TYPE_MAP)) {
					const fieldFiles = files[fieldName] || [];
					if (fieldFiles.length === 0) continue;

					const uploadResults = await uploadMultipleToCloudinary(fieldFiles, {
						folder: `facilities/${requestData.organizationId || "default"}/${imageType.toLowerCase()}`,
					});

					for (let index = 0; index < uploadResults.length; index++) {
						const result = uploadResults[index];
						if (result.success && result.secureUrl) {
							const originalName =
								fieldFiles[index].originalname ||
								`${imageType.toLowerCase()}-${index + 1}`;
							const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, "");

							facilityImages.push({
								name: nameWithoutExtension,
								url: result.secureUrl,
								type: imageType,
							});
						}
					}

					facilityLogger.info(
						`Successfully uploaded ${facilityImages.length} facility images (so far) to Cloudinary`,
					);
				}
			} catch (uploadError: any) {
				facilityLogger.error(`Error uploading facility images: ${uploadError.message}`);
				const errorResponse = buildErrorResponse("Failed to upload images", 500, [
					{ field: "images", message: uploadError.message },
				]);
				res.status(500).json(errorResponse);
				return;
			}
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
			// Validate rateTypeId if provided
			if (validation.data.rateTypeId) {
				let rateType = null;
				try {
					rateType = await prisma.rateType.findUnique({
						where: { id: validation.data.rateTypeId },
					});
				} catch (lookupError) {
					facilityLogger.error(
						`RateType lookup failed: ${validation.data.rateTypeId}`,
						lookupError,
					);
					const errorResponse = buildErrorResponse("Unable to verify rateType", 503, [
						{ field: "rateTypeId", message: "Temporary issue verifying rate type" },
					]);
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

			// Verify facilityType exists
			const facilityType = await prisma.facilityType.findUnique({
				where: { id: validation.data.facilityTypeId },
			});

			if (!facilityType) {
				const errorResponse = buildErrorResponse("FacilityType not found", 404, [
					{
						field: "facilityTypeId",
						message: "The specified facilityType does not exist",
					},
				]);
				res.status(404).json(errorResponse);
				return;
			}

			// Validate metadata if provided
			let processedMetadata = validation.data.metadata;
			if (processedMetadata !== undefined) {
				// Handle metadata if it's a string (from form data)
				if (typeof processedMetadata === "string") {
					try {
						processedMetadata = JSON.parse(processedMetadata);
					} catch (error) {
						const errorResponse = buildErrorResponse("Invalid metadata format", 400, [
							{ field: "metadata", message: "Failed to parse metadata JSON" },
						]);
						res.status(400).json(errorResponse);
						return;
					}
				}

				// Validate metadata based on facility's spaceType and subtype
				const metadataValidation = validateFacilityMetadata(
					processedMetadata,
					validation.data.spaceType,
					validation.data.subtype || null,
				);

				if (!metadataValidation.success) {
					const errorResponse = buildErrorResponse("Metadata validation failed", 400, [
						{
							field: "metadata",
							message: metadataValidation.error || "Invalid metadata",
							...(metadataValidation.requirements && {
								requirements: metadataValidation.requirements,
							}),
						},
					]);
					res.status(400).json(errorResponse);
					return;
				}
			}

			const facility = await prisma.facility.create({
				// Cast to any for now because Prisma client types may not yet include the new "images" field
				data: {
					...validation.data,
					metadata: processedMetadata,
					images: facilityImages.length > 0 ? facilityImages : [],
				} as any,
			});
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
				const target = error.meta?.target;
				const fields = Array.isArray(target)
					? target
					: typeof target === "string"
						? [target]
						: ["organizationId", "identifier"];
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
				const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
				const query: Prisma.FacilityFindFirstArgs = {
					where: isObjectId ? { id } : { identifier: id },
				};

				query.select = getNestedFields(fields);

				// Include related location and facilityType
				// query.include = {
				// 	location: true,
				// 	facilityType: true,
				// };

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
		const { startDateTime, endDateTime, filter, pagination, count, page, limit, skip } =
			req.query;

		// Parse pagination parameters
		const limitValue = Math.min(
			parseInt((limit as string) || (req.query.limit as string) || "50", 10),
			200,
		);
		const skipValue = skip
			? parseInt(skip as string, 10)
			: page
				? (parseInt(page as string, 10) - 1) * limitValue
				: parseInt((req.query.skip as string) || "0", 10);
		const pageValue = page
			? parseInt(page as string, 10)
			: Math.floor(skipValue / limitValue) + 1;
		const paginationValue = pagination === "true";
		const countValue = count === "true";

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

		const originalStart = new Date(startDateTime);
		const originalEnd = new Date(endDateTime);

		if (isNaN(originalStart.getTime()) || isNaN(originalEnd.getTime())) {
			const errorResponse = buildErrorResponse(
				"Invalid date format for startDateTime or endDateTime",
				400,
			);
			res.status(400).json(errorResponse);
			return;
		}

		// Adjust dates for Philippine Time (subtract 8 hours from UTC)
		const start = new Date(originalStart);
		const end = new Date(originalEnd);
		start.setHours(start.getHours() - 8);
		end.setHours(end.getHours() - 8);

		facilityLogger.info(
			`Adjusted date times for Philippine Time: original startDateTime=${originalStart.toISOString()}, adjusted=${start.toISOString()}, original endDateTime=${originalEnd.toISOString()}, adjusted=${end.toISOString()}`,
		);

		if (end <= start) {
			const errorResponse = buildErrorResponse(
				"endDateTime must be after startDateTime",
				400,
			);
			res.status(400).json(errorResponse);
			return;
		}

		try {
			// Build base where clause for availability check
			const availabilityCondition: Prisma.FacilityWhereInput = {
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
			};

			// Build where clause - combine availability with filters if provided
			let whereClause: Prisma.FacilityWhereInput;

			if (filter && typeof filter === "string") {
				const filterConditions = buildFilterConditions("Facility", filter);
				if (filterConditions.length > 0) {
					// Combine availability check with filter conditions using AND
					whereClause = {
						AND: [availabilityCondition, ...filterConditions],
					};
				} else {
					whereClause = availabilityCondition;
				}
			} else {
				whereClause = availabilityCondition;
			}

			// Fetch facilities and count in parallel when needed
			const [facilities, total] = await Promise.all([
				prisma.facility.findMany({
					where: whereClause,
					include: {
						location: true,
						facilityType: true,
						rateType: true,
					},
					take: limitValue,
					skip: skipValue,
				}),
				countValue ? prisma.facility.count({ where: whereClause }) : Promise.resolve(0),
			]);

			// Build response data - use original dates in window to show what user requested
			const responseData: Record<string, any> = {
				availableFacilities: facilities,
				window: {
					startDateTime: originalStart.toISOString(),
					endDateTime: originalEnd.toISOString(),
					// Include adjusted times for verification (adjusted for Philippine Time)
					adjustedStartDateTime: start.toISOString(),
					adjustedEndDateTime: end.toISOString(),
				},
				...(countValue && { count: total }),
				...(paginationValue && {
					pagination: buildPagination(total, pageValue, limitValue),
				}),
			};

			res.status(200).json(
				buildSuccessResponse(config.SUCCESS.FACILITY.RETRIEVED_ALL, responseData, 200),
			);
		} catch (error: any) {
			facilityLogger.error(`Failed to get available facilities: ${error}`);

			// Check if it's a Prisma connection error
			if (
				error?.code === "P1001" ||
				error?.message?.includes("fatal alert") ||
				error?.message?.includes("InternalError")
			) {
				facilityLogger.error("Database connection error detected");
				const errorResponse = buildErrorResponse(
					"Database connection error. Please try again later.",
					503,
					[
						{
							field: "database",
							message:
								"Unable to connect to the database. The service may be temporarily unavailable.",
						},
					],
				);
				res.status(503).json(errorResponse);
				return;
			}

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

			// Get existing facility to compare images
			const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
			const existingFacility = await prisma.facility.findFirst({
				where: { id },
			});

			if (!existingFacility) {
				facilityLogger.error(`${config.ERROR.FACILITY.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.FACILITY.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Handle image uploads if files are present
			let uploadedImages: FacilityUploadedImageInfo[] = [];
			if (req.files && Object.keys(req.files as any).length > 0) {
				try {
					const files = req.files as { [fieldname: string]: Express.Multer.File[] };

					// Count total images for logging
					let totalImages = 0;
					for (const fieldName of Object.keys(FACILITY_IMAGE_TYPE_MAP)) {
						const fieldFiles = files[fieldName] || [];
						totalImages += fieldFiles.length;
					}

					facilityLogger.info(
						`Processing ${totalImages} uploaded facility images for update`,
					);

					// Get organizationId from existing record or request
					const organizationId =
						requestData.organizationId || existingFacility.organizationId || "default";

					// Process each image type field
					for (const [fieldName, imageType] of Object.entries(FACILITY_IMAGE_TYPE_MAP)) {
						const fieldFiles = files[fieldName] || [];
						if (fieldFiles.length === 0) continue;

						const uploadResults = await uploadMultipleToCloudinary(fieldFiles, {
							folder: `facilities/${organizationId}/${imageType.toLowerCase()}`,
						});

						for (let index = 0; index < uploadResults.length; index++) {
							const result = uploadResults[index];
							if (result.success && result.secureUrl) {
								const originalName =
									fieldFiles[index].originalname ||
									`${imageType.toLowerCase()}-${index + 1}`;
								const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, "");

								uploadedImages.push({
									name: nameWithoutExtension,
									url: result.secureUrl,
									type: imageType,
								});
							}
						}

						facilityLogger.info(
							`Successfully uploaded ${uploadResults.filter((r) => r.success).length} ${imageType} images to Cloudinary`,
						);
					}
				} catch (uploadError: any) {
					facilityLogger.error(`Error uploading facility images: ${uploadError.message}`);
					const errorResponse = buildErrorResponse("Failed to upload images", 500, [
						{ field: "images", message: uploadError.message },
					]);
					res.status(500).json(errorResponse);
					return;
				}
			}

			// Handle image deletion: compare existing images with new images from request
			const existingImages = (existingFacility.images as FacilityUploadedImageInfo[]) || [];
			let imagesToKeep: FacilityUploadedImageInfo[] = existingImages;
			let deletedImages: string[] = [];

			// If images field is provided in request, check for removed images
			if (requestData.images !== undefined) {
				const newImagesFromRequest = Array.isArray(requestData.images)
					? requestData.images
					: typeof requestData.images === "string"
						? JSON.parse(requestData.images)
						: [];
				const newImageUrls = new Set(
					newImagesFromRequest.map((img: FacilityUploadedImageInfo) => img.url),
				);

				// Find images to delete (in existing but not in new list)
				const imagesToDelete = existingImages.filter(
					(img) => img.url && !newImageUrls.has(img.url),
				);

				if (imagesToDelete.length > 0) {
					facilityLogger.info(
						`Found ${imagesToDelete.length} images to delete from Cloudinary`,
					);

					// Extract public IDs from URLs and delete from Cloudinary
					const publicIds = imagesToDelete
						.map((img) => (img.url ? extractPublicIdFromUrl(img.url) : null))
						.filter((id): id is string => id !== null);

					if (publicIds.length > 0) {
						try {
							const deleteResult = await deleteMultipleFromCloudinary(publicIds);
							deletedImages = deleteResult.deleted;
							facilityLogger.info(
								`Deleted ${deleteResult.deleted.length} images from Cloudinary`,
								{
									deleted: deleteResult.deleted,
									failed: deleteResult.failed,
								},
							);
						} catch (deleteError: any) {
							facilityLogger.warn(
								`Error deleting images from Cloudinary: ${deleteError.message}`,
							);
							// Continue with update even if deletion fails
						}
					}
				}

				// Keep only the images that are in the new list
				imagesToKeep = newImagesFromRequest;
			}

			// Add newly uploaded images to the list
			if (uploadedImages.length > 0) {
				imagesToKeep = [...imagesToKeep, ...uploadedImages];
				facilityLogger.info("Added newly uploaded images:", {
					existingCount: imagesToKeep.length - uploadedImages.length,
					uploadedCount: uploadedImages.length,
					totalCount: imagesToKeep.length,
				});
			}

			// Update request data with final images list
			requestData.images = imagesToKeep;

			console.log(requestData);
			const validationResult = UpdateFacilitySchema.safeParse(requestData);

			if (!validationResult.success) {
				const formattedErrors = formatZodErrors(validationResult.error.format());
				facilityLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
				const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
				res.status(400).json(errorResponse);
				return;
			}

			// Check if there's actually data to update (body or files)
			const hasBodyData = Object.keys(requestData).length > 0;
			const hasFiles = req.files && Object.keys(req.files as any).length > 0;
			if (!hasBodyData && !hasFiles) {
				facilityLogger.error(config.ERROR.COMMON.NO_UPDATE_FIELDS);
				const errorResponse = buildErrorResponse(config.ERROR.COMMON.NO_UPDATE_FIELDS, 400);
				res.status(400).json(errorResponse);
				return;
			}

			const validatedData = validationResult.data;

			facilityLogger.info(`Updating facility: ${id}`);

			// Validate rateTypeId if provided
			if (validatedData.rateTypeId) {
				let rateType = null;
				try {
					rateType = await prisma.rateType.findUnique({
						where: { id: validatedData.rateTypeId },
					});
				} catch (lookupError) {
					facilityLogger.error(
						`RateType lookup failed: ${validatedData.rateTypeId}`,
						lookupError,
					);
					const errorResponse = buildErrorResponse("Unable to verify rateType", 503, [
						{ field: "rateTypeId", message: "Temporary issue verifying rate type" },
					]);
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

			// Handle metadata validation if metadata is being updated
			let processedMetadata = validatedData.metadata;
			if (processedMetadata !== undefined) {
				// Handle metadata if it's a string (from form data)
				if (typeof processedMetadata === "string") {
					try {
						processedMetadata = JSON.parse(processedMetadata);
					} catch (error) {
						const errorResponse = buildErrorResponse("Invalid metadata format", 400, [
							{ field: "metadata", message: "Failed to parse metadata JSON" },
						]);
						res.status(400).json(errorResponse);
						return;
					}
				}

				// Verify facilityType exists if facilityTypeId is being updated
				if (validatedData.facilityTypeId) {
					const facilityType = await prisma.facilityType.findUnique({
						where: { id: validatedData.facilityTypeId },
					});

					if (!facilityType) {
						const errorResponse = buildErrorResponse("FacilityType not found", 404, [
							{
								field: "facilityTypeId",
								message: "The specified facilityType does not exist",
							},
						]);
						res.status(404).json(errorResponse);
						return;
					}
				}

				// Validate metadata based on facility's spaceType and subtype
				// Use updated values if provided, otherwise use existing facility values
				const spaceTypeToUse = validatedData.spaceType ?? existingFacility.spaceType;
				const subtypeToUse = validatedData.subtype ?? existingFacility.subtype;

				const metadataValidation = validateFacilityMetadata(
					processedMetadata,
					spaceTypeToUse,
					subtypeToUse || null,
				);

				if (!metadataValidation.success) {
					const errorResponse = buildErrorResponse("Metadata validation failed", 400, [
						{
							field: "metadata",
							message: metadataValidation.error || "Invalid metadata",
							...(metadataValidation.requirements && {
								requirements: metadataValidation.requirements,
							}),
						},
					]);
					res.status(400).json(errorResponse);
					return;
				}
			}

			const prismaData = { ...validatedData };
			if (processedMetadata !== undefined) {
				prismaData.metadata = processedMetadata;
			}
			// Include images in update if they were modified
			if (requestData.images !== undefined || uploadedImages.length > 0) {
				(prismaData as any).images = imagesToKeep;
			}

			const updatedFacility = await prisma.facility.update({
				where: { id: existingFacility.id },
				data: prismaData as any,
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
				{
					facility: updatedFacility,
					uploadedImages:
						uploadedImages.length > 0
							? {
									count: uploadedImages.length,
									images: uploadedImages,
								}
							: undefined,
					deletedImages:
						deletedImages.length > 0
							? {
									count: deletedImages.length,
									publicIds: deletedImages,
								}
							: undefined,
				},
				200,
			);
			res.status(200).json(successResponse);
		} catch (error: any) {
			facilityLogger.error(`${config.ERROR.FACILITY.ERROR_UPDATING}: ${error}`);

			// Handle unique constraint violation
			if (error.code === "P2002") {
				const target = error.meta?.target;
				const fields = Array.isArray(target)
					? target
					: typeof target === "string"
						? [target]
						: ["organizationId", "identifier"];
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

			facilityLogger.info(`Deleting facility: ${id}`);

			const existingFacility = await prisma.facility.findFirst({
				where: { id },
			});

			if (!existingFacility) {
				facilityLogger.error(`${config.ERROR.FACILITY.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.FACILITY.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			// Delete images from Cloudinary before deleting the facility
			let deletedImages: string[] = [];
			const existingImages = (existingFacility.images as FacilityUploadedImageInfo[]) || [];

			if (existingImages.length > 0) {
				facilityLogger.info(
					`Deleting ${existingImages.length} images from Cloudinary for facility ${id}`,
				);

				// Extract public IDs from image URLs
				const publicIds = existingImages
					.map((img) => (img.url ? extractPublicIdFromUrl(img.url) : null))
					.filter((publicId): publicId is string => publicId !== null);

				if (publicIds.length > 0) {
					try {
						const deleteResult = await deleteMultipleFromCloudinary(publicIds);
						deletedImages = deleteResult.deleted;
						facilityLogger.info(
							`Deleted ${deleteResult.deleted.length} images from Cloudinary`,
							{
								deleted: deleteResult.deleted,
								failed: deleteResult.failed,
							},
						);
					} catch (deleteError: any) {
						facilityLogger.warn(
							`Error deleting images from Cloudinary: ${deleteError.message}`,
						);
						// Continue with deletion even if Cloudinary deletion fails
					}
				}
			}

			// Delete the facility from database
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
			const successResponse = buildSuccessResponse(
				config.SUCCESS.FACILITY.DELETED,
				{
					deletedImages:
						deletedImages.length > 0
							? {
									count: deletedImages.length,
									publicIds: deletedImages,
								}
							: undefined,
				},
				200,
			);
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

	const uploadCSV = async (req: Request, res: Response, _next: NextFunction) => {
		try {
			// Check if file was uploaded
			if (!req.file) {
				const errorResponse = buildErrorResponse("No CSV file uploaded", 400, [
					{ field: "file", message: "Please upload a CSV file" },
				]);
				res.status(400).json(errorResponse);
				return;
			}

			facilityLogger.info(`Processing CSV file: ${req.file.originalname}`);

			// Parse CSV data
			const csvParser = await import("csv-parser");
			const { Readable } = await import("stream");

			const results: any[] = [];
			const errors: any[] = [];

			// Create a readable stream from the buffer
			const stream = Readable.from(req.file.buffer.toString());

			await new Promise((resolve, reject) => {
				stream
					.pipe(csvParser.default())
					.on("data", (data) => results.push(data))
					.on("end", resolve)
					.on("error", reject);
			});

			facilityLogger.info(`Parsed ${results.length} rows from CSV`);

			if (results.length === 0) {
				const errorResponse = buildErrorResponse("CSV file is empty", 400, [
					{ field: "file", message: "The uploaded CSV file contains no data" },
				]);
				res.status(400).json(errorResponse);
				return;
			}

			// Validate and prepare facility data
			const facilitiesToCreate: any[] = [];
			const validationErrors: any[] = [];

			for (let i = 0; i < results.length; i++) {
				const row = results[i];
				const rowNumber = i + 2; // +2 because row 1 is header and arrays are 0-indexed

				try {
					// Transform CSV row to facility data
					const facilityData: any = {
						facilityTypeId: row.facilityTypeId?.trim(),
						identifier: row.identifier?.trim(),
						displayName: row.displayName?.trim() || null,
						organizationId: row.organizationId?.trim() || null,
						locationId: row.locationId?.trim() || null,
						rateTypeId: row.rateTypeId?.trim() || null,
						spaceType: row.spaceType?.trim() || undefined,
						subtype: row.subtype?.trim() || undefined,
						status: row.status?.trim() || "AVAILABLE",
					};

					// Parse attributes if provided
					if (row.attributes) {
						try {
							facilityData.attributes = JSON.parse(row.attributes);
						} catch (e) {
							throw new Error(`Invalid JSON in attributes column: ${row.attributes}`);
						}
					}

					// Parse metadata if provided
					if (row.metadata) {
						try {
							facilityData.metadata = JSON.parse(row.metadata);
						} catch (e) {
							throw new Error(`Invalid JSON in metadata column: ${row.metadata}`);
						}
					}

					// Validate against schema
					const validation = CreateFacilitySchema.safeParse(facilityData);

					if (!validation.success) {
						const fieldErrors = formatZodErrors(validation.error.format());
						validationErrors.push({
							row: rowNumber,
							identifier: row.identifier || "N/A",
							errors: fieldErrors,
						});
						continue;
					}

					// Verify facilityType exists
					const facilityType = await prisma.facilityType.findUnique({
						where: { id: validation.data.facilityTypeId },
					});

					if (!facilityType) {
						validationErrors.push({
							row: rowNumber,
							identifier: row.identifier || "N/A",
							errors: [
								{
									field: "facilityTypeId",
									message: `FacilityType with ID ${validation.data.facilityTypeId} not found`,
								},
							],
						});
						continue;
					}

					// Verify rateType exists if provided
					if (validation.data.rateTypeId) {
						const rateType = await prisma.rateType.findUnique({
							where: { id: validation.data.rateTypeId },
						});

						if (!rateType) {
							validationErrors.push({
								row: rowNumber,
								identifier: row.identifier || "N/A",
								errors: [
									{
										field: "rateTypeId",
										message: `RateType with ID ${validation.data.rateTypeId} not found`,
									},
								],
							});
							continue;
						}
					}

					// Validate metadata if provided
					if (validation.data.metadata !== undefined) {
						let processedMetadata = validation.data.metadata;

						// Handle metadata if it's a string (from CSV)
						if (typeof processedMetadata === "string") {
							try {
								processedMetadata = JSON.parse(processedMetadata);
							} catch (error) {
								validationErrors.push({
									row: rowNumber,
									identifier: row.identifier || "N/A",
									errors: [
										{
											field: "metadata",
											message: "Failed to parse metadata JSON",
										},
									],
								});
								continue;
							}
						}

						// Validate metadata based on facility's spaceType and subtype
						const metadataValidation = validateFacilityMetadata(
							processedMetadata,
							validation.data.spaceType,
							validation.data.subtype || null,
						);

						if (!metadataValidation.success) {
							validationErrors.push({
								row: rowNumber,
								identifier: row.identifier || "N/A",
								errors: [
									{
										field: "metadata",
										message: metadataValidation.error || "Invalid metadata",
										...(metadataValidation.requirements && {
											requirements: metadataValidation.requirements,
										}),
									},
								],
							});
							continue;
						}

						validation.data.metadata = processedMetadata;
					}

					facilitiesToCreate.push(validation.data);
				} catch (error: any) {
					validationErrors.push({
						row: rowNumber,
						identifier: row.identifier || "N/A",
						errors: [{ field: "general", message: error.message }],
					});
				}
			}

			facilityLogger.info(
				`Validation complete: ${facilitiesToCreate.length} valid, ${validationErrors.length} invalid`,
			);

			// If there are validation errors, return them
			if (validationErrors.length > 0) {
				const errorResponse = buildErrorResponse(
					`CSV validation failed for ${validationErrors.length} row(s)`,
					400,
					validationErrors,
				);
				res.status(400).json(errorResponse);
				return;
			}

			// Bulk create facilities
			const createdFacilities: any[] = [];
			const creationErrors: any[] = [];

			for (let i = 0; i < facilitiesToCreate.length; i++) {
				const facilityData = facilitiesToCreate[i];

				try {
					const facility = await prisma.facility.create({
						data: facilityData as any,
					});
					createdFacilities.push(facility);

					// Log activity for each created facility
					logActivity(req, {
						userId: (req as any).user?.id || "unknown",
						action: config.ACTIVITY_LOG.FACILITY.ACTIONS.CREATE_FACILITY,
						description: `${config.ACTIVITY_LOG.FACILITY.DESCRIPTIONS.FACILITY_CREATED} via CSV: ${facility.displayName || facility.identifier || facility.id}`,
						page: {
							url: req.originalUrl,
							title: config.ACTIVITY_LOG.FACILITY.PAGES.FACILITY_CREATION,
						},
					});
				} catch (error: any) {
					// Handle unique constraint violation
					if (error.code === "P2002") {
						creationErrors.push({
							identifier: facilityData.identifier,
							error: `Duplicate facility: A facility with identifier "${facilityData.identifier}" already exists for this organization`,
						});
					} else {
						creationErrors.push({
							identifier: facilityData.identifier,
							error: error.message || "Unknown error",
						});
					}
				}
			}

			facilityLogger.info(
				`CSV import complete: ${createdFacilities.length} created, ${creationErrors.length} failed`,
			);

			// Invalidate cache
			try {
				await invalidateCache.byPattern("cache:facility:list:*");
				facilityLogger.info("Facility list cache invalidated after CSV import");
			} catch (cacheError) {
				facilityLogger.warn("Failed to invalidate cache after CSV import:", cacheError);
			}

			// Return results
			const responseData = {
				summary: {
					totalRows: results.length,
					successful: createdFacilities.length,
					failed: creationErrors.length,
				},
				createdFacilities: createdFacilities,
				...(creationErrors.length > 0 && { errors: creationErrors }),
			};

			const statusCode = creationErrors.length > 0 ? 207 : 201; // 207 Multi-Status if partial success
			const message =
				creationErrors.length > 0
					? `CSV import completed with ${creationErrors.length} error(s)`
					: "All facilities created successfully from CSV";

			const successResponse = buildSuccessResponse(message, responseData, statusCode);
			res.status(statusCode).json(successResponse);
		} catch (error: any) {
			facilityLogger.error(`CSV upload failed: ${error.message}`, error);
			const errorResponse = buildErrorResponse("Failed to process CSV file", 500, [
				{ field: "file", message: error.message },
			]);
			res.status(500).json(errorResponse);
		}
	};

	return { create, getAll, getById, getAvailable, update, remove, uploadCSV };
};
