import { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "../../generated/prisma";
import { getLogger } from "../../helper/logger";
import { transformFormDataToObject, isFormOrMultipartContentType } from "../../helper/transformObject";
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
import { uploadMultipleToCloudinary, deleteMultipleFromCloudinary, extractPublicIdFromUrl } from "../../helper/cloudinary-upload";

const logger = getLogger();
const facilityTypeLogger = logger.child({ module: "facilityType" });

// Facility image type values (matching the Prisma schema enum)
type FacilityImageType = "COVER" | "FEATURED" | "GALLERY" | "THUMBNAIL" | "FLOOR_PLAN" | "EXTERIOR" | "INTERIOR" | "AMENITY" | "OTHER";

// Map field names to FacilityImageType values
const IMAGE_TYPE_MAP: Record<string, FacilityImageType> = {
	coverImages: "COVER",
	featuredImages: "FEATURED",
	galleryImages: "GALLERY",
	thumbnailImages: "THUMBNAIL",
	floorPlanImages: "FLOOR_PLAN",
	exteriorImages: "EXTERIOR",
	interiorImages: "INTERIOR",
	amenityImages: "AMENITY",
	images: "GALLERY", // Default fallback for generic images
};

// Structure for uploaded image info (for response)
interface UploadedImageInfo {
	name: string;
	url: string;
	type: FacilityImageType;
}

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

		// Handle image uploads if files are present
		let facilityImages: UploadedImageInfo[] = [];
		if (req.files && Object.keys(req.files as any).length > 0) {
			try {
				const files = req.files as { [fieldname: string]: Express.Multer.File[] };

				// Count total images for logging
				let totalImages = 0;
				for (const fieldName of Object.keys(IMAGE_TYPE_MAP)) {
					const fieldFiles = files[fieldName] || [];
					totalImages += fieldFiles.length;
				}

				facilityTypeLogger.info(`Processing ${totalImages} uploaded images`);

				// Process each image type field
				for (const [fieldName, imageType] of Object.entries(IMAGE_TYPE_MAP)) {
					const fieldFiles = files[fieldName] || [];
					if (fieldFiles.length > 0) {
						const uploadResults = await uploadMultipleToCloudinary(fieldFiles, {
							folder: `facility-types/${requestData.organizationId || "default"}/${imageType.toLowerCase()}`,
						});

						// Create image info objects for response and collect URLs for database
						for (let index = 0; index < uploadResults.length; index++) {
							const result = uploadResults[index];
							if (result.success && result.secureUrl) {
								// Remove file extension from original filename
								const originalName =
									fieldFiles[index].originalname || `${imageType.toLowerCase()}-${index + 1}`;
								const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, "");

								// Add to detailed image info (for database and response)
								facilityImages.push({
									name: nameWithoutExtension,
									url: result.secureUrl,
									type: imageType,
								});
							}
						}

						facilityTypeLogger.info(
							`Successfully uploaded ${uploadResults.filter(r => r.success).length} ${imageType} images to Cloudinary`,
						);
					}
				}

				// Console.log the URLs as requested
				console.log("Facility type images uploaded to Cloudinary:", facilityImages);
			} catch (uploadError: any) {
				facilityTypeLogger.error(`Error uploading images: ${uploadError.message}`);
				const errorResponse = buildErrorResponse("Failed to upload images", 500, [
					{ field: "images", message: uploadError.message },
				]);
				res.status(500).json(errorResponse);
				return;
			}
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

			// Prepare data for Prisma - use images field with FacilityImage structure
			const facilityType = await prisma.facilityType.create({
				data: {
					name: validation.data.name,
					code: validation.data.code,
					description: validation.data.description,
					spaceType: validation.data.spaceType,
					subtype: validation.data.subtype,
					organizationId: validation.data.organizationId,
					metadata: validation.data.metadata,
					rateTypeId: validation.data.rateTypeId,
					path: validation.data.path,
					images: facilityImages.length > 0 ? facilityImages : [],
				},
			});
			facilityTypeLogger.info(`FacilityType created successfully: ${facilityType.id}`);

			logActivity(req, {
				userId: (req as any).user?.id || "unknown",
				action: config.ACTIVITY_LOG.FACILITYTYPE.ACTIONS.CREATE_FACILITYTYPE,
				description: `${config.ACTIVITY_LOG.FACILITYTYPE.DESCRIPTIONS.FACILITYTYPE_CREATED}: ${facilityType.name || facilityType.id} with ${facilityImages.length} images`,
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
					imageCount: facilityImages.length,
					createdAt: facilityType.createdAt,
					updatedAt: facilityType.updatedAt,
				},
				description: `${config.AUDIT_LOG.FACILITYTYPE.DESCRIPTIONS.FACILITYTYPE_CREATED}: ${facilityType.name || facilityType.id} with ${facilityImages.length} images`,
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
				{
					...facilityType,
					uploadedImages: {
						count: facilityImages.length,
						images: facilityImages,
					},
				},
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

			// Handle image uploads if files are present
			let uploadedImages: UploadedImageInfo[] = [];
			if (req.files && Object.keys(req.files as any).length > 0) {
				try {
					const files = req.files as { [fieldname: string]: Express.Multer.File[] };

					// Count total images for logging
					let totalImages = 0;
					for (const fieldName of Object.keys(IMAGE_TYPE_MAP)) {
						const fieldFiles = files[fieldName] || [];
						totalImages += fieldFiles.length;
					}

					facilityTypeLogger.info(`Processing ${totalImages} uploaded images for update`);

					// Get organizationId from existing record or request
					const existingForOrg = await prisma.facilityType.findFirst({
						where: { id },
						select: { organizationId: true },
					});
					const organizationId = requestData.organizationId || existingForOrg?.organizationId || "default";

					// Process each image type field
					for (const [fieldName, imageType] of Object.entries(IMAGE_TYPE_MAP)) {
						const fieldFiles = files[fieldName] || [];
						if (fieldFiles.length > 0) {
							const uploadResults = await uploadMultipleToCloudinary(fieldFiles, {
								folder: `facility-types/${organizationId}/${imageType.toLowerCase()}`,
							});

							// Create image info objects for response and collect URLs for database
							for (let index = 0; index < uploadResults.length; index++) {
								const result = uploadResults[index];
								if (result.success && result.secureUrl) {
									// Remove file extension from original filename
									const originalName =
										fieldFiles[index].originalname || `${imageType.toLowerCase()}-${index + 1}`;
									const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, "");

									// Add to detailed image info (for database and response)
									uploadedImages.push({
										name: nameWithoutExtension,
										url: result.secureUrl,
										type: imageType,
									});
								}
							}

							facilityTypeLogger.info(
								`Successfully uploaded ${uploadResults.filter(r => r.success).length} ${imageType} images to Cloudinary`,
							);
						}
					}

					// Console.log the URLs
					console.log("Facility type images uploaded to Cloudinary (update):", uploadedImages);
				} catch (uploadError: any) {
					facilityTypeLogger.error(`Error uploading images: ${uploadError.message}`);
					const errorResponse = buildErrorResponse("Failed to upload images", 500, [
						{ field: "images", message: uploadError.message },
					]);
					res.status(500).json(errorResponse);
					return;
				}
			}

			// Get existing facility type to compare images
			const existingFacilityType = await prisma.facilityType.findFirst({
				where: { id },
			});

			if (!existingFacilityType) {
				facilityTypeLogger.error(`${config.ERROR.FACILITYTYPE.NOT_FOUND}: ${id}`);
				const errorResponse = buildErrorResponse(config.ERROR.FACILITYTYPE.NOT_FOUND, 404);
				res.status(404).json(errorResponse);
				return;
			}

			const existingImages = (existingFacilityType.images as UploadedImageInfo[]) || [];

			// Handle image deletion: compare existing images with new images from request
			let imagesToKeep: UploadedImageInfo[] = existingImages;
			let deletedImages: string[] = [];

			// If images field is provided in request, check for removed images
			if (requestData.images !== undefined) {
				const newImagesFromRequest = Array.isArray(requestData.images) ? requestData.images : [];
				const newImageUrls = new Set(newImagesFromRequest.map((img: UploadedImageInfo) => img.url));

				// Find images to delete (in existing but not in new list)
				const imagesToDelete = existingImages.filter(img => img.url && !newImageUrls.has(img.url));

				if (imagesToDelete.length > 0) {
					facilityTypeLogger.info(`Found ${imagesToDelete.length} images to delete from Cloudinary`);

					// Extract public IDs from URLs and delete from Cloudinary
					const publicIds = imagesToDelete
						.map(img => img.url ? extractPublicIdFromUrl(img.url) : null)
						.filter((id): id is string => id !== null);

					if (publicIds.length > 0) {
						try {
							const deleteResult = await deleteMultipleFromCloudinary(publicIds);
							deletedImages = deleteResult.deleted;
							facilityTypeLogger.info(`Deleted ${deleteResult.deleted.length} images from Cloudinary`, {
								deleted: deleteResult.deleted,
								failed: deleteResult.failed,
							});
						} catch (deleteError: any) {
							facilityTypeLogger.warn(`Error deleting images from Cloudinary: ${deleteError.message}`);
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
				facilityTypeLogger.info("Added newly uploaded images:", {
					existingCount: imagesToKeep.length - uploadedImages.length,
					uploadedCount: uploadedImages.length,
					totalCount: imagesToKeep.length,
				});
			}

			// Update request data with final images list
			requestData.images = imagesToKeep;

			const validationResult = UpdateFacilityTypeSchema.safeParse(requestData);

			if (!validationResult.success) {
				const formattedErrors = formatZodErrors(validationResult.error);
				facilityTypeLogger.error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
				const errorResponse = buildErrorResponse("Validation failed", 400, formattedErrors);
				res.status(400).json(errorResponse);
				return;
			}

			// Check if there's actually data to update (body or files)
			const hasBodyData = Object.keys(req.body).length > 0;
			const hasFiles = req.files && Object.keys(req.files as any).length > 0;
			if (!hasBodyData && !hasFiles) {
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

			facilityTypeLogger.info(`${config.SUCCESS.FACILITYTYPE.UPDATED}: ${updatedFacilityType.id}`);
			const successResponse = buildSuccessResponse(
				config.SUCCESS.FACILITYTYPE.UPDATED,
				{
					facilityType: updatedFacilityType,
					uploadedImages: uploadedImages.length > 0 ? {
						count: uploadedImages.length,
						images: uploadedImages,
					} : undefined,
					deletedImages: deletedImages.length > 0 ? {
						count: deletedImages.length,
						publicIds: deletedImages,
					} : undefined,
				},
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

			// Delete images from Cloudinary before deleting the facilityType
			let deletedImages: string[] = [];
			const existingImages = (existingFacilityType.images as UploadedImageInfo[]) || [];

			if (existingImages.length > 0) {
				facilityTypeLogger.info(`Deleting ${existingImages.length} images from Cloudinary for facilityType ${id}`);

				// Extract public IDs from image URLs
				const publicIds = existingImages
					.map(img => img.url ? extractPublicIdFromUrl(img.url) : null)
					.filter((publicId): publicId is string => publicId !== null);

				if (publicIds.length > 0) {
					try {
						const deleteResult = await deleteMultipleFromCloudinary(publicIds);
						deletedImages = deleteResult.deleted;
						facilityTypeLogger.info(`Deleted ${deleteResult.deleted.length} images from Cloudinary`, {
							deleted: deleteResult.deleted,
							failed: deleteResult.failed,
						});
					} catch (deleteError: any) {
						facilityTypeLogger.warn(`Error deleting images from Cloudinary: ${deleteError.message}`);
						// Continue with deletion even if Cloudinary deletion fails
					}
				}
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
				{
					deletedImages: deletedImages.length > 0 ? {
						count: deletedImages.length,
						publicIds: deletedImages,
					} : undefined,
				},
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
