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

export type FacilityStatus = z.infer<typeof FacilityStatusSchema>;

// Facility schema aligned to Prisma Mongo model
export const FacilitySchema = z.object({
	id: z.string().refine((val) => isValidObjectId(val)),
	facilityTypeId: z.string().refine((val) => isValidObjectId(val)),
	identifier: z.string().min(1),
	displayName: z.string().optional().nullable(),
	organizationId: z.string().min(1),
	locationId: z
		.string()
		.refine((val) => isValidObjectId(val))
		.optional()
		.nullable(),
	attributes: z.any().optional(),
	metadata: z.union([z.string(), z.record(z.any())]).optional(),
	images: z.array(FacilityImageSchema).optional().default([]),
	status: FacilityStatusSchema.optional().default("AVAILABLE"),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type Facility = z.infer<typeof FacilitySchema>;

// Create Facility Schema (exclude id/createdAt/updatedAt)
export const CreateFacilitySchema = FacilitySchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export type CreateTemplate = z.infer<typeof CreateFacilitySchema>;

// Update Facility Schema (partial mutable fields)
export const UpdateFacilitySchema = FacilitySchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).partial();

export type UpdateTemplate = z.infer<typeof UpdateFacilitySchema>;

// ============================================================================
// METADATA VALIDATION HELPER
// ============================================================================

/**
 * Validates facility metadata based on spaceType and subtype from facilityType
 * This function should be called in the controller after fetching the facilityType
 */
export function validateFacilityMetadata(
	metadata: any,
	spaceType: string,
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
