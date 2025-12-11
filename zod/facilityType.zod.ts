import { z } from "zod";

export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

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

// ============================================================================
// FEATURE ENUMS
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
	sportType: z.string(), // e.g., "Tennis", "Basketball", "Volleyball"
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
// DISCRIMINATED UNION FOR METADATA VALIDATION
// ============================================================================

// Room metadata variants
const RoomMetadataVariants = z.discriminatedUnion("subtype", [
	z.object({ subtype: z.literal("GUEST_ROOM"), metadata: GuestRoomMetadataSchema }),
	z.object({ subtype: z.literal("CONFERENCE_ROOM"), metadata: ConferenceRoomMetadataSchema }),
	z.object({ subtype: z.literal("OFFICE"), metadata: OfficeMetadataSchema }),
	z.object({ subtype: z.literal("STUDIO"), metadata: StudioMetadataSchema }),
	z.object({ subtype: z.literal("CLASSROOM"), metadata: ClassroomMetadataSchema }),
	z.object({ subtype: z.literal("BALLROOM"), metadata: BallroomMetadataSchema }),
	z.object({ subtype: z.literal("SUITE"), metadata: SuiteMetadataSchema }),
	z.object({ subtype: z.literal("OTHER"), metadata: OtherMetadataSchema }),
]);

// Court metadata (all court types use the same schema)
const CourtMetadataVariants = z.discriminatedUnion("subtype", [
	z.object({ subtype: z.literal("TENNIS"), metadata: SportsCourtMetadataSchema }),
	z.object({ subtype: z.literal("BASKETBALL"), metadata: SportsCourtMetadataSchema }),
	z.object({ subtype: z.literal("VOLLEYBALL"), metadata: SportsCourtMetadataSchema }),
	z.object({ subtype: z.literal("BADMINTON"), metadata: SportsCourtMetadataSchema }),
	z.object({ subtype: z.literal("SQUASH"), metadata: SportsCourtMetadataSchema }),
	z.object({ subtype: z.literal("RACQUETBALL"), metadata: SportsCourtMetadataSchema }),
	z.object({ subtype: z.literal("PICKLEBALL"), metadata: SportsCourtMetadataSchema }),
	z.object({ subtype: z.literal("MULTIPURPOSE"), metadata: SportsCourtMetadataSchema }),
	z.object({ subtype: z.literal("OTHER"), metadata: OtherMetadataSchema }),
]);

// Dining metadata (all dining types use the same schema)
const DiningMetadataVariants = z.discriminatedUnion("subtype", [
	z.object({ subtype: z.literal("FINE_DINING"), metadata: DiningMetadataSchema }),
	z.object({ subtype: z.literal("CASUAL_DINING"), metadata: DiningMetadataSchema }),
	z.object({ subtype: z.literal("CAFE"), metadata: DiningMetadataSchema }),
	z.object({ subtype: z.literal("BAR"), metadata: DiningMetadataSchema }),
	z.object({ subtype: z.literal("LOUNGE"), metadata: DiningMetadataSchema }),
	z.object({ subtype: z.literal("BUFFET"), metadata: DiningMetadataSchema }),
	z.object({ subtype: z.literal("PRIVATE_DINING"), metadata: DiningMetadataSchema }),
	z.object({ subtype: z.literal("FOOD_COURT"), metadata: DiningMetadataSchema }),
	z.object({ subtype: z.literal("OTHER"), metadata: OtherMetadataSchema }),
]);

// Fitness metadata (all fitness types use the same schema)
const FitnessMetadataVariants = z.discriminatedUnion("subtype", [
	z.object({ subtype: z.literal("WEIGHT_ROOM"), metadata: FitnessMetadataSchema }),
	z.object({ subtype: z.literal("CARDIO_AREA"), metadata: FitnessMetadataSchema }),
	z.object({ subtype: z.literal("YOGA_STUDIO"), metadata: FitnessMetadataSchema }),
	z.object({ subtype: z.literal("SPIN_STUDIO"), metadata: FitnessMetadataSchema }),
	z.object({ subtype: z.literal("CROSSFIT_BOX"), metadata: FitnessMetadataSchema }),
	z.object({ subtype: z.literal("PILATES_STUDIO"), metadata: FitnessMetadataSchema }),
	z.object({ subtype: z.literal("MULTIPURPOSE"), metadata: FitnessMetadataSchema }),
	z.object({ subtype: z.literal("OTHER"), metadata: OtherMetadataSchema }),
]);

