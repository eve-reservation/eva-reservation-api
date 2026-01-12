import { z } from "zod";
import { isValidObjectId } from "mongoose";

// ============================================================================
// ENUMS
// ============================================================================

export const MatchEventStatusSchema = z.enum([
	"DRAFT",
	"OPEN",
	"FULL",
	"CONFIRMED",
	"IN_PROGRESS",
	"COMPLETED",
	"CANCELLED",
]);

export const ParticipantStatusSchema = z.enum([
	"PENDING",
	"ACCEPTED",
	"REJECTED",
	"WAITLIST",
	"CONFIRMED",
	"CHECKED_IN",
	"NO_SHOW",
	"LEFT",
]);

export type MatchEventStatus = z.infer<typeof MatchEventStatusSchema>;
export type ParticipantStatus = z.infer<typeof ParticipantStatusSchema>;

export const MatchParticipantUserSchema = z.object({
	userId: z.string(),
	firstName: z.string().optional().nullable(),
	lastName: z.string().optional().nullable(),
	email: z.string().email().optional().nullable(),
});

// ============================================================================
// MATCH EVENT SCHEMAS
// ============================================================================

const AgeRangeSchema = z
	.object({
		min: z.number().int().min(0).optional(),
		max: z.number().int().min(0).optional(),
	})
	.optional();

// Base MatchEvent schema
export const MatchEventSchema = z.object({
	id: z.string().refine((val) => isValidObjectId(val)),
	reservationId: z.string().refine((val) => isValidObjectId(val)),
	createdBy: MatchParticipantUserSchema.optional().nullable(),
	organizationId: z.string().min(1).optional().nullable(),
	title: z.string().min(1),
	description: z.string().optional().nullable(),
	maxParticipants: z.number().int().min(1).default(10),
	minParticipants: z.number().int().min(1).optional().default(2),
	allowWaitlist: z.boolean().default(true),
	status: MatchEventStatusSchema.default("DRAFT"),
	isPublic: z.boolean().default(true),
	autoAccept: z.boolean().default(false),
	skillLevel: z.string().optional().nullable(),
	genderPreference: z.enum(["MIXED", "MALE", "FEMALE"]).optional().nullable(),
	ageRange: AgeRangeSchema,
	rules: z.array(z.string()).optional().default([]),
	requirements: z.string().optional().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type MatchEvent = z.infer<typeof MatchEventSchema>;

// Create MatchEvent Schema
export const CreateMatchEventSchema = MatchEventSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
}).extend({
	reservationId: z.string().refine((val) => isValidObjectId(val)),
});

export type CreateMatchEvent = z.infer<typeof CreateMatchEventSchema>;

// Update MatchEvent Schema (partial)
export const UpdateMatchEventSchema = MatchEventSchema.omit({
	id: true,
	reservationId: true,
	createdAt: true,
	updatedAt: true,
}).partial();

export type UpdateMatchEvent = z.infer<typeof UpdateMatchEventSchema>;

// ============================================================================
// MATCH PARTICIPANT SCHEMAS
// ============================================================================

export const MatchParticipantSchema = z.object({
	id: z.string().refine((val) => isValidObjectId(val)),
	matchEventId: z.string().refine((val) => isValidObjectId(val)),
	user: MatchParticipantUserSchema.optional().nullable(),
	personId: z
		.string()
		.refine((val) => isValidObjectId(val))
		.optional()
		.nullable(),
	status: ParticipantStatusSchema.default("PENDING"),
	guestId: z
		.string()
		.refine((val) => isValidObjectId(val))
		.optional()
		.nullable(),
	joinedAt: z.coerce.date(),
	acceptedAt: z.coerce.date().optional().nullable(),
	confirmedAt: z.coerce.date().optional().nullable(),
	checkedInAt: z.coerce.date().optional().nullable(),
	leftAt: z.coerce.date().optional().nullable(),
	notes: z.string().optional().nullable(),
	metadata: z.any().optional().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type MatchParticipant = z.infer<typeof MatchParticipantSchema>;

// Create MatchParticipant Schema
export const CreateMatchParticipantSchema = MatchParticipantSchema.omit({
	id: true,
	joinedAt: true,
	acceptedAt: true,
	confirmedAt: true,
	checkedInAt: true,
	leftAt: true,
	createdAt: true,
	updatedAt: true,
}).extend({
	matchEventId: z.string().refine((val) => isValidObjectId(val)),
	user: MatchParticipantUserSchema.optional().nullable(),
});

export type CreateMatchParticipant = z.infer<typeof CreateMatchParticipantSchema>;

// Update MatchParticipant Schema (partial)
export const UpdateMatchParticipantSchema = MatchParticipantSchema.omit({
	id: true,
	matchEventId: true,
	joinedAt: true,
	createdAt: true,
	updatedAt: true,
}).partial();

export type UpdateMatchParticipant = z.infer<typeof UpdateMatchParticipantSchema>;

// Group member schema (for unregistered users)
export const GroupMemberSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email().optional(),
	phone: z.string().optional(),
});

export type GroupMember = z.infer<typeof GroupMemberSchema>;

// Join event schema (simplified for API)
export const JoinMatchEventSchema = z
	.object({
		matchEventId: z.string().refine((val) => isValidObjectId(val)),
		user: MatchParticipantUserSchema.optional().nullable(),
		personId: z
			.string()
			.refine((val) => isValidObjectId(val))
			.optional()
			.nullable(),
		notes: z.string().optional(),
		groupMembers: z.array(GroupMemberSchema).optional(), // Group members not registered in app
	})
	.refine(
		(data) => data.user || data.personId || (data.groupMembers && data.groupMembers.length > 0),
		{
			message:
				"Either user (for registered user) or groupMembers (for unregistered group) must be provided",
			path: ["user"],
		},
	);

export type JoinMatchEvent = z.infer<typeof JoinMatchEventSchema>;
