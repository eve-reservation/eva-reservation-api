import { z } from "zod";

export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// ============================================================================
// ENUMS - Matching Prisma Schema
// ============================================================================

export const LocationTypeSchema = z.enum([
	"BUILDING",
	"FLOOR",
	"WING",
	"AREA",
	"ZONE",
	"SECTION",
	"BLOCK",
	"OUTDOOR",
	"OTHER",
]);

export const BuildingTypeSchema = z.enum([
	"MAIN",
	"ANNEX",
	"TOWER",
	"PAVILION",
	"COTTAGE",
	"VILLA",
	"CLUBHOUSE",
	"STANDALONE",
	"OTHER",
]);

export const AreaTypeSchema = z.enum([
	"LOBBY",
	"CORRIDOR",
	"ATRIUM",
	"COURTYARD",
	"ROOFTOP",
	"BASEMENT",
	"MEZZANINE",
	"TERRACE",
	"GARDEN",
	"PARKING_LEVEL",
	"STORAGE",
	"MECHANICAL",
	"SERVICE",
	"OTHER",
]);

export const ZoneTypeSchema = z.enum([
	"RESIDENTIAL",
	"COMMERCIAL",
	"RECREATIONAL",
	"ADMINISTRATIVE",
	"SERVICE",
	"RESTRICTED",
	"PUBLIC",
	"PRIVATE",
	"VIP",
	"OTHER",
]);

// ============================================================================
// METADATA SCHEMAS - Based on LocationType
// ============================================================================

// BUILDING Metadata
export const BuildingMetadataSchema = z.object({
	buildingType: BuildingTypeSchema,
	totalFloors: z.number().int().min(1, "Total floors must be at least 1"),
	basementLevels: z.number().int().min(0).optional(),
	hasElevator: z.boolean().optional().default(false),
	elevatorCount: z.number().int().min(0).optional(),
	totalArea: z.number().min(0).optional(), // in square meters
	hasParkingFacility: z.boolean().optional().default(false),
	parkingSpots: z.number().int().min(0).optional(),
	accessibility: z.array(z.string()).optional().default([]), // e.g., ["wheelchair", "ramp", "elevator"]
	yearBuilt: z.number().int().min(1800).max(2100).optional(),
	renovationYear: z.number().int().min(1800).max(2100).optional(),
});

// FLOOR Metadata
export const FloorMetadataSchema = z.object({
	floorNumber: z.number().int(),
	floorLabel: z.string().optional(), // e.g., "2nd Floor - Tennis Courts", "Ground Floor", "Mezzanine"
	totalArea: z.number().min(0).optional(),
	ceilingHeight: z.number().min(0).optional(), // in meters
	hasRestrooms: z.boolean().optional().default(false),
	hasEmergencyExit: z.boolean().optional().default(false),
	zoneType: ZoneTypeSchema.optional(),
	capacity: z.number().int().min(0).optional(), // people capacity
	unitCount: z.number().int().min(0).optional(), // number of rooms/units on this floor
});

// WING Metadata
export const WingMetadataSchema = z.object({
	wingIdentifier: z.string(), // e.g., "North Wing", "East Wing", "A-Wing"
	floorNumbers: z.array(z.number().int()).optional(), // floors spanned by this wing
	totalFloors: z.number().int().min(1).optional(),
	zoneType: ZoneTypeSchema.optional(),
	capacity: z.number().int().min(0).optional(),
	unitCount: z.number().int().min(0).optional(),
	hasElevator: z.boolean().optional(),
	accessibility: z.array(z.string()).optional().default([]),
});

// AREA Metadata
export const AreaMetadataSchema = z.object({
	areaType: AreaTypeSchema,
	totalArea: z.number().min(0).optional(),
	capacity: z.number().int().min(0).optional(),
	isPublicArea: z.boolean().optional().default(false),
	hasClimate: z.boolean().optional().default(false), // climate controlled
	seatingCapacity: z.number().int().min(0).optional(),
	operatingHours: z.string().optional(), // e.g., "24/7", "9:00 AM - 5:00 PM"
	requiresAccess: z.boolean().optional().default(false), // requires key/card access
	accessibility: z.array(z.string()).optional().default([]),
});

// ZONE Metadata
export const ZoneMetadataSchema = z.object({
	zoneType: ZoneTypeSchema,
	securityLevel: z.string().optional(), // e.g., "PUBLIC", "RESTRICTED", "HIGH_SECURITY"
	requiresAccess: z.boolean().optional().default(false),
	allowedActivities: z.array(z.string()).optional().default([]),
	operatingHours: z.string().optional(),
	capacity: z.number().int().min(0).optional(),
	unitCount: z.number().int().min(0).optional(),
	hasSupervision: z.boolean().optional().default(false),
});

