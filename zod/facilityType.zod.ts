import { z } from "zod";

export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// ============================================================================
// ENUMS
// ============================================================================

export const SpaceTypeSchema = z.enum([
	"ROOM",
	"COURT",
	"DINING",
	"FITNESS",
	"PARKING",
	"AMENITY",
	"OUTDOOR",
	"OTHER",
]);

// ============================================================================
// FACILITY IMAGE TYPE ENUM & SCHEMA
// ============================================================================

export const FacilityImageTypeSchema = z.enum([
	"COVER",
	"FEATURED",
	"GALLERY",
	"THUMBNAIL",
	"FLOOR_PLAN",
	"EXTERIOR",
	"INTERIOR",
	"AMENITY",
	"OTHER",
]);

export const FacilityImageSchema = z.object({
	name: z.string().optional(),
	url: z.string().url("Invalid image URL").optional(),
	type: FacilityImageTypeSchema.optional(),
});

// ============================================================================
// PREPROCESSING & MAIN SCHEMAS
// ============================================================================

const preprocessFacilityTypeData = z.preprocess(
	(data: any) => {
		console.log("🚀 Starting preprocessing with raw data:", JSON.stringify(data, null, 2));

		if (!data || typeof data !== "object") {
			console.log("❌ Data is null, undefined, or not an object");
			return data;
		}

		const processed = { ...data };
		console.log("📋 Initial processed data:", JSON.stringify(processed, null, 2));

		console.log("🔄 Processed data before validation:", JSON.stringify(processed, null, 2));
		return processed;
	},
	z.object({
		name: z
			.string()
			.min(1, "Name is required and must be a non-empty string")
			.max(255, "Name must be at most 255 characters"),
		description: z.string().optional(),
		code: z.string().optional(),
		spaceType: SpaceTypeSchema.optional(),
		subtype: z.string().optional(),
		organizationId: ObjectIdSchema.optional(),
	}),
);

export const CreateFacilityTypeSchema = preprocessFacilityTypeData;

export const UpdateFacilityTypeSchema = z.preprocess(
	(data: any) => {
		if (!data || typeof data !== "object") return data;

		const processed = { ...data };

		return processed;
	},
	z
		.object({
			name: z
				.string()
				.min(1, "Name is required and must be a non-empty string")
				.max(255, "Name must be at most 255 characters")
				.optional(),
			description: z.string().optional(),
			code: z.string().optional(),
			spaceType: SpaceTypeSchema.optional(),
			subtype: z.string().optional(),
			organizationId: ObjectIdSchema.optional(),
		})
		.partial(),
);

export const FacilityTypeResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	organizationId: z.string().optional(),
	rateTypeId: z.string().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const FacilityTypeQuerySchema = z.object({
	organizationId: ObjectIdSchema.optional(),
	name: z.string().optional(),
});

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type SpaceType = z.infer<typeof SpaceTypeSchema>;
export type FacilityImageType = z.infer<typeof FacilityImageTypeSchema>;
export type FacilityImage = z.infer<typeof FacilityImageSchema>;

// Schema types
export type CreateFacilityTypeInput = z.infer<typeof CreateFacilityTypeSchema>;
export type UpdateFacilityTypeInput = z.infer<typeof UpdateFacilityTypeSchema>;
export type FacilityTypeResponse = z.infer<typeof FacilityTypeResponseSchema>;
export type FacilityTypeQuery = z.infer<typeof FacilityTypeQuerySchema>;
