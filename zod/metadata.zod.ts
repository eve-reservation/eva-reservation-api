import { z } from "zod";

// ============================================================================
// FEATURE ENUMS - Used in Metadata Schemas
// ============================================================================

export const BedTypeSchema = z.enum([
	"SINGLE_BED",
	"DOUBLE_BED",
	"QUEEN_BED",
	"KING_BED",
	"TWIN_BED",
	"BUNK_BED",
	"SOFA_BED",
	"MURPHY_BED",
	"DAYBED",
	"FUTON",
]);

export const RoomFeatureSchema = z.enum([
	"AIR_CONDITIONING",
	"HEATING",
	"WIFI",
	"TELEVISION",
	"MINIBAR",
	"SAFE",
	"BALCONY",
	"TERRACE",
	"KITCHEN",
	"KITCHENETTE",
	"BATHROOM",
	"PRIVATE_BATHROOM",
	"SHARED_BATHROOM",
	"JACUZZI",
	"BATHTUB",
	"SHOWER",
	"HAIR_DRYER",
	"TOWELS",
	"LINENS",
	"IRON",
	"IRONING_BOARD",
	"CLOSET",
	"WARDROBE",
	"WORK_DESK",
	"SEATING_AREA",
	"DINING_AREA",
	"FIREPLACE",
	"OCEAN_VIEW",
	"MOUNTAIN_VIEW",
	"GARDEN_VIEW",
	"CITY_VIEW",
	"POOL_VIEW",
	"PARKING",
	"PET_FRIENDLY",
	"SMOKING_ALLOWED",
	"NON_SMOKING",
	"WHEELCHAIR_ACCESSIBLE",
	"ELEVATOR_ACCESS",
	"SOUNDPROOF",
	"BLACKOUT_CURTAINS",
]);

export const AmenitySchema = z.enum([
	"CONCIERGE_SERVICE",
	"ROOM_SERVICE",
	"LAUNDRY_SERVICE",
	"DRY_CLEANING",
	"VALET_PARKING",
	"BUSINESS_CENTER",
	"FITNESS_CENTER",
	"SWIMMING_POOL",
	"HOT_TUB",
	"SAUNA",
	"STEAM_ROOM",
	"SPA_SERVICES",
	"MASSAGE_SERVICES",
	"RESTAURANT",
	"BAR_LOUNGE",
	"COFFEE_SHOP",
	"GIFT_SHOP",
	"CONFERENCE_FACILITIES",
	"MEETING_ROOMS",
	"BANQUET_HALLS",
	"WEDDING_SERVICES",
	"CHILDCARE_SERVICES",
	"PET_SERVICES",
	"AIRPORT_SHUTTLE",
	"CAR_RENTAL",
	"TOUR_DESK",
	"CURRENCY_EXCHANGE",
	"ATM",
	"LUGGAGE_STORAGE",
	"WAKE_UP_CALL",
	"NEWSPAPER_DELIVERY",
	"COMPLIMENTARY_BREAKFAST",
	"HAPPY_HOUR",
	"LIBRARY",
	"GAME_ROOM",
	"TENNIS_COURT",
	"GOLF_COURSE",
	"BEACH_ACCESS",
	"SKI_ACCESS",
	"HIKING_TRAILS",
	"BICYCLE_RENTAL",
]);

// ============================================================================
// METADATA SCHEMAS - Based on SpaceType + Subtype
// ============================================================================

// ROOM Metadata Schemas
export const GuestRoomMetadataSchema = z.object({
	bedType: BedTypeSchema,
	bedCount: z.number().int().min(1, "Bed count must be a positive number"),
	maxOccupancy: z.number().int().min(1, "Max occupancy must be a positive number"),
	amenities: z.array(AmenitySchema).optional().default([]),
	roomFeatures: z.array(RoomFeatureSchema).optional().default([]),
	floorNumber: z.number().int().optional(),
	roomSize: z.number().min(0).optional(), // in square meters
	hasBalcony: z.boolean().optional().default(false),
	hasKitchen: z.boolean().optional().default(false),
});

