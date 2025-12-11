import { z } from "zod";
import { isValidObjectId } from "mongoose";

// RateType schema aligned to Prisma Mongo model
export const RateTypeSchema = z.object({
	id: z.string().refine((val) => isValidObjectId(val)),
	name: z.string().min(1),
	description: z.string().optional(),
	baseRate: z.number(),
	currency: z.string().min(1).default("USD"),
	billingCycle: z.string().min(1),
	serviceFee: z.number().optional(),
	tax: z.number().optional(),
	adjustments: z.any().optional(),
	isActive: z.boolean().optional(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type RateType = z.infer<typeof RateTypeSchema>;

// Create RateType Schema (exclude id/createdAt/updatedAt)
export const CreateRateTypeSchema = RateTypeSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).extend({
	// allow overrides while keeping required fields
	description: z.string().optional(),
	adjustments: z.any().optional(),
	isActive: z.boolean().optional(),
});

export type CreateTemplate = z.infer<typeof CreateRateTypeSchema>;

// Update RateType Schema (partial mutable fields)
export const UpdateRateTypeSchema = RateTypeSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).partial();

export type UpdateTemplate = z.infer<typeof UpdateRateTypeSchema>;