// Parking metadata (all parking types use the same schema)
const ParkingMetadataVariants = z.discriminatedUnion("subtype", [
	z.object({ subtype: z.literal("COVERED"), metadata: ParkingMetadataSchema }),
	z.object({ subtype: z.literal("OPEN_LOT"), metadata: ParkingMetadataSchema }),
	z.object({ subtype: z.literal("GARAGE"), metadata: ParkingMetadataSchema }),
	z.object({ subtype: z.literal("VALET"), metadata: ParkingMetadataSchema }),
	z.object({ subtype: z.literal("EV_CHARGING"), metadata: ParkingMetadataSchema }),
	z.object({ subtype: z.literal("DISABLED"), metadata: ParkingMetadataSchema }),
	z.object({ subtype: z.literal("MOTORCYCLE"), metadata: ParkingMetadataSchema }),
	z.object({ subtype: z.literal("BICYCLE"), metadata: ParkingMetadataSchema }),
	z.object({ subtype: z.literal("OTHER"), metadata: OtherMetadataSchema }),
]);

// Amenity metadata (all amenity types use the same schema)
const AmenityMetadataVariants = z.discriminatedUnion("subtype", [
	z.object({ subtype: z.literal("SWIMMING_POOL"), metadata: AmenitySpaceMetadataSchema }),
	z.object({ subtype: z.literal("HOT_TUB"), metadata: AmenitySpaceMetadataSchema }),
	z.object({ subtype: z.literal("SAUNA"), metadata: AmenitySpaceMetadataSchema }),
	z.object({ subtype: z.literal("STEAM_ROOM"), metadata: AmenitySpaceMetadataSchema }),
	z.object({ subtype: z.literal("SPA"), metadata: AmenitySpaceMetadataSchema }),
	z.object({ subtype: z.literal("LIBRARY"), metadata: AmenitySpaceMetadataSchema }),
	z.object({ subtype: z.literal("BUSINESS_CENTER"), metadata: AmenitySpaceMetadataSchema }),
	z.object({ subtype: z.literal("GAME_ROOM"), metadata: AmenitySpaceMetadataSchema }),
	z.object({ subtype: z.literal("LOUNGE"), metadata: AmenitySpaceMetadataSchema }),
	z.object({ subtype: z.literal("ROOFTOP"), metadata: AmenitySpaceMetadataSchema }),
	z.object({ subtype: z.literal("GARDEN"), metadata: AmenitySpaceMetadataSchema }),
	z.object({ subtype: z.literal("OTHER"), metadata: OtherMetadataSchema }),
]);

// Top-level discriminated union by spaceType
export const TypeMetadataSchema = z.discriminatedUnion("spaceType", [
	z.object({ spaceType: z.literal("ROOM"), subtype: RoomSubtypeSchema, metadata: z.any() }),
	z.object({ spaceType: z.literal("COURT"), subtype: CourtSubtypeSchema, metadata: z.any() }),
	z.object({ spaceType: z.literal("DINING"), subtype: DiningSubtypeSchema, metadata: z.any() }),
	z.object({ spaceType: z.literal("FITNESS"), subtype: FitnessSubtypeSchema, metadata: z.any() }),
	z.object({ spaceType: z.literal("PARKING"), subtype: ParkingSubtypeSchema, metadata: z.any() }),
	z.object({ spaceType: z.literal("AMENITY"), subtype: AmenitySubtypeSchema, metadata: z.any() }),
	z.object({
		spaceType: z.literal("OUTDOOR"),
		subtype: z.string().optional(),
		metadata: OutdoorMetadataSchema,
	}),
	z.object({
		spaceType: z.literal("OTHER"),
		subtype: z.string().optional(),
		metadata: OtherMetadataSchema,
	}),
]);

// ============================================================================
// METADATA FIELD REQUIREMENTS HELPER
// ============================================================================

/**
 * Returns the required and optional fields for a given spaceType + subtype combination
 */
