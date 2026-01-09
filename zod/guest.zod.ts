import { z } from "zod";
import { isValidObjectId } from "mongoose";

// Guest schema aligned to Prisma Mongo model
// Stores minimal guest data for reservations
export const GuestSchema = z.object({
	id: z.string().refine((val) => isValidObjectId(val)),
	// Organization identifier (required in Prisma model)
	organizationId: z.string().min(1),
	reservationId: z.string().refine((val) => isValidObjectId(val)),
	// Optional: Link to Person for full details
	personId: z
		.string()
		.refine((val) => isValidObjectId(val))
		.optional(),
	// Minimal guest data (essential for reservations)
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	// Additional optional fields
	specialRequests: z.string().optional(),
	dietaryRestrictions: z.string().optional(),
	// Metadata
	isPrimaryGuest: z.boolean().optional().default(false),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	isDeleted: z.boolean().optional().default(false),
});

export type Guest = z.infer<typeof GuestSchema>;

// Create Guest Schema (exclude id/createdAt/updatedAt)
export const CreateGuestSchema = GuestSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export type CreateGuest = z.infer<typeof CreateGuestSchema>;

// Update Guest Schema (partial mutable fields)
export const UpdateGuestSchema = GuestSchema.omit({
	id: true,
	reservationId: true,
	createdAt: true,
	updatedAt: true,
}).partial();

export type UpdateGuest = z.infer<typeof UpdateGuestSchema>;
