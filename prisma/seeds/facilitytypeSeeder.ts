import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

export async function seedFacilityType() {
	console.log("🌱 Starting facilityType seeding...");

	// Default organization ID for seeding (you may want to change this)
	const defaultOrgId = "507f1f77bcf86cd799439010";

	const facilityTypeData = [
		// ROOM - Guest Rooms
		{
			id: "507f1f77bcf86cd799439011",
			name: "Standard Room - Single",
			description: "Cozy single room with essential amenities",
			spaceType: "ROOM",
			subtype: "GUEST_ROOM",
			organizationId: defaultOrgId,
			metadata: {
				bedType: "SINGLE_BED",
				bedCount: 1,
				maxOccupancy: 1,
				roomFeatures: ["WIFI", "AIR_CONDITIONING", "TELEVISION", "PRIVATE_BATHROOM"],
				amenities: ["ROOM_SERVICE", "HOUSEKEEPING"],
				roomSize: 20,
			},
			imageUrl: [],
		},
		{
			id: "507f1f77bcf86cd799439012",
			name: "Deluxe Room - King",
			description: "Spacious deluxe room with king bed and premium amenities",
			spaceType: "ROOM",
			subtype: "GUEST_ROOM",
			organizationId: defaultOrgId,
			metadata: {
				bedType: "KING_BED",
				bedCount: 1,
				maxOccupancy: 2,
				roomFeatures: [
					"WIFI",
					"AIR_CONDITIONING",
					"TELEVISION",
					"MINIBAR",
					"SAFE",
					"BALCONY",
					"OCEAN_VIEW",
				],
				amenities: ["ROOM_SERVICE", "CONCIERGE_SERVICE", "LAUNDRY_SERVICE"],
				roomSize: 45,
				hasBalcony: true,
			},
			imageUrl: [],
		},
		{
			id: "507f1f77bcf86cd799439013",
			name: "Family Suite",
			description: "Large family suite with multiple rooms",
			spaceType: "ROOM",
			subtype: "SUITE",
			organizationId: defaultOrgId,
			metadata: {
				bedType: "QUEEN_BED",
				bedCount: 2,
				maxOccupancy: 5,
				numberOfRooms: 2,
				roomFeatures: [
					"WIFI",
					"AIR_CONDITIONING",
					"TELEVISION",
					"KITCHEN",
					"DINING_AREA",
					"CITY_VIEW",
				],
				amenities: ["ROOM_SERVICE", "CONCIERGE_SERVICE"],
				roomSize: 80,
				hasLivingRoom: true,
				hasKitchen: true,
				hasDiningArea: true,
			},
			imageUrl: [],
		},

		// ROOM - Conference Rooms
		{
			id: "507f1f77bcf86cd799439014",
			name: "Small Meeting Room",
			description: "Compact meeting room ideal for small teams",
			spaceType: "ROOM",
			subtype: "CONFERENCE_ROOM",
			organizationId: defaultOrgId,
			metadata: {
				seatingCapacity: 8,
				hasProjector: true,
				hasWhiteboard: true,
				hasVideoConferencing: true,
				hasAudioSystem: true,
				layout: "U-Shape",
				equipment: ["Screen", "Whiteboard", "Conference Phone"],
				roomSize: 25,
				hasNaturalLight: true,
			},
			imageUrl: [],
		},
		{
			id: "507f1f77bcf86cd799439015",
			name: "Executive Boardroom",
			description: "Premium boardroom for executive meetings",
			spaceType: "ROOM",
			subtype: "CONFERENCE_ROOM",
			organizationId: defaultOrgId,
			metadata: {
				seatingCapacity: 20,
				hasProjector: true,
				hasWhiteboard: true,
				hasVideoConferencing: true,
				hasAudioSystem: true,
				layout: "Boardroom",
				equipment: ["4K Display", "Video Conferencing System", "Wireless Presentation"],
				roomSize: 50,
				hasNaturalLight: true,
			},
			imageUrl: [],
		},

		// ROOM - Office
		{
			id: "507f1f77bcf86cd799439016",
			name: "Private Office",
			description: "Private office space with desk and storage",
			spaceType: "ROOM",
			subtype: "OFFICE",
			organizationId: defaultOrgId,
			metadata: {
				capacity: 1,
				hasDesk: true,
				hasChair: true,
				hasComputer: false,
				hasPhone: true,
				equipment: ["Desk", "Chair", "Storage Cabinet"],
				roomSize: 15,
				isPrivate: true,
			},
			imageUrl: [],
		},

		// COURT - Tennis Courts
		{
			id: "507f1f77bcf86cd799439017",
			name: "Indoor Tennis Court A",
			description: "Professional indoor tennis court with climate control",
			spaceType: "COURT",
			subtype: "TENNIS",
			organizationId: defaultOrgId,
			metadata: {
				sportType: "Tennis",
				surfaceType: "Hardcourt",
				isIndoor: true,
				hasLighting: true,
				maxPlayers: 4,
				equipmentProvided: ["Balls", "Net"],
				openingHours: "6:00 AM - 11:00 PM",
				courtSize: "Standard",
			},
			imageUrl: [],
		},
		{
			id: "507f1f77bcf86cd799439018",
			name: "Outdoor Clay Court",
			description: "Outdoor clay tennis court",
			spaceType: "COURT",
			subtype: "TENNIS",
			organizationId: defaultOrgId,
			metadata: {
				sportType: "Tennis",
				surfaceType: "Clay",
				isIndoor: false,
				hasLighting: true,
				maxPlayers: 4,
				equipmentProvided: ["Net"],
				openingHours: "6:00 AM - 9:00 PM",
				courtSize: "Standard",
			},
			imageUrl: [],
		},

		// COURT - Basketball
		{
			id: "507f1f77bcf86cd799439019",
			name: "Basketball Court",
			description: "Full-size indoor basketball court",
			spaceType: "COURT",
			subtype: "BASKETBALL",
			organizationId: defaultOrgId,
			metadata: {
				sportType: "Basketball",
				surfaceType: "Wooden",
				isIndoor: true,
				hasLighting: true,
				maxPlayers: 10,
				equipmentProvided: ["Basketballs", "Scoreboard"],
				openingHours: "6:00 AM - 11:00 PM",
				courtSize: "Full",
			},
			imageUrl: [],
		},

		// DINING - Fine Dining
		{
			id: "507f1f77bcf86cd799439020",
			name: "Coastal Fine Dining",
			description: "Upscale fine dining restaurant with ocean views",
			spaceType: "DINING",
			subtype: "FINE_DINING",
			organizationId: defaultOrgId,
			metadata: {
				cuisineType: "Mediterranean",
				seatingCapacity: 80,
				hasDelivery: false,
				hasTakeout: false,
				openingHours: "6:00 PM - 11:00 PM",
				menuUrl: "https://example.com/menu",
				avgMealPrice: 75.0,
				dressCode: "Smart Casual",
				hasOutdoorSeating: true,
				hasPrivateDining: true,
			},
			imageUrl: [],
		},

		// DINING - Casual
		{
			id: "507f1f77bcf86cd799439021",
			name: "Garden Café",
			description: "Casual café with indoor and outdoor seating",
			spaceType: "DINING",
			subtype: "CAFE",
			organizationId: defaultOrgId,
			metadata: {
				cuisineType: "International",
				seatingCapacity: 40,
				hasDelivery: true,
				hasTakeout: true,
				openingHours: "7:00 AM - 10:00 PM",
				menuUrl: "https://example.com/cafe-menu",
				avgMealPrice: 20.0,
				hasOutdoorSeating: true,
				hasPrivateDining: false,
			},
			imageUrl: [],
		},

		// FITNESS - Gym
		{
			id: "507f1f77bcf86cd799439022",
			name: "Main Fitness Center",
			description: "Fully equipped fitness center with cardio and weights",
			spaceType: "FITNESS",
			subtype: "WEIGHT_ROOM",
			organizationId: defaultOrgId,
			metadata: {
				equipment: [
					"Treadmills",
					"Ellipticals",
					"Dumbbells",
					"Barbells",
					"Bench Press",
					"Squat Rack",
				],
				hasTrainer: true,
				hasLockers: true,
				hasShowers: true,
				openingHours: "5:00 AM - 11:00 PM",
				capacity: 40,
				specialtyArea: "Weights & Cardio",
				classesOffered: ["Strength Training", "Personal Training"],
			},
			imageUrl: [],
		},
		{
			id: "507f1f77bcf86cd799439023",
			name: "Yoga Studio",
			description: "Peaceful yoga studio with natural light",
			spaceType: "FITNESS",
			subtype: "YOGA_STUDIO",
			organizationId: defaultOrgId,
			metadata: {
				equipment: ["Yoga Mats", "Blocks", "Straps", "Bolsters"],
				hasTrainer: true,
				hasLockers: true,
				hasShowers: true,
				openingHours: "6:00 AM - 9:00 PM",
				capacity: 20,
				specialtyArea: "Yoga & Meditation",
				classesOffered: ["Hatha Yoga", "Vinyasa Flow", "Meditation"],
			},
			imageUrl: [],
		},

		// PARKING
		{
			id: "507f1f77bcf86cd799439024",
			name: "Underground Parking Garage",
			description: "Secure underground parking with EV charging",
			spaceType: "PARKING",
			subtype: "GARAGE",
			organizationId: defaultOrgId,
			metadata: {
				vehicleType: "Car",
				isUnderground: true,
				isCovered: true,
				hasElectricCharging: true,
				chargingType: "Level 2",
				maxVehicleHeight: 2.1,
				maxVehicleWidth: 2.5,
				securityLevel: "Gated",
				hasCCTV: true,
				isAccessControlled: true,
			},
			imageUrl: [],
		},
		{
			id: "507f1f77bcf86cd799439025",
			name: "Valet Parking Service",
			description: "Premium valet parking service",
			spaceType: "PARKING",
			subtype: "VALET",
			organizationId: defaultOrgId,
			metadata: {
				vehicleType: "Car",
				isUnderground: false,
				isCovered: false,
				hasElectricCharging: false,
				securityLevel: "Monitored",
				hasCCTV: true,
				isAccessControlled: true,
			},
			imageUrl: [],
		},

		// AMENITY - Pool
		{
			id: "507f1f77bcf86cd799439026",
			name: "Rooftop Infinity Pool",
			description: "Heated infinity pool with panoramic city views",
			spaceType: "AMENITY",
			subtype: "SWIMMING_POOL",
			organizationId: defaultOrgId,
			metadata: {
				amenityType: "Swimming Pool",
				capacity: 50,
				requiresReservation: false,
				openingHours: "6:00 AM - 10:00 PM",
				ageRestriction: "All Ages",
				additionalFees: 0,
				equipment: ["Lounge Chairs", "Umbrellas", "Towels"],
				features: ["Heated", "Infinity Edge", "Bar Service", "Cabanas"],
				hasSupervision: true,
			},
			imageUrl: [],
		},
		{
			id: "507f1f77bcf86cd799439027",
			name: "Luxury Spa",
			description: "Full-service spa with massage and wellness treatments",
			spaceType: "AMENITY",
			subtype: "SPA",
			organizationId: defaultOrgId,
			metadata: {
				amenityType: "Spa",
				capacity: 10,
				requiresReservation: true,
				openingHours: "9:00 AM - 9:00 PM",
				ageRestriction: "Adults Only",
				additionalFees: 50.0,
				equipment: ["Massage Tables", "Sauna", "Steam Room"],
				features: ["Massage Services", "Facial Treatments", "Body Treatments"],
				hasSupervision: true,
			},
			imageUrl: [],
		},

		// OUTDOOR
		{
			id: "507f1f77bcf86cd799439028",
			name: "Garden Terrace",
			description: "Beautiful outdoor terrace with garden views",
			spaceType: "OUTDOOR",
			organizationId: defaultOrgId,
			metadata: {
				outdoorType: "Terrace",
				capacity: 40,
				area: 150,
				hasSeating: true,
				hasShade: true,
				hasLighting: true,
				features: ["Fire Pit", "Water Feature", "BBQ Area", "Outdoor Kitchen"],
				requiresReservation: true,
				openingHours: "Sunrise to Sunset",
			},
			imageUrl: [],
		},

		// OTHER
		{
			id: "507f1f77bcf86cd799439029",
			name: "Pet Spa & Grooming",
			description: "Professional pet grooming and spa services",
			spaceType: "OTHER",
			organizationId: defaultOrgId,
			metadata: {
				customType: "Pet Grooming & Spa",
				description: "Full-service pet grooming and spa facility",
				features: ["Bathing", "Grooming", "Nail Trimming", "Massage"],
				requirements: ["Pet Vaccination Records"],
				capacity: 6,
				openingHours: "9:00 AM - 6:00 PM",
			},
			imageUrl: [],
		},
	];

	try {
		// Clear existing facilityTypes (optional - remove if you want to keep existing data)
		console.log("🗑️  Clearing existing facilityTypes...");
		await prisma.facilityType.deleteMany({});

		// Create facilityTypes
		console.log("📝 Creating facilityType records...");
		for (const facilityType of facilityTypeData) {
			await prisma.facilityType.create({
				data: facilityType,
			});
		}

		console.log(`✅ Successfully created ${facilityTypeData.length} facilityType records`);

		// Display summary by spaceType
		const roomCount = facilityTypeData.filter((t) => t.spaceType === "ROOM").length;
		const courtCount = facilityTypeData.filter((t) => t.spaceType === "COURT").length;
		const diningCount = facilityTypeData.filter((t) => t.spaceType === "DINING").length;
		const fitnessCount = facilityTypeData.filter((t) => t.spaceType === "FITNESS").length;
		const parkingCount = facilityTypeData.filter((t) => t.spaceType === "PARKING").length;
		const amenityCount = facilityTypeData.filter((t) => t.spaceType === "AMENITY").length;
		const outdoorCount = facilityTypeData.filter((t) => t.spaceType === "OUTDOOR").length;
		const otherCount = facilityTypeData.filter((t) => t.spaceType === "OTHER").length;

		console.log("\n📊 FacilityType Summary by SpaceType:");
		console.log(`   🏨 ROOM: ${roomCount}`);
		console.log(`   🎾 COURT: ${courtCount}`);
		console.log(`   🍽️  DINING: ${diningCount}`);
		console.log(`   💪 FITNESS: ${fitnessCount}`);
		console.log(`   🚗 PARKING: ${parkingCount}`);
		console.log(`   ✨ AMENITY: ${amenityCount}`);
		console.log(`   🌳 OUTDOOR: ${outdoorCount}`);
		console.log(`   📦 OTHER: ${otherCount}`);
		console.log(`   📈 Total: ${facilityTypeData.length}`);

		console.log("\n🎉 FacilityType seeding completed successfully!");
	} catch (error) {
		console.error("❌ Error during facilityType seeding:", error);
		throw error;
	}
}