export function getMetadataRequirements(
	spaceType: string,
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

	// Handle ROOM space type with specific subtypes
	if (spaceType === "ROOM" && subtype) {
		return requirements.ROOM[subtype] || requirements.ROOM.OTHER;
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
// PREPROCESSING & MAIN SCHEMAS
// ============================================================================

const preprocessFacilityTypeData = z.preprocess(
	(data: any) => {
		console.log("🚀 Starting preprocessing with raw data:", JSON.stringify(data, null, 2));

		if (!data || typeof data !== "object") {
			console.log("❌ Data is null, undefined, or not an object");
			return data;
		}

		const processed = { ...data };
		console.log("📋 Initial processed data:", JSON.stringify(processed, null, 2));

		// Handle metadata if it's a string (from form data)
		if (processed.metadata && typeof processed.metadata === "string") {
			try {
				console.log("🔧 Parsing metadata string:", processed.metadata);
				processed.metadata = JSON.parse(processed.metadata);
				console.log("✅ Successfully parsed metadata:", processed.metadata);
			} catch (error) {
				console.error("❌ Failed to parse metadata:", error);
				processed.metadata = {};
			}
		}

		// Handle array fields
		if (processed.imageUrl && typeof processed.imageUrl === "string") {
			try {
				processed.imageUrl = JSON.parse(processed.imageUrl);
			} catch {
				processed.imageUrl = processed.imageUrl
					.split(",")
					.map((item: string) => item.trim())
					.filter((item: string) => item);
			}
		}

		console.log("🔄 Processed data before validation:", JSON.stringify(processed, null, 2));
		return processed;
	},
	z
		.object({
			name: z
				.string()
				.min(1, "Name is required and must be a non-empty string")
				.max(255, "Name must be at most 255 characters"),
			code: z.string().max(50, "Code must be at most 50 characters").optional(),
			description: z
				.string()
				.max(1000, "Description must be at most 1000 characters")
				.optional(),
			spaceType: SpaceTypeSchema,
			subtype: z.string().optional(),
			organizationId: ObjectIdSchema,
			metadata: z.union([z.string(), z.record(z.any())]).optional(),
			rateTypeId: ObjectIdSchema.optional(),
			imageUrl: z.array(z.string().url("Invalid image URL")).optional().default([]),
			path: z.string().optional(),
			// For handling image removal during updates
			removeImageUrls: z.array(z.string().url("Invalid image URL")).optional(),
		})
		.superRefine((data, ctx) => {
			// Skip validation if metadata is missing
			if (!data.metadata) {
				return;
			}

			// Convert string to object if needed
			let metadata = data.metadata;
			if (typeof metadata === "string") {
				try {
					metadata = JSON.parse(metadata);
				} catch (error) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Failed to parse metadata JSON",
						path: ["metadata"],
					});
					return;
				}
			}

			// Get the field requirements for error messages
			const requirements = getMetadataRequirements(data.spaceType, data.subtype);

			// Validate metadata based on spaceType and subtype
			try {
				console.log(
					"🔍 Validating metadata for spaceType:",
					data.spaceType,
					"subtype:",
					data.subtype,
				);
				console.log("🔍 Metadata to validate:", JSON.stringify(metadata, null, 2));

				// ROOM validation
				if (data.spaceType === "ROOM") {
					if (data.subtype === "GUEST_ROOM") {
						GuestRoomMetadataSchema.parse(metadata);
					} else if (data.subtype === "CONFERENCE_ROOM") {
						ConferenceRoomMetadataSchema.parse(metadata);
					} else if (data.subtype === "OFFICE") {
						OfficeMetadataSchema.parse(metadata);
					} else if (data.subtype === "STUDIO") {
						StudioMetadataSchema.parse(metadata);
					} else if (data.subtype === "CLASSROOM") {
						ClassroomMetadataSchema.parse(metadata);
					} else if (data.subtype === "BALLROOM") {
						BallroomMetadataSchema.parse(metadata);
					} else if (data.subtype === "SUITE") {
						SuiteMetadataSchema.parse(metadata);
					} else if (data.subtype === "OTHER") {
						OtherMetadataSchema.parse(metadata);
					}
				}
				// COURT validation
				else if (data.spaceType === "COURT") {
					if (data.subtype === "OTHER") {
						OtherMetadataSchema.parse(metadata);
					} else {
						SportsCourtMetadataSchema.parse(metadata);
					}
				}
				// DINING validation
				else if (data.spaceType === "DINING") {
					if (data.subtype === "OTHER") {
						OtherMetadataSchema.parse(metadata);
					} else {
						DiningMetadataSchema.parse(metadata);
					}
				}
				// FITNESS validation
				else if (data.spaceType === "FITNESS") {
					if (data.subtype === "OTHER") {
						OtherMetadataSchema.parse(metadata);
					} else {
						FitnessMetadataSchema.parse(metadata);
					}
				}
				// PARKING validation
				else if (data.spaceType === "PARKING") {
					if (data.subtype === "OTHER") {
						OtherMetadataSchema.parse(metadata);
					} else {
						ParkingMetadataSchema.parse(metadata);
					}
				}
				// AMENITY validation
				else if (data.spaceType === "AMENITY") {
					if (data.subtype === "OTHER") {
						OtherMetadataSchema.parse(metadata);
					} else {
						AmenitySpaceMetadataSchema.parse(metadata);
					}
				}
				// OUTDOOR validation
				else if (data.spaceType === "OUTDOOR") {
					OutdoorMetadataSchema.parse(metadata);
				}
				// OTHER validation
				else if (data.spaceType === "OTHER") {
					OtherMetadataSchema.parse(metadata);
				}

				console.log("✅ Metadata validation passed!");
			} catch (error: any) {
				console.error("❌ Metadata validation failed:", error);
				console.error(
					"📄 Failed with spaceType:",
					data.spaceType,
					"subtype:",
					data.subtype,
				);
				console.error("📄 Failed with metadata:", JSON.stringify(metadata, null, 2));

				// Build detailed error message
				let message = `Metadata validation failed for spaceType="${data.spaceType}"`;
				if (data.subtype) {
					message += ` and subtype="${data.subtype}"`;
				}

				message += `. Required fields: ${
					requirements.required.length > 0 ? requirements.required.join(", ") : "None"
				}. Optional fields: ${
					requirements.optional.length > 0 ? requirements.optional.join(", ") : "None"
				}. Example: ${JSON.stringify(requirements.example)}`;

				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message,
					path: ["metadata"],
					params: {
						spaceType: data.spaceType,
						subtype: data.subtype,
						required: requirements.required,
						optional: requirements.optional,
						schema: requirements.schema,
						example: requirements.example,
					},
				});
			}
		})
		.transform((data) => {
			// Final transformation to ensure metadata is an object
			if (typeof data.metadata === "string") {
				try {
					console.log("🔄 Transform: Converting metadata string to object");
					data.metadata = JSON.parse(data.metadata);
				} catch (error) {
					console.error("❌ Transform failed for metadata:", error);
					data.metadata = {};
				}
			}
			console.log("✅ Final metadata:", data.metadata);
			return data;
		}),
);

