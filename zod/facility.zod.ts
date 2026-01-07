import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { FacilityImageSchema } from "./facilityType.zod";
import {
	GuestRoomMetadataSchema,
	ConferenceRoomMetadataSchema,
	OfficeMetadataSchema,
	StudioMetadataSchema,
	ClassroomMetadataSchema,
	BallroomMetadataSchema,
	SuiteMetadataSchema,
	SportsCourtMetadataSchema,
	DiningMetadataSchema,
	FitnessMetadataSchema,
	ParkingMetadataSchema,
	AmenitySpaceMetadataSchema,
	OutdoorMetadataSchema,
	OtherMetadataSchema,
	getMetadataRequirements,
} from "./metadata.zod";

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

// Facility Status Enum
export const FacilityStatusSchema = z.enum([
	"AVAILABLE",
	"OCCUPIED",
	"RESERVED",
	"MAINTENANCE",
	"CLEANING",
	"OUT_OF_SERVICE",
	"BLOCKED",
]);

export type SpaceType = z.infer<typeof SpaceTypeSchema>;
export type RoomSubtype = z.infer<typeof RoomSubtypeSchema>;
export type CourtSubtype = z.infer<typeof CourtSubtypeSchema>;
export type DiningSubtype = z.infer<typeof DiningSubtypeSchema>;
export type FitnessSubtype = z.infer<typeof FitnessSubtypeSchema>;
export type ParkingSubtype = z.infer<typeof ParkingSubtypeSchema>;
export type AmenitySubtype = z.infer<typeof AmenitySubtypeSchema>;
export type FacilityStatus = z.infer<typeof FacilityStatusSchema>;

// Union of all possible subtypes
export const SubtypeSchema = z.union([
	RoomSubtypeSchema,
	CourtSubtypeSchema,
	DiningSubtypeSchema,
	FitnessSubtypeSchema,
	ParkingSubtypeSchema,
	AmenitySubtypeSchema,
	z.literal("OTHER"),
]);

export type Subtype = z.infer<typeof SubtypeSchema>;

