import { z } from "zod";
import { isValidObjectId } from "mongoose";

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
	locationId: z.string().refine((val) => isValidObjectId(val)).optional().nullable(),
	attributes: z.any().optional(),
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
