import { z } from "zod";
import { isValidObjectId } from "mongoose";

// Addon schema aligned to Prisma Mongo model
export const AddonSchema = z.object({
	id: z.string().refine((val) => isValidObjectId(val)),
	name: z.string().min(1),
	description: z.string().optional(),
	// Organization identifier (required in Prisma model)
	organizationId: z.string().min(1),
	price: z.number(),
	currency: z.string().min(1).default("USD"),
	isActive: z.boolean().optional().default(true),
	isDeleted: z.boolean().optional().default(false),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type Addon = z.infer<typeof AddonSchema>;

// Create Addon Schema (exclude id/createdAt/updatedAt)
export const CreateAddonSchema = AddonSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	isDeleted: true,
});

export type CreateAddon = z.infer<typeof CreateAddonSchema>;

// Update Addon Schema (partial mutable fields)
export const UpdateAddonSchema = AddonSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	organizationId: true,
}).partial();

export type UpdateAddon = z.infer<typeof UpdateAddonSchema>;