export const CreateFacilityTypeSchema = preprocessFacilityTypeData;

export const UpdateFacilityTypeSchema = z.preprocess(
	(data: any) => {
		if (!data || typeof data !== "object") return data;

		const processed = { ...data };

		// Handle metadata if it's a string (from form data)
		if (processed.metadata && typeof processed.metadata === "string") {
			try {
				processed.metadata = JSON.parse(processed.metadata);
			} catch (error) {
				processed.metadata = {};
			}
		}

		// Handle array fields
		const arrayFields = ["imageUrl", "removeImageUrls"];
		for (const field of arrayFields) {
			if (processed[field] && typeof processed[field] === "string") {
				try {
					processed[field] = JSON.parse(processed[field]);
				} catch {
					processed[field] = processed[field]
						.split(",")
						.map((item: string) => item.trim())
						.filter((item: string) => item);
				}
			}
		}

		return processed;
	},
	z
		.object({
			name: z
				.string()
				.min(1, "Name is required and must be a non-empty string")
				.max(255, "Name must be at most 255 characters")
				.optional(),
			code: z.string().max(50, "Code must be at most 50 characters").optional(),
			description: z
				.string()
				.max(1000, "Description must be at most 1000 characters")
				.optional(),
			spaceType: SpaceTypeSchema.optional(),
			subtype: z.string().optional(),
			metadata: z.union([z.string(), z.record(z.any())]).optional(),
			organizationId: ObjectIdSchema.optional(),
			rateTypeId: ObjectIdSchema.optional(),
			imageUrl: z.array(z.string().url("Invalid image URL")).optional(),
			path: z.string().optional(),
			// For handling image removal during updates
			removeImageUrls: z.array(z.string().url("Invalid image URL")).optional(),
		})
		.partial(),
);

export const FacilityTypeResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	code: z.string().optional(),
	description: z.string().optional(),
	spaceType: SpaceTypeSchema,
	subtype: z.string().optional(),
	organizationId: z.string(),
	metadata: z.record(z.any()).nullable(),
	rateTypeId: z.string().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
	imageUrl: z.array(z.string()),
	path: z.string().optional(),
});

export const FacilityTypeQuerySchema = z.object({
	organizationId: ObjectIdSchema.optional(),
	spaceType: SpaceTypeSchema.optional(),
	subtype: z.string().optional(),
	name: z.string().optional(),
});

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type SpaceType = z.infer<typeof SpaceTypeSchema>;
export type RoomSubtype = z.infer<typeof RoomSubtypeSchema>;
export type CourtSubtype = z.infer<typeof CourtSubtypeSchema>;
export type DiningSubtype = z.infer<typeof DiningSubtypeSchema>;
export type FitnessSubtype = z.infer<typeof FitnessSubtypeSchema>;
export type ParkingSubtype = z.infer<typeof ParkingSubtypeSchema>;
export type AmenitySubtype = z.infer<typeof AmenitySubtypeSchema>;

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

// Schema types
export type CreateFacilityTypeInput = z.infer<typeof CreateFacilityTypeSchema>;
export type UpdateFacilityTypeInput = z.infer<typeof UpdateFacilityTypeSchema>;
export type FacilityTypeResponse = z.infer<typeof FacilityTypeResponseSchema>;
export type FacilityTypeQuery = z.infer<typeof FacilityTypeQuerySchema>;