// SECTION Metadata
export const SectionMetadataSchema = z.object({
	sectionIdentifier: z.string(), // e.g., "Section A", "Block 1"
	unitCount: z.number().int().min(0).optional(),
	capacity: z.number().int().min(0).optional(),
	purpose: z.string().optional(), // e.g., "Guest Parking", "Residential Units"
	zoneType: ZoneTypeSchema.optional(),
	requiresAccess: z.boolean().optional().default(false),
});

// BLOCK Metadata
export const BlockMetadataSchema = z.object({
	blockIdentifier: z.string(), // e.g., "Block A", "Building Block 1"
	totalFloors: z.number().int().min(1).optional(),
	unitCount: z.number().int().min(0).optional(),
	capacity: z.number().int().min(0).optional(),
	zoneType: ZoneTypeSchema.optional(),
	hasElevator: z.boolean().optional(),
	accessibility: z.array(z.string()).optional().default([]),
});

// OUTDOOR Metadata
export const OutdoorMetadataSchema = z.object({
	outdoorType: z.string(), // e.g., "Garden", "Terrace", "Plaza", "Parking Lot"
	totalArea: z.number().min(0).optional(),
	hasSeating: z.boolean().optional().default(false),
	hasLighting: z.boolean().optional().default(false),
	hasShade: z.boolean().optional().default(false),
	surfaceType: z.string().optional(), // e.g., "Grass", "Concrete", "Pavement", "Gravel"
	weatherDependent: z.boolean().optional().default(true),
	capacity: z.number().int().min(0).optional(),
	operatingHours: z.string().optional(),
	requiresAccess: z.boolean().optional().default(false),
});

// OTHER Metadata
export const OtherMetadataSchema = z.object({
	customType: z.string(),
	description: z.string().optional(),
	features: z.array(z.string()).optional().default([]),
	capacity: z.number().int().min(0).optional(),
	requiresAccess: z.boolean().optional().default(false),
	operatingHours: z.string().optional(),
});

// ============================================================================
// METADATA FIELD REQUIREMENTS HELPER
// ============================================================================

/**
 * Returns the required and optional fields for a given locationType
 */
export function getMetadataRequirements(locationType: string): {
	required: string[];
	optional: string[];
	schema: string;
	example: Record<string, any>;
} {
	const requirements = {
		BUILDING: {
			required: ["buildingType", "totalFloors"],
			optional: [
				"basementLevels",
				"hasElevator",
				"elevatorCount",
				"totalArea",
				"hasParkingFacility",
				"parkingSpots",
				"accessibility",
				"yearBuilt",
				"renovationYear",
			],
			schema: "BuildingMetadata",
			example: {
				buildingType: "MAIN",
				totalFloors: 10,
				basementLevels: 2,
				hasElevator: true,
				elevatorCount: 3,
				totalArea: 50000,
				hasParkingFacility: true,
				parkingSpots: 200,
			},
		},
		FLOOR: {
			required: ["floorNumber"],
			optional: [
				"floorLabel",
				"totalArea",
				"ceilingHeight",
				"hasRestrooms",
				"hasEmergencyExit",
				"zoneType",
				"capacity",
				"unitCount",
			],
			schema: "FloorMetadata",
			example: {
				floorNumber: 2,
				floorLabel: "2nd Floor - Guest Rooms",
				totalArea: 2000,
				hasRestrooms: true,
				zoneType: "RESIDENTIAL",
				capacity: 100,
			},
		},
		WING: {
			required: ["wingIdentifier"],
			optional: [
				"floorNumbers",
				"totalFloors",
				"zoneType",
				"capacity",
				"unitCount",
				"hasElevator",
				"accessibility",
			],
			schema: "WingMetadata",
			example: {
				wingIdentifier: "North Wing",
				floorNumbers: [1, 2, 3, 4, 5],
				totalFloors: 5,
				zoneType: "RESIDENTIAL",
				capacity: 200,
			},
		},
		AREA: {
			required: ["areaType"],
			optional: [
				"totalArea",
				"capacity",
				"isPublicArea",
				"hasClimate",
				"seatingCapacity",
				"operatingHours",
				"requiresAccess",
				"accessibility",
			],
			schema: "AreaMetadata",
			example: {
				areaType: "LOBBY",
				totalArea: 500,
				capacity: 100,
				isPublicArea: true,
				hasClimate: true,
			},
		},
		ZONE: {
			required: ["zoneType"],
			optional: [
				"securityLevel",
				"requiresAccess",
				"allowedActivities",
				"operatingHours",
				"capacity",
				"unitCount",
				"hasSupervision",
			],
			schema: "ZoneMetadata",
			example: {
				zoneType: "RECREATIONAL",
				securityLevel: "PUBLIC",
				requiresAccess: false,
				operatingHours: "6:00 AM - 10:00 PM",
				capacity: 150,
			},
		},
		SECTION: {
			required: ["sectionIdentifier"],
			optional: ["unitCount", "capacity", "purpose", "zoneType", "requiresAccess"],
			schema: "SectionMetadata",
			example: {
				sectionIdentifier: "Section A",
				unitCount: 25,
				capacity: 100,
				purpose: "Guest Parking",
			},
		},
		BLOCK: {
			required: ["blockIdentifier"],
			optional: [
				"totalFloors",
				"unitCount",
				"capacity",
				"zoneType",
				"hasElevator",
				"accessibility",
			],
			schema: "BlockMetadata",
			example: {
				blockIdentifier: "Block 1",
				totalFloors: 8,
				unitCount: 40,
				capacity: 160,
			},
		},
		OUTDOOR: {
			required: ["outdoorType"],
			optional: [
				"totalArea",
				"hasSeating",
				"hasLighting",
				"hasShade",
				"surfaceType",
				"weatherDependent",
				"capacity",
				"operatingHours",
				"requiresAccess",
			],
			schema: "OutdoorMetadata",
			example: {
				outdoorType: "Garden",
				totalArea: 5000,
				hasSeating: true,
				hasLighting: true,
				weatherDependent: true,
			},
		},
		OTHER: {
			required: ["customType"],
			optional: ["description", "features", "capacity", "requiresAccess", "operatingHours"],
			schema: "OtherMetadata",
			example: {
				customType: "Custom Location Type",
				description: "Special purpose location",
				features: ["Feature 1", "Feature 2"],
			},
		},
	} as any;

	return requirements[locationType] || requirements.OTHER;
}