export const ConferenceRoomMetadataSchema = z.object({
	seatingCapacity: z.number().int().min(1),
	hasProjector: z.boolean().optional().default(false),
	hasWhiteboard: z.boolean().optional().default(false),
	hasVideoConferencing: z.boolean().optional().default(false),
	hasAudioSystem: z.boolean().optional().default(false),
	layout: z.string().optional(), // e.g., "Theater", "Classroom", "U-Shape"
	equipment: z.array(z.string()).optional().default([]),
	roomSize: z.number().min(0).optional(), // in square meters
	hasNaturalLight: z.boolean().optional().default(false),
});

export const OfficeMetadataSchema = z.object({
	capacity: z.number().int().min(1),
	hasDesk: z.boolean().optional().default(true),
	hasChair: z.boolean().optional().default(true),
	hasComputer: z.boolean().optional().default(false),
	hasPhone: z.boolean().optional().default(false),
	equipment: z.array(z.string()).optional().default([]),
	roomSize: z.number().min(0).optional(),
	isPrivate: z.boolean().optional().default(true),
});

export const StudioMetadataSchema = z.object({
	studioType: z.string(), // e.g., "Photography", "Recording", "Art"
	equipment: z.array(z.string()).optional().default([]),
	roomSize: z.number().min(0).optional(),
	hasSoundproofing: z.boolean().optional().default(false),
	hasNaturalLight: z.boolean().optional().default(false),
	capacity: z.number().int().min(1).optional(),
});

export const ClassroomMetadataSchema = z.object({
	seatingCapacity: z.number().int().min(1),
	hasProjector: z.boolean().optional().default(false),
	hasWhiteboard: z.boolean().optional().default(false),
	hasAudioSystem: z.boolean().optional().default(false),
	layout: z.string().optional(), // e.g., "Theater", "Classroom", "Seminar"
	equipment: z.array(z.string()).optional().default([]),
	roomSize: z.number().min(0).optional(),
});

export const BallroomMetadataSchema = z.object({
	capacity: z.number().int().min(1),
	roomSize: z.number().min(0), // Required for ballrooms
	hasDanceFloor: z.boolean().optional().default(false),
	hasStage: z.boolean().optional().default(false),
	hasAudioSystem: z.boolean().optional().default(false),
	hasLighting: z.boolean().optional().default(false),
	hasCatering: z.boolean().optional().default(false),
	equipment: z.array(z.string()).optional().default([]),
	layout: z.string().optional(),
});

export const SuiteMetadataSchema = z.object({
	bedType: BedTypeSchema,
	bedCount: z.number().int().min(1),
	maxOccupancy: z.number().int().min(1),
	numberOfRooms: z.number().int().min(2), // Suites have multiple rooms
	amenities: z.array(AmenitySchema).optional().default([]),
	roomFeatures: z.array(RoomFeatureSchema).optional().default([]),
	roomSize: z.number().min(0).optional(),
	hasLivingRoom: z.boolean().optional().default(false),
	hasKitchen: z.boolean().optional().default(false),
	hasDiningArea: z.boolean().optional().default(false),
});

// COURT Metadata Schemas
export const SportsCourtMetadataSchema = z.object({
	sportType: z.string().optional(), // e.g., "Tennis", "Basketball", "Volleyball"
	surfaceType: z.string().optional(), // e.g., "Clay", "Hardcourt", "Grass", "Wooden"
	isIndoor: z.boolean().optional().default(false),
	hasLighting: z.boolean().optional().default(false),
	maxPlayers: z.number().int().min(1).optional(),
	equipmentProvided: z.array(z.string()).optional().default([]),
	openingHours: z.string().optional(),
	courtSize: z.string().optional(), // e.g., "Standard", "Half-court"
});

// DINING Metadata Schemas
export const DiningMetadataSchema = z.object({
	cuisineType: z.string().optional(),
	seatingCapacity: z.number().int().min(1).optional(),
	hasDelivery: z.boolean().optional().default(false),
	hasTakeout: z.boolean().optional().default(false),
	openingHours: z.string().optional(),
	menuUrl: z.string().url().optional(),
	avgMealPrice: z.number().min(0).optional(),
	dressCode: z.string().optional(),
	hasOutdoorSeating: z.boolean().optional().default(false),
	hasPrivateDining: z.boolean().optional().default(false),
});

