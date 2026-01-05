import { z } from "zod";

export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// ============================================================================
// ENUMS - Matching Prisma Schema
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

export const RoomSubtypeSchema = z.enum([
	"GUEST_ROOM",
	"CONFERENCE_ROOM",
	"OFFICE",
	"STUDIO",
	"CLASSROOM",
	"BALLROOM",
	"SUITE",
	"OTHER",
]);

export const CourtSubtypeSchema = z.enum([
	"TENNIS",
	"BASKETBALL",
	"VOLLEYBALL",
	"BADMINTON",
	"SQUASH",
	"RACQUETBALL",
	"PICKLEBALL",
	"MULTIPURPOSE",
	"OTHER",
]);

export const DiningSubtypeSchema = z.enum([
	"FINE_DINING",
	"CASUAL_DINING",
	"CAFE",
	"BAR",
	"LOUNGE",
	"BUFFET",
	"PRIVATE_DINING",
	"FOOD_COURT",
	"OTHER",
]);

export const FitnessSubtypeSchema = z.enum([
	"WEIGHT_ROOM",
	"CARDIO_AREA",
	"YOGA_STUDIO",
	"SPIN_STUDIO",
	"CROSSFIT_BOX",
	"PILATES_STUDIO",
	"MULTIPURPOSE",
	"OTHER",
]);

export const ParkingSubtypeSchema = z.enum([
	"COVERED",
	"OPEN_LOT",
	"GARAGE",
	"VALET",
	"EV_CHARGING",
	"DISABLED",
	"MOTORCYCLE",
	"BICYCLE",
	"OTHER",
]);

export const AmenitySubtypeSchema = z.enum([
	"SWIMMING_POOL",
	"HOT_TUB",
	"SAUNA",
	"STEAM_ROOM",
	"SPA",
	"LIBRARY",
	"BUSINESS_CENTER",
	"GAME_ROOM",
	"LOUNGE",
	"ROOFTOP",
	"GARDEN",
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
		code: z.string().max(50, "Code must be at most 50 characters").optional(),
		description: z.string().max(1000, "Description must be at most 1000 characters").optional(),
		spaceType: SpaceTypeSchema.optional(),
		subtype: z.string().optional(),
		organizationId: ObjectIdSchema.optional(),
		rateTypeId: ObjectIdSchema.optional(),
		path: z.string().optional(),
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
			code: z.string().max(50, "Code must be at most 50 characters").optional(),
			description: z
				.string()
				.max(1000, "Description must be at most 1000 characters")
				.optional(),
			spaceType: SpaceTypeSchema.optional(),
			subtype: z.string().optional(),
			organizationId: ObjectIdSchema.optional(),
			path: z.string().optional(),
		})
		.partial(),
);

export const FacilityTypeResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	code: z.string().optional(),
	description: z.string().optional(),
	spaceType: SpaceTypeSchema.optional(),
	subtype: z.string().optional(),
	organizationId: z.string().optional(),
	rateTypeId: z.string().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
	path: z.string().optional(),
});

export const FacilityTypeQuerySchema = z.object({
	organizationId: ObjectIdSchema.optional(),
	spaceType: SpaceTypeSchema.optional(),
	subtype: z.string().optional(),
	name: z.string().optional(),
});

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type SpaceType = z.infer<typeof SpaceTypeSchema>;
export type RoomSubtype = z.infer<typeof RoomSubtypeSchema>;
export type CourtSubtype = z.infer<typeof CourtSubtypeSchema>;
export type DiningSubtype = z.infer<typeof DiningSubtypeSchema>;
export type FitnessSubtype = z.infer<typeof FitnessSubtypeSchema>;
export type ParkingSubtype = z.infer<typeof ParkingSubtypeSchema>;
export type AmenitySubtype = z.infer<typeof AmenitySubtypeSchema>;

export type FacilityImageType = z.infer<typeof FacilityImageTypeSchema>;
export type FacilityImage = z.infer<typeof FacilityImageSchema>;

// Schema types
export type CreateFacilityTypeInput = z.infer<typeof CreateFacilityTypeSchema>;
export type UpdateFacilityTypeInput = z.infer<typeof UpdateFacilityTypeSchema>;
export type FacilityTypeResponse = z.infer<typeof FacilityTypeResponseSchema>;
export type FacilityTypeQuery = z.infer<typeof FacilityTypeQuerySchema>;