// Base Facility schema (without refinement) - needed for omit operations
const FacilityBaseSchema = z.object({
	id: z.string().refine((val) => isValidObjectId(val)),
	facilityTypeId: z.string().refine((val) => isValidObjectId(val)),
	identifier: z.string().min(1),
	displayName: z.string().optional().nullable(),
	organizationId: z.string().min(1).optional().nullable(),
	locationId: z
		.string()
		.refine((val) => isValidObjectId(val))
		.optional()
		.nullable(),
	rateTypeId: z
		.string()
		.refine((val) => isValidObjectId(val))
		.optional()
		.nullable(),
	spaceType: SpaceTypeSchema.optional(),
	subtype: z.string().optional(),
	attributes: z.any().optional(),
	metadata: z.union([z.string(), z.record(z.any())]).optional(),
	images: z.array(FacilityImageSchema).optional().default([]),
	status: FacilityStatusSchema.optional().default("AVAILABLE"),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

// Facility schema with subtype validation refinement
export const FacilitySchema = FacilityBaseSchema.refine(
	(data) => {
		// If spaceType is provided, validate subtype matches
		if (!data.spaceType) return true; // spaceType is optional
		if (!data.subtype) return true; // subtype is optional

		const spaceType = data.spaceType;
		const subtype = data.subtype;

		switch (spaceType) {
			case "ROOM":
				return RoomSubtypeSchema.safeParse(subtype).success;
			case "COURT":
				return CourtSubtypeSchema.safeParse(subtype).success;
			case "DINING":
				return DiningSubtypeSchema.safeParse(subtype).success;
			case "FITNESS":
				return FitnessSubtypeSchema.safeParse(subtype).success;
			case "PARKING":
				return ParkingSubtypeSchema.safeParse(subtype).success;
			case "AMENITY":
				return AmenitySubtypeSchema.safeParse(subtype).success;
			case "OUTDOOR":
				// OUTDOOR doesn't have subtypes, so subtype should be null/undefined or OTHER
				return !subtype || subtype === "OTHER";
			case "OTHER":
				// OTHER doesn't have subtypes, so subtype should be null/undefined or OTHER
				return !subtype || subtype === "OTHER";
			default:
				return true;
		}
	},
	{
		message: "Subtype does not match the specified spaceType",
		path: ["subtype"],
	},
);

export type Facility = z.infer<typeof FacilitySchema>;

// Create Facility Schema (exclude id/createdAt/updatedAt)
// Use base schema for omit, then apply refinement
export const CreateFacilitySchema = FacilityBaseSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).refine(
	(data) => {
		// If spaceType is provided, validate subtype matches
		if (!data.spaceType) return true; // spaceType is optional
		if (!data.subtype) return true; // subtype is optional

		const spaceType = data.spaceType;
		const subtype = data.subtype;

		switch (spaceType) {
			case "ROOM":
				return RoomSubtypeSchema.safeParse(subtype).success;
			case "COURT":
				return CourtSubtypeSchema.safeParse(subtype).success;
			case "DINING":
				return DiningSubtypeSchema.safeParse(subtype).success;
			case "FITNESS":
				return FitnessSubtypeSchema.safeParse(subtype).success;
			case "PARKING":
				return ParkingSubtypeSchema.safeParse(subtype).success;
			case "AMENITY":
				return AmenitySubtypeSchema.safeParse(subtype).success;
			case "OUTDOOR":
				return !subtype || subtype === "OTHER";
			case "OTHER":
				return !subtype || subtype === "OTHER";
			default:
				return true;
		}
	},
	{
		message: "Subtype does not match the specified spaceType",
		path: ["subtype"],
	},
);

export type CreateTemplate = z.infer<typeof CreateFacilitySchema>;

// Update Facility Schema (partial mutable fields)
// Use base schema for omit, then apply refinement and make partial
export const UpdateFacilitySchema = FacilityBaseSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
})
	.partial()
	.refine(
		(data) => {
			// If spaceType is provided, validate subtype matches
			if (!data.spaceType) return true; // spaceType is optional
			if (!data.subtype) return true; // subtype is optional

			const spaceType = data.spaceType;
			const subtype = data.subtype;

			switch (spaceType) {
				case "ROOM":
					return RoomSubtypeSchema.safeParse(subtype).success;
				case "COURT":
					return CourtSubtypeSchema.safeParse(subtype).success;
				case "DINING":
					return DiningSubtypeSchema.safeParse(subtype).success;
				case "FITNESS":
					return FitnessSubtypeSchema.safeParse(subtype).success;
				case "PARKING":
					return ParkingSubtypeSchema.safeParse(subtype).success;
				case "AMENITY":
					return AmenitySubtypeSchema.safeParse(subtype).success;
				case "OUTDOOR":
					return !subtype || subtype === "OTHER";
				case "OTHER":
					return !subtype || subtype === "OTHER";
				default:
					return true;
			}
		},
		{
			message: "Subtype does not match the specified spaceType",
			path: ["subtype"],
		},
	);

export type UpdateTemplate = z.infer<typeof UpdateFacilitySchema>;

// ============================================================================
// SUBTYPE VALIDATION HELPER
// ============================================================================

/**
 * Gets the appropriate subtype schema based on spaceType
 */
export function getSubtypeSchema(spaceType: SpaceType | null | undefined) {
	if (!spaceType) return z.string().optional();

	switch (spaceType) {
		case "ROOM":
			return RoomSubtypeSchema;
		case "COURT":
			return CourtSubtypeSchema;
		case "DINING":
			return DiningSubtypeSchema;
		case "FITNESS":
			return FitnessSubtypeSchema;
		case "PARKING":
			return ParkingSubtypeSchema;
		case "AMENITY":
			return AmenitySubtypeSchema;
		case "OUTDOOR":
		case "OTHER":
			return z.union([z.literal("OTHER"), z.literal("")]).optional();
		default:
			return z.string().optional();
	}
}

// ============================================================================
// METADATA VALIDATION HELPER
// ============================================================================