// FITNESS Metadata Schemas
export const FitnessMetadataSchema = z.object({
	equipment: z.array(z.string()).optional().default([]),
	hasTrainer: z.boolean().optional().default(false),
	hasLockers: z.boolean().optional().default(false),
	hasShowers: z.boolean().optional().default(false),
	openingHours: z.string().optional(),
	capacity: z.number().int().min(1).optional(),
	specialtyArea: z.string().optional(), // e.g., "Cardio", "Weights", "Yoga"
	classesOffered: z.array(z.string()).optional().default([]),
});

// PARKING Metadata Schemas
export const ParkingMetadataSchema = z.object({
	vehicleType: z.string().optional(), // e.g., "Car", "Motorcycle", "Truck", "Bicycle"
	isUnderground: z.boolean().optional().default(false),
	isCovered: z.boolean().optional().default(false),
	hasElectricCharging: z.boolean().optional().default(false),
	chargingType: z.string().optional(), // e.g., "Level 2", "DC Fast Charging"
	maxVehicleHeight: z.number().optional(), // in meters
	maxVehicleWidth: z.number().optional(), // in meters
	securityLevel: z.string().optional(), // e.g., "Basic", "Monitored", "Gated"
	hasCCTV: z.boolean().optional().default(false),
	isAccessControlled: z.boolean().optional().default(false),
});

// AMENITY Metadata Schemas
export const AmenitySpaceMetadataSchema = z.object({
	amenityType: z.string(), // e.g., "Pool", "Spa", "Library", "Garden"
	capacity: z.number().int().min(1).optional(),
	requiresReservation: z.boolean().optional().default(false),
	openingHours: z.string().optional(),
	ageRestriction: z.string().optional(), // e.g., "Adults Only", "All Ages", "18+"
	additionalFees: z.number().min(0).optional(),
	equipment: z.array(z.string()).optional().default([]),
	features: z.array(z.string()).optional().default([]),
	hasSupervision: z.boolean().optional().default(false),
});

// OUTDOOR Metadata Schemas
export const OutdoorMetadataSchema = z.object({
	outdoorType: z.string(), // e.g., "Garden", "Terrace", "Patio", "Courtyard"
	capacity: z.number().int().min(1).optional(),
	area: z.number().min(0).optional(), // in square meters
	hasSeating: z.boolean().optional().default(false),
	hasShade: z.boolean().optional().default(false),
	hasLighting: z.boolean().optional().default(false),
	features: z.array(z.string()).optional().default([]),
	requiresReservation: z.boolean().optional().default(false),
	openingHours: z.string().optional(),
});

// OTHER Metadata Schema
export const OtherMetadataSchema = z.object({
	customType: z.string(),
	description: z.string().optional(),
	features: z.array(z.string()).optional().default([]),
	requirements: z.array(z.string()).optional().default([]),
	capacity: z.number().int().min(1).optional(),
	openingHours: z.string().optional(),
});

// ============================================================================
// METADATA FIELD REQUIREMENTS HELPER
// ============================================================================

/**
 * Returns the required and optional fields for a given spaceType + subtype combination
 */
