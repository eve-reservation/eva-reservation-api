import { z } from "zod";
import { isValidObjectId } from "mongoose";

const ReservationStatusEnum = z.enum([
	"PENDING",
	"CONFIRMED",
	"CHECKED_IN",
	"CHECKED_OUT",
	"CANCELLED",
	"NO_SHOW",
]);

const ReservationPeriodSchema = z.object({
	startDateTime: z.coerce.date(),
	endDateTime: z.coerce.date(),
	numberOfDays: z.number().int().optional(),
	numberOfHours: z.number().optional(),
	originalHours: z.number().optional(),
	extendedHours: z.number().optional(),
	checkedInAt: z.coerce.date().optional(),
	checkedOutAt: z.coerce.date().optional(),
});

const PricingBaseSchema = z.object({
	planBasePrice: z.number(),
	daysBooked: z.number().int(),
	planTotal: z.number(),
});

const ChargesSchema = z.object({
	serviceFee: z.number().optional().default(0),
	extensionFee: z.number().optional().default(0),
	addonFee: z.number().optional().default(0),
});

const TaxesSchema = z.object({
	tax: z.number(),
	taxPercentage: z.number().optional().default(12),
});

const DiscountsSchema = z.object({
	couponCode: z.string().optional(),
	discount: z.number().optional().default(0),
	discountPercentage: z.number().optional(),
});

const TotalsSchema = z.object({
	subtotal: z.number(),
	totalAmount: z.number(),
});

const ReservationUserSchema = z.object({
	userId: z.string(),
	firstName: z.string().optional().nullable(),
	lastName: z.string().optional().nullable(),
	email: z.string().email().optional().nullable(),
});

// Reservation schema aligned to Prisma Mongo model
export const ReservationSchema = z.object({
	id: z.string().refine((val) => isValidObjectId(val)),
	// Organization identifier (required in Prisma model)
	organizationId: z.string().min(1).optional().nullable(),
	user: ReservationUserSchema.optional().nullable(),
	facilityId: z.string().refine((val) => isValidObjectId(val)),
	status: ReservationStatusEnum.optional().default("PENDING"),
	guestCount: z.number().int().optional().default(1),
	// Guests relation - loaded conditionally via fields parameter
	guests: z.array(z.any()).optional(),
	purpose: z.string().optional(),
	eventName: z.string().optional(),
	specialRequests: z.string().optional(),
	internalNotes: z.string().optional(),
	bookingSource: z.string().optional(),
	confirmationCode: z.string().optional(),
	checkedInBy: z.string().optional(),
	checkedOutBy: z.string().optional(),
	addOns: z.any().optional(),
	bookingPeriod: ReservationPeriodSchema.optional(),
	pricingBase: PricingBaseSchema.optional(),
	charges: ChargesSchema.optional(),
	taxes: TaxesSchema.optional(),
	discounts: DiscountsSchema.optional(),
	totals: TotalsSchema.optional(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type Reservation = z.infer<typeof ReservationSchema>;

// Create Reservation Schema (exclude id/createdAt/updatedAt/guests)
// Guests are managed separately via the Guest model
export const CreateReservationSchema = ReservationSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	guests: true,
});

export type CreateTemplate = z.infer<typeof CreateReservationSchema>;

// Update Reservation Schema (partial mutable fields)
// Guests are managed separately via the Guest model
export const UpdateReservationSchema = ReservationSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	guests: true,
}).partial();

export type UpdateTemplate = z.infer<typeof UpdateReservationSchema>;
