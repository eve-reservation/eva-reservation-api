import { cloudinary, cloudinaryConfig } from "../config/cloudinary";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import { getLogger } from "./logger";

const logger = getLogger();
const cloudinaryLogger = logger.child({ module: "cloudinary" });

export type CloudinaryUploadResult = {
	success: boolean;
	url?: string;
	secureUrl?: string;
	publicId?: string;
	width?: number;
	height?: number;
	format?: string;
	bytes?: number;
	error?: string;
};

export type CloudinaryUploadOptions = {
	folder?: string;
	publicId?: string;
	transformation?: {
		width?: number;
		height?: number;
		crop?: string;
		quality?: string | number;
	};
	resourceType?: "image" | "video" | "raw" | "auto";
	overwrite?: boolean;
};

/**
 * Upload a single image buffer to Cloudinary
 */
export async function uploadToCloudinary(
	buffer: Buffer,
	options: CloudinaryUploadOptions = {},
): Promise<CloudinaryUploadResult> {
	if (!cloudinaryConfig.isConfigured()) {
		cloudinaryLogger.error("Cloudinary is not configured. Check environment variables.");
		return {
			success: false,
			error: "Cloudinary is not configured",
		};
	}

	const {
		folder = "uploads",
		publicId,
		transformation,
		resourceType = "image",
		overwrite = true,
	} = options;

	return new Promise((resolve) => {
		const uploadOptions: Record<string, unknown> = {
			folder,
			resource_type: resourceType,
			overwrite,
		};

		if (publicId) {
			uploadOptions.public_id = publicId;
		}

		if (transformation) {
			uploadOptions.transformation = transformation;
		}

		const uploadStream = cloudinary.uploader.upload_stream(
			uploadOptions,
			(error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
				if (error) {
					cloudinaryLogger.error(`Cloudinary upload failed: ${error.message}`);
					resolve({
						success: false,
						error: error.message,
					});
					return;
				}

				if (!result) {
					cloudinaryLogger.error("Cloudinary upload returned no result");
					resolve({
						success: false,
						error: "Upload returned no result",
					});
					return;
				}

				cloudinaryLogger.info(`Image uploaded successfully: ${result.public_id}`);
				resolve({
					success: true,
					url: result.url,
					secureUrl: result.secure_url,
					publicId: result.public_id,
					width: result.width,
					height: result.height,
					format: result.format,
					bytes: result.bytes,
				});
			},
		);

		uploadStream.end(buffer);
	});
}

/**
 * Upload multiple image buffers to Cloudinary
 */
export async function uploadMultipleToCloudinary(
	files: { buffer: Buffer; originalname: string }[],
	options: CloudinaryUploadOptions = {},
): Promise<CloudinaryUploadResult[]> {
	const uploadPromises = files.map((file, index) => {
		const fileOptions = {
			...options,
			publicId: options.publicId ? `${options.publicId}_${index}` : undefined,
		};
		return uploadToCloudinary(file.buffer, fileOptions);
	});

	return Promise.all(uploadPromises);
}

/**
 * Delete an image from Cloudinary by public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
	if (!cloudinaryConfig.isConfigured()) {
		cloudinaryLogger.error("Cloudinary is not configured. Check environment variables.");
		return false;
	}

	try {
		const result = await cloudinary.uploader.destroy(publicId);
		if (result.result === "ok") {
			cloudinaryLogger.info(`Image deleted successfully: ${publicId}`);
			return true;
		}
		cloudinaryLogger.warn(`Image deletion returned: ${result.result} for ${publicId}`);
		return false;
	} catch (error: any) {
		cloudinaryLogger.error(`Failed to delete image ${publicId}: ${error.message}`);
		return false;
	}
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteMultipleFromCloudinary(publicIds: string[]): Promise<{
	deleted: string[];
	failed: string[];
}> {
	const results = await Promise.all(
		publicIds.map(async (publicId) => ({
			publicId,
			success: await deleteFromCloudinary(publicId),
		})),
	);

	return {
		deleted: results.filter((r) => r.success).map((r) => r.publicId),
		failed: results.filter((r) => !r.success).map((r) => r.publicId),
	};
}

/**
 * Extract public ID from a Cloudinary URL
 * Example: https://res.cloudinary.com/xxx/image/upload/v123/folder/subfolder/filename.jpg
 * Returns: folder/subfolder/filename
 */
export function extractPublicIdFromUrl(url: string): string | null {
	try {
		// Match the pattern after /upload/v{version}/ or /upload/
		const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
		if (match && match[1]) {
			// Remove the file extension
			const publicIdWithExt = match[1];
			const lastDotIndex = publicIdWithExt.lastIndexOf(".");
			if (lastDotIndex > 0) {
				return publicIdWithExt.substring(0, lastDotIndex);
			}
			return publicIdWithExt;
		}
		return null;
	} catch (error) {
		return null;
	}
}

/**
 * Generate a Cloudinary URL with transformations
 */
export function getCloudinaryUrl(
	publicId: string,
	options: {
		width?: number;
		height?: number;
		crop?: string;
		quality?: string | number;
		format?: string;
	} = {},
): string {
	if (!cloudinaryConfig.isConfigured()) {
		return "";
	}

	return cloudinary.url(publicId, {
		secure: true,
		...options,
	});
}