// ============================================================================
// PREPROCESSING & MAIN SCHEMAS
// ============================================================================

const preprocessLocationData = z.preprocess(
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
		const arrayFields = ["imageUrl"];
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

		// Handle numeric fields
		const numericFields = ["latitude", "longitude"];
		for (const field of numericFields) {
			if (processed[field] !== undefined && typeof processed[field] === "string") {
				const parsed = parseFloat(processed[field]);
				if (!isNaN(parsed)) {
					processed[field] = parsed;
				}
			}
		}

		// Handle boolean fields
		const booleanFields = ["isActive", "isParentLocation"];
		for (const field of booleanFields) {
			if (processed[field] !== undefined && typeof processed[field] === "string") {
				processed[field] =
					processed[field].toLowerCase() === "true" ||
					processed[field].toLowerCase() === "yes" ||
					processed[field] === "1";
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
			locationType: LocationTypeSchema,
			parentLocationId: ObjectIdSchema.optional(),
			organizationId: ObjectIdSchema,
			metadata: z.union([z.string(), z.record(z.any())]).optional(),
			// Address fields (primarily for BUILDING)
			address: z.string().optional(),
			city: z.string().optional(),
			state: z.string().optional(),
			country: z.string().length(2, "Country must be ISO 3166-1 alpha-2 code").optional(), // e.g., "US", "GB"
			postalCode: z.string().optional(),
			// Geolocation
			latitude: z.number().min(-90).max(90).optional(),
			longitude: z.number().min(-180).max(180).optional(),
			// Timezone
			timezone: z.string().default("UTC"),
			imageUrl: z.array(z.string().url("Invalid image URL")).optional().default([]),
			path: z.string().optional(),
			isActive: z.boolean().optional().default(true),
			isParentLocation: z.boolean().optional().default(false),
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
			const requirements = getMetadataRequirements(data.locationType);

			// Validate metadata based on locationType
			try {
				console.log("🔍 Validating metadata for locationType:", data.locationType);
				console.log("🔍 Metadata to validate:", JSON.stringify(metadata, null, 2));

				// Validate based on locationType
				if (data.locationType === "BUILDING") {
					BuildingMetadataSchema.parse(metadata);
				} else if (data.locationType === "FLOOR") {
					FloorMetadataSchema.parse(metadata);
				} else if (data.locationType === "WING") {
					WingMetadataSchema.parse(metadata);
				} else if (data.locationType === "AREA") {
					AreaMetadataSchema.parse(metadata);
				} else if (data.locationType === "ZONE") {
					ZoneMetadataSchema.parse(metadata);
				} else if (data.locationType === "SECTION") {
					SectionMetadataSchema.parse(metadata);
				} else if (data.locationType === "BLOCK") {
					BlockMetadataSchema.parse(metadata);
				} else if (data.locationType === "OUTDOOR") {
					OutdoorMetadataSchema.parse(metadata);
				} else if (data.locationType === "OTHER") {
					OtherMetadataSchema.parse(metadata);
				}

				console.log("✅ Metadata validation passed!");
			} catch (error: any) {
				console.error("❌ Metadata validation failed:", error);
				console.error("📄 Failed with locationType:", data.locationType);
				console.error("📄 Failed with metadata:", JSON.stringify(metadata, null, 2));

				// Build detailed error message
				let message = `Metadata validation failed for locationType="${data.locationType}". `;
				message += `Required fields: ${
					requirements.required.length > 0 ? requirements.required.join(", ") : "None"
				}. `;
				message += `Optional fields: ${
					requirements.optional.length > 0 ? requirements.optional.join(", ") : "None"
				}. `;
				message += `Example: ${JSON.stringify(requirements.example)}`;

				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message,
					path: ["metadata"],
					params: {
						locationType: data.locationType,
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

export const CreateLocationSchema = preprocessLocationData;

export const UpdateLocationSchema = z.preprocess(
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

		// Handle numeric fields
		const numericFields = ["latitude", "longitude"];
		for (const field of numericFields) {
			if (processed[field] !== undefined && typeof processed[field] === "string") {
				const parsed = parseFloat(processed[field]);
				if (!isNaN(parsed)) {
					processed[field] = parsed;
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
			locationType: LocationTypeSchema.optional(),
			parentLocationId: ObjectIdSchema.optional(),
			organizationId: ObjectIdSchema.optional(),
			metadata: z.union([z.string(), z.record(z.any())]).optional(),
			address: z.string().optional(),
			city: z.string().optional(),
			state: z.string().optional(),
			country: z.string().length(2, "Country must be ISO 3166-1 alpha-2 code").optional(),
			postalCode: z.string().optional(),
			latitude: z.number().min(-90).max(90).optional(),
			longitude: z.number().min(-180).max(180).optional(),
			timezone: z.string().optional(),
			imageUrl: z.array(z.string().url("Invalid image URL")).optional(),
			path: z.string().optional(),
			isActive: z.boolean().optional(),
			isParentLocation: z.boolean().optional(),
		})
		.partial(),
);

export const LocationResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	code: z.string().optional(),
	description: z.string().optional(),
	locationType: LocationTypeSchema,
	parentLocationId: z.string().optional(),
	organizationId: z.string(),
	metadata: z.record(z.any()).nullable(),
	address: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	country: z.string().optional(),
	postalCode: z.string().optional(),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
	timezone: z.string(),
	imageUrl: z.array(z.string()),
	path: z.string().optional(),
	isActive: z.boolean(),
	isParentLocation: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const LocationQuerySchema = z.object({
	organizationId: ObjectIdSchema.optional(),
	locationType: LocationTypeSchema.optional(),
	parentLocationId: ObjectIdSchema.optional(),
	city: z.string().optional(),
	country: z.string().optional(),
	isActive: z.boolean().optional(),
});

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type LocationType = z.infer<typeof LocationTypeSchema>;
export type BuildingType = z.infer<typeof BuildingTypeSchema>;
export type AreaType = z.infer<typeof AreaTypeSchema>;
export type ZoneType = z.infer<typeof ZoneTypeSchema>;

// Metadata types
export type BuildingMetadata = z.infer<typeof BuildingMetadataSchema>;
export type FloorMetadata = z.infer<typeof FloorMetadataSchema>;
export type WingMetadata = z.infer<typeof WingMetadataSchema>;
export type AreaMetadata = z.infer<typeof AreaMetadataSchema>;
export type ZoneMetadata = z.infer<typeof ZoneMetadataSchema>;
export type SectionMetadata = z.infer<typeof SectionMetadataSchema>;
export type BlockMetadata = z.infer<typeof BlockMetadataSchema>;
export type OutdoorMetadata = z.infer<typeof OutdoorMetadataSchema>;
export type OtherMetadata = z.infer<typeof OtherMetadataSchema>;

// Schema types
export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;
export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>;
export type LocationResponse = z.infer<typeof LocationResponseSchema>;
export type LocationQuery = z.infer<typeof LocationQuerySchema>;