/**
 * Validates facility metadata based on spaceType and subtype from facility
 * This function should be called in the controller after validating the facility data
 */
export function validateFacilityMetadata(
	metadata: any,
	spaceType: string | null | undefined,
	subtype?: string | null,
): { success: boolean; error?: string; requirements?: any } {
	if (!metadata) {
		return { success: true };
	}

	// Convert string to object if needed
	let metadataObj = metadata;
	if (typeof metadata === "string") {
		try {
			metadataObj = JSON.parse(metadata);
		} catch (error) {
			return {
				success: false,
				error: "Failed to parse metadata JSON",
			};
		}
	}

	if (!spaceType) {
		return { success: true };
	}

	// Get the field requirements for error messages
	const requirements = getMetadataRequirements(spaceType, subtype);

	// Validate metadata based on spaceType and subtype
	try {
		// ROOM validation
		if (spaceType === "ROOM") {
			if (subtype === "GUEST_ROOM") {
				GuestRoomMetadataSchema.parse(metadataObj);
			} else if (subtype === "CONFERENCE_ROOM") {
				ConferenceRoomMetadataSchema.parse(metadataObj);
			} else if (subtype === "OFFICE") {
				OfficeMetadataSchema.parse(metadataObj);
			} else if (subtype === "STUDIO") {
				StudioMetadataSchema.parse(metadataObj);
			} else if (subtype === "CLASSROOM") {
				ClassroomMetadataSchema.parse(metadataObj);
			} else if (subtype === "BALLROOM") {
				BallroomMetadataSchema.parse(metadataObj);
			} else if (subtype === "SUITE") {
				SuiteMetadataSchema.parse(metadataObj);
			} else if (subtype === "OTHER") {
				OtherMetadataSchema.parse(metadataObj);
			}
		}
		// COURT validation
		else if (spaceType === "COURT") {
			if (subtype === "OTHER") {
				OtherMetadataSchema.parse(metadataObj);
			} else if (subtype === "MULTIPURPOSE") {
				// For MULTIPURPOSE courts, sportType is optional
				SportsCourtMetadataSchema.extend({
					sportType: z.string().optional(),
				}).parse(metadataObj);
			} else {
				SportsCourtMetadataSchema.parse(metadataObj);
			}
		}
		// DINING validation
		else if (spaceType === "DINING") {
			if (subtype === "OTHER") {
				OtherMetadataSchema.parse(metadataObj);
			} else {
				DiningMetadataSchema.parse(metadataObj);
			}
		}
		// FITNESS validation
		else if (spaceType === "FITNESS") {
			if (subtype === "OTHER") {
				OtherMetadataSchema.parse(metadataObj);
			} else {
				FitnessMetadataSchema.parse(metadataObj);
			}
		}
		// PARKING validation
		else if (spaceType === "PARKING") {
			if (subtype === "OTHER") {
				OtherMetadataSchema.parse(metadataObj);
			} else {
				ParkingMetadataSchema.parse(metadataObj);
			}
		}
		// AMENITY validation
		else if (spaceType === "AMENITY") {
			if (subtype === "OTHER") {
				OtherMetadataSchema.parse(metadataObj);
			} else {
				AmenitySpaceMetadataSchema.parse(metadataObj);
			}
		}
		// OUTDOOR validation
		else if (spaceType === "OUTDOOR") {
			OutdoorMetadataSchema.parse(metadataObj);
		}
		// OTHER validation
		else if (spaceType === "OTHER") {
			OtherMetadataSchema.parse(metadataObj);
		}

		return { success: true };
	} catch (error: any) {
		// Build detailed error message
		let message = `Metadata validation failed for spaceType="${spaceType}"`;
		if (subtype) {
			message += ` and subtype="${subtype}"`;
		}

		message += `. Required fields: ${
			requirements.required.length > 0 ? requirements.required.join(", ") : "None"
		}. Optional fields: ${
			requirements.optional.length > 0 ? requirements.optional.join(", ") : "None"
		}. Example: ${JSON.stringify(requirements.example)}`;

		return {
			success: false,
			error: message,
			requirements,
		};
	}
}