export function getMetadataRequirements(
	spaceType: string | null | undefined,
	subtype?: string | null,
): {
	required: string[];
	optional: string[];
	schema: string;
	example: Record<string, any>;
} {
	const requirements = {
		ROOM: {
			GUEST_ROOM: {
				required: ["bedType", "bedCount", "maxOccupancy"],
				optional: [
					"amenities",
					"roomFeatures",
					"floorNumber",
					"roomSize",
					"hasBalcony",
					"hasKitchen",
				],
				schema: "GuestRoomMetadata",
				example: {
					bedType: "KING_BED",
					bedCount: 1,
					maxOccupancy: 2,
					roomFeatures: ["WIFI", "AIR_CONDITIONING"],
					amenities: ["ROOM_SERVICE"],
					roomSize: 45,
				},
			},
			CONFERENCE_ROOM: {
				required: ["seatingCapacity"],
				optional: [
					"hasProjector",
					"hasWhiteboard",
					"hasVideoConferencing",
					"hasAudioSystem",
					"layout",
					"equipment",
					"roomSize",
					"hasNaturalLight",
				],
				schema: "ConferenceRoomMetadata",
				example: {
					seatingCapacity: 20,
					hasProjector: true,
					hasVideoConferencing: true,
					equipment: ["Screen", "Whiteboard"],
				},
			},
			OFFICE: {
				required: ["capacity"],
				optional: [
					"hasDesk",
					"hasChair",
					"hasComputer",
					"hasPhone",
					"equipment",
					"roomSize",
					"isPrivate",
				],
				schema: "OfficeMetadata",
				example: {
					capacity: 1,
					hasDesk: true,
					hasChair: true,
					isPrivate: true,
				},
			},
			STUDIO: {
				required: ["studioType"],
				optional: [
					"equipment",
					"roomSize",
					"hasSoundproofing",
					"hasNaturalLight",
					"capacity",
				],
				schema: "StudioMetadata",
				example: {
					studioType: "Photography",
					equipment: ["Lighting", "Backdrop"],
					roomSize: 50,
				},
			},
			CLASSROOM: {
				required: ["seatingCapacity"],
				optional: [
					"hasProjector",
					"hasWhiteboard",
					"hasAudioSystem",
					"layout",
					"equipment",
					"roomSize",
				],
				schema: "ClassroomMetadata",
				example: {
					seatingCapacity: 30,
					hasProjector: true,
					hasWhiteboard: true,
				},
			},
			BALLROOM: {
				required: ["capacity", "roomSize"],
				optional: [
					"hasDanceFloor",
					"hasStage",
					"hasAudioSystem",
					"hasLighting",
					"hasCatering",
					"equipment",
					"layout",
				],
				schema: "BallroomMetadata",
				example: {
					capacity: 200,
					roomSize: 300,
					hasDanceFloor: true,
					hasStage: true,
				},
			},
			SUITE: {
				required: ["bedType", "bedCount", "maxOccupancy", "numberOfRooms"],
				optional: [
					"amenities",
					"roomFeatures",
					"roomSize",
					"hasLivingRoom",
					"hasKitchen",
					"hasDiningArea",
				],
				schema: "SuiteMetadata",
				example: {
					bedType: "QUEEN_BED",
					bedCount: 2,
					maxOccupancy: 4,
					numberOfRooms: 2,
					hasLivingRoom: true,
				},
			},
			OTHER: {
				required: ["customType"],
				optional: ["description", "features", "requirements", "capacity", "openingHours"],
				schema: "OtherMetadata",
				example: {
					customType: "Custom Room Type",
					description: "Custom description",
				},
			},
		},
		COURT: {
			default: {
				required: ["sportType"],
				optional: [
					"surfaceType",
					"isIndoor",
					"hasLighting",
					"maxPlayers",
					"equipmentProvided",
					"openingHours",
					"courtSize",
				],
				schema: "SportsCourtMetadata",
				example: {
					sportType: "Tennis",
					surfaceType: "Hardcourt",
					isIndoor: true,
					maxPlayers: 4,
				},
			},
			MULTIPURPOSE: {
				required: [],
				optional: [
					"sportType",
					"surfaceType",
					"isIndoor",
					"hasLighting",
					"maxPlayers",
					"equipmentProvided",
					"openingHours",
					"courtSize",
				],
				schema: "SportsCourtMetadata",
				example: {
					surfaceType: "Hardcourt",
					isIndoor: true,
					maxPlayers: 4,
					equipmentProvided: ["Balls", "Net"],
				},
			},
		},
		DINING: {
			default: {
				required: [],
				optional: [
					"cuisineType",
					"seatingCapacity",
					"hasDelivery",
					"hasTakeout",
					"openingHours",
					"menuUrl",
					"avgMealPrice",
					"dressCode",
					"hasOutdoorSeating",
					"hasPrivateDining",
				],
				schema: "DiningMetadata",
				example: {
					cuisineType: "Italian",
					seatingCapacity: 50,
					hasDelivery: false,
				},
			},
		},
		FITNESS: {
			default: {
				required: [],
				optional: [
					"equipment",
					"hasTrainer",
					"hasLockers",
					"hasShowers",
					"openingHours",
					"capacity",
					"specialtyArea",
					"classesOffered",
				],
				schema: "FitnessMetadata",
				example: {
					equipment: ["Treadmills", "Weights"],
					hasTrainer: true,
					capacity: 30,
				},
			},
		},
		PARKING: {
			default: {
				required: [],
				optional: [
					"vehicleType",
					"isUnderground",
					"isCovered",
					"hasElectricCharging",
					"chargingType",
					"maxVehicleHeight",
					"maxVehicleWidth",
					"securityLevel",
					"hasCCTV",
					"isAccessControlled",
				],
				schema: "ParkingMetadata",
				example: {
					vehicleType: "Car",
					isCovered: true,
					hasElectricCharging: true,
				},
			},
		},
		AMENITY: {
			default: {
				required: ["amenityType"],
				optional: [
					"capacity",
					"requiresReservation",
					"openingHours",
					"ageRestriction",
					"additionalFees",
					"equipment",
					"features",
					"hasSupervision",
				],
				schema: "AmenitySpaceMetadata",
				example: {
					amenityType: "Swimming Pool",
					capacity: 50,
					requiresReservation: false,
				},
			},
		},
		OUTDOOR: {
			default: {
				required: ["outdoorType"],
				optional: [
					"capacity",
					"area",
					"hasSeating",
					"hasShade",
					"hasLighting",
					"features",
					"requiresReservation",
					"openingHours",
				],
				schema: "OutdoorMetadata",
				example: {
					outdoorType: "Garden",
					capacity: 30,
					hasSeating: true,
				},
			},
		},
		OTHER: {
			default: {
				required: ["customType"],
				optional: ["description", "features", "requirements", "capacity", "openingHours"],
				schema: "OtherMetadata",
				example: {
					customType: "Custom Facility Type",
					description: "Custom description",
				},
			},
		},
	} as any;

	if (!spaceType) {
		return requirements.OTHER.default;
	}

	// Handle ROOM space type with specific subtypes
	if (spaceType === "ROOM" && subtype) {
		return requirements.ROOM[subtype] || requirements.ROOM.OTHER;
	}

	// Handle COURT space type with MULTIPURPOSE subtype
	if (spaceType === "COURT" && subtype === "MULTIPURPOSE") {
		return requirements.COURT.MULTIPURPOSE;
	}

	// For other space types, use the default schema (they don't have subtype variations in validation)
	if (requirements[spaceType]) {
		if (subtype === "OTHER" && requirements[spaceType].OTHER) {
			return requirements[spaceType].OTHER;
		}
		return requirements[spaceType].default || requirements.OTHER.default;
	}

	// Fallback to OTHER if spaceType not found
	return requirements.OTHER.default;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type BedType = z.infer<typeof BedTypeSchema>;
export type RoomFeature = z.infer<typeof RoomFeatureSchema>;
export type Amenity = z.infer<typeof AmenitySchema>;

// Metadata types
export type GuestRoomMetadata = z.infer<typeof GuestRoomMetadataSchema>;
export type ConferenceRoomMetadata = z.infer<typeof ConferenceRoomMetadataSchema>;
export type OfficeMetadata = z.infer<typeof OfficeMetadataSchema>;
export type StudioMetadata = z.infer<typeof StudioMetadataSchema>;
export type ClassroomMetadata = z.infer<typeof ClassroomMetadataSchema>;
export type BallroomMetadata = z.infer<typeof BallroomMetadataSchema>;
export type SuiteMetadata = z.infer<typeof SuiteMetadataSchema>;
export type SportsCourtMetadata = z.infer<typeof SportsCourtMetadataSchema>;
export type DiningMetadata = z.infer<typeof DiningMetadataSchema>;
export type FitnessMetadata = z.infer<typeof FitnessMetadataSchema>;
export type ParkingMetadata = z.infer<typeof ParkingMetadataSchema>;
export type AmenitySpaceMetadata = z.infer<typeof AmenitySpaceMetadataSchema>;
export type OutdoorMetadata = z.infer<typeof OutdoorMetadataSchema>;
export type OtherMetadata = z.infer<typeof OtherMetadataSchema>;
