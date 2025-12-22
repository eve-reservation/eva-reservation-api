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
		},
		{
			id: "507f1f77bcf86cd799439012",
			name: "Deluxe Room - King",
			description: "Spacious deluxe room with king bed and premium amenities",
			spaceType: "ROOM",
			subtype: "GUEST_ROOM",
			organizationId: defaultOrgId,
		},
		{
			id: "507f1f77bcf86cd799439013",
			name: "Family Suite",
			description: "Large family suite with multiple rooms",
			spaceType: "ROOM",
			subtype: "SUITE",
			organizationId: defaultOrgId,
		},

		// ROOM - Conference Rooms
		{
			id: "507f1f77bcf86cd799439014",
			name: "Small Meeting Room",
			description: "Compact meeting room ideal for small teams",
			spaceType: "ROOM",
			subtype: "CONFERENCE_ROOM",
			organizationId: defaultOrgId,
		},
		{
			id: "507f1f77bcf86cd799439015",
			name: "Executive Boardroom",
			description: "Premium boardroom for executive meetings",
			spaceType: "ROOM",
			subtype: "CONFERENCE_ROOM",
			organizationId: defaultOrgId,
		},

		// ROOM - Office
		{
			id: "507f1f77bcf86cd799439016",
			name: "Private Office",
			description: "Private office space with desk and storage",
			spaceType: "ROOM",
			subtype: "OFFICE",
			organizationId: defaultOrgId,
		},

		// COURT - Tennis Courts
		{
			id: "507f1f77bcf86cd799439017",
			name: "Indoor Tennis Court A",
			description: "Professional indoor tennis court with climate control",
			spaceType: "COURT",
			subtype: "TENNIS",
			organizationId: defaultOrgId,
		},
		{
			id: "507f1f77bcf86cd799439018",
			name: "Outdoor Clay Court",
			description: "Outdoor clay tennis court",
			spaceType: "COURT",
			subtype: "TENNIS",
			organizationId: defaultOrgId,
		},

		// COURT - Basketball
		{
			id: "507f1f77bcf86cd799439019",
			name: "Basketball Court",
			description: "Full-size indoor basketball court",
			spaceType: "COURT",
			subtype: "BASKETBALL",
			organizationId: defaultOrgId,
		},

		// DINING - Fine Dining
		{
			id: "507f1f77bcf86cd799439020",
			name: "Coastal Fine Dining",
			description: "Upscale fine dining restaurant with ocean views",
			spaceType: "DINING",
			subtype: "FINE_DINING",
			organizationId: defaultOrgId,
		},

		// DINING - Casual
		{
			id: "507f1f77bcf86cd799439021",
			name: "Garden Café",
			description: "Casual café with indoor and outdoor seating",
			spaceType: "DINING",
			subtype: "CAFE",
			organizationId: defaultOrgId,
		},

		// FITNESS - Gym
		{
			id: "507f1f77bcf86cd799439022",
			name: "Main Fitness Center",
			description: "Fully equipped fitness center with cardio and weights",
			spaceType: "FITNESS",
			subtype: "WEIGHT_ROOM",
			organizationId: defaultOrgId,
		},
		{
			id: "507f1f77bcf86cd799439023",
			name: "Yoga Studio",
			description: "Peaceful yoga studio with natural light",
			spaceType: "FITNESS",
			subtype: "YOGA_STUDIO",
			organizationId: defaultOrgId,
		},

		// PARKING
		{
			id: "507f1f77bcf86cd799439024",
			name: "Underground Parking Garage",
			description: "Secure underground parking with EV charging",
			spaceType: "PARKING",
			subtype: "GARAGE",
			organizationId: defaultOrgId,
		},
		{
			id: "507f1f77bcf86cd799439025",
			name: "Valet Parking Service",
			description: "Premium valet parking service",
			spaceType: "PARKING",
			subtype: "VALET",
			organizationId: defaultOrgId,
		},

		// AMENITY - Pool
		{
			id: "507f1f77bcf86cd799439026",
			name: "Rooftop Infinity Pool",
			description: "Heated infinity pool with panoramic city views",
			spaceType: "AMENITY",
			subtype: "SWIMMING_POOL",
			organizationId: defaultOrgId,
		},
		{
			id: "507f1f77bcf86cd799439027",
			name: "Luxury Spa",
			description: "Full-service spa with massage and wellness treatments",
			spaceType: "AMENITY",
			subtype: "SPA",
			organizationId: defaultOrgId,
		},

		// OUTDOOR
		{
			id: "507f1f77bcf86cd799439028",
			name: "Garden Terrace",
			description: "Beautiful outdoor terrace with garden views",
			spaceType: "OUTDOOR",
			organizationId: defaultOrgId,
		},

		// OTHER
		{
			id: "507f1f77bcf86cd799439029",
			name: "Pet Spa & Grooming",
			description: "Professional pet grooming and spa services",
			spaceType: "OTHER",
			organizationId: defaultOrgId,
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
