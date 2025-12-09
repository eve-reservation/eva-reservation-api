import { z } from "zod";
import { isValidObjectId } from "mongoose";


// Facility Schema (full, including ID)
export const FacilitySchema = z.object({
	id: z.string().refine((val) => isValidObjectId(val)),
	name: z.string().min(1),
	description: z.string().optional(),
	type: z.string().optional(),
	isDeleted: z.boolean(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type Facility = z.infer<typeof FacilitySchema>;

// Create Facility Schema (excluding ID, createdAt, updatedAt, and computed fields)
export const CreateFacilitySchema = FacilitySchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).partial({
	description: true,
	type: true,
	isDeleted: true,
});

export type CreateTemplate = z.infer<typeof CreateFacilitySchema>;

// Update Facility Schema (partial, excluding immutable fields and relations)
export const UpdateFacilitySchema = FacilitySchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	isDeleted: true,
}).partial();

export type UpdateTemplate = z.infer<typeof UpdateFacilitySchema>;
