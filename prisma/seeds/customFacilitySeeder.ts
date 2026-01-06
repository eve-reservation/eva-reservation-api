import {
	PrismaClient,
	SpaceType,
	CourtSubtype,
	AmenitySubtype,
	FitnessSubtype,
	RoomSubtype,
	DiningSubtype,
	FacilityStatus,
	FacilityImageType,
} from "../../generated/prisma";

const prisma = new PrismaClient();

export async function seedCustomFacilities() {
	console.log("🌱 Starting custom facility seeding...");

	// Default org
	const defaultOrgId = "507f1f77bcf86cd799439010";

	// Helper to generate mock image using LoremFlickr
	const getMockImage = (name: string, keywords: string) => {
		// Add a random lock to prevent browser caching if multiple images use same keywords
		const randomLock = Math.floor(Math.random() * 10000);
		return [
			{
				name: name,
				// loremflickr uses /width/height/keywords
				url: `https://loremflickr.com/800/600/${keywords}?lock=${randomLock}`,
				type: FacilityImageType.COVER,
			},
		];
	};

	// Data Structure
	type FacilitySeed = { identifier: string; displayName: string; metadata?: any; images?: any[] };
	type CategorySeed = {
		categoryName: string;
		types: {
			name: string;
			spaceType: any;
			subtype: any;
			facilities: FacilitySeed[];
		}[];
	};

	const categories: CategorySeed[] = [
		{
			categoryName: "Sports & Recreational Facilities",
			types: [
				{
					name: "Tennis Court",
					spaceType: SpaceType.COURT,
					subtype: CourtSubtype.TENNIS,
					facilities: [
						...Array.from({ length: 5 }, (_, i) => ({
							identifier: `TENNIS-IN-${i + 1}`,
							displayName: `Covered Tennis Court ${i + 1}`,
							metadata: {
								description: `Professional indoor tennis court ${i + 1} with high-quality surface.`,
								price: 300,
								priceUnit: "hour",
								maxOccupancy: 4,
								amenities: [
									"Lighting",
									"Benches",
									"Scoreboard",
									"Indoor Climate Control",
								],
							},
							images: getMockImage(
								`Covered Tennis Court ${i + 1}`,
								"tennis,court,indoor",
							),
						})),
						...Array.from({ length: 3 }, (_, i) => ({
							identifier: `TENNIS-OUT-${i + 1}`,
							displayName: `Open-air Tennis Court ${i + 1}`,
							metadata: {
								description: `Standard outdoor tennis court ${i + 1}.`,
								price: 200,
								priceUnit: "hour",
								maxOccupancy: 4,
								amenities: ["Benches", "Natural Lighting", "Perimeter Fencing"],
							},
							images: getMockImage(
								`Open-air Tennis Court ${i + 1}`,
								"tennis,court,outdoor",
							),
						})),
					],
				},
				{
					name: "Badminton Court",
					spaceType: SpaceType.COURT,
					subtype: CourtSubtype.BADMINTON,
					facilities: Array.from({ length: 7 }, (_, i) => ({
						identifier: `BADMINTON-${i + 1}`,
						displayName: `Badminton Court ${i + 1}`,
						metadata: {
							description: `Professional badminton court ${i + 1} with non-slip flooring.`,
							price: 150,
							priceUnit: "hour",
							maxOccupancy: 4,
							amenities: ["Lighting", "Net", "Benches"],
						},
						images: getMockImage(`Badminton Court ${i + 1}`, "badminton,court,sport"),
					})),
				},
				{
					name: "Swimming Pool",
					spaceType: SpaceType.AMENITY,
					subtype: AmenitySubtype.SWIMMING_POOL,
					facilities: [
						{
							identifier: "POOL-MAIN",
							displayName: "Competition Pool (25m)",
							metadata: {
								description: "25-meter lap pool for adults and competitions.",
								price: 200,
								priceUnit: "visit",
								maxOccupancy: 30,
								amenities: [
									"Lane Dividers",
									"Starting Blocks",
									"Showers",
									"Lifeguard Station",
								],
							},
							images: getMockImage("Competition Pool", "swimming,pool,competition"),
						},
						{
							identifier: "POOL-KID-1",
							displayName: "Kiddie Pool 1",
							metadata: {
								description: "Shallow pool designed for children.",
								price: 100,
								priceUnit: "visit",
								maxOccupancy: 15,
								amenities: ["Slides", "Mushroom Shower", "Lifeguard Station"],
							},
							images: getMockImage("Kiddie Pool 1", "pool,waterpark,mixed"),
						},
						{
							identifier: "POOL-KID-2",
							displayName: "Kiddie Pool 2",
							metadata: {
								description: "Safe and fun water play area for toddlers.",
								price: 100,
								priceUnit: "visit",
								maxOccupancy: 15,
								amenities: ["Fountains", "Shallow Water"],
							},
							images: getMockImage("Kiddie Pool 2", "pool,kids,fun"),
						},
					],
				},
				{
					name: "Bowling Alley",
					spaceType: SpaceType.AMENITY,
					subtype: AmenitySubtype.GAME_ROOM,
					facilities: Array.from({ length: 10 }, (_, i) => ({
						identifier: `BOWLING-${i + 1}`,
						displayName: `Bowling Lane ${i + 1}`,
						metadata: {
							description: "Professional ten-pin bowling lane.",
							price: 180,
							priceUnit: "game",
							maxOccupancy: 6,
							amenities: [
								"Shoe Rental",
								"Digital Scoring",
								"Seating Area",
								"Ball Return",
							],
						},
						images: getMockImage(`Bowling Lane ${i + 1}`, "bowling,alley,pins"),
					})),
				},
				{
					name: "Pickleball Court",
					spaceType: SpaceType.COURT,
					subtype: CourtSubtype.PICKLEBALL,
					facilities: Array.from({ length: 4 }, (_, i) => ({
						identifier: `PICKLEBALL-${i + 1}`,
						displayName: `Pickleball Court ${i + 1}`,
						metadata: {
							description: "Outdoor pickleball court.",
							price: 150,
							priceUnit: "hour",
							maxOccupancy: 4,
							amenities: ["Net", "Fencing"],
						},
						images: getMockImage(`Pickleball Court ${i + 1}`, "tennis,court,net"), // using tennis as proxy if pickleball specific is rare on loremflickr
					})),
				},
				{
					name: "Combat Sports Area",
					spaceType: SpaceType.FITNESS,
					subtype: "OTHER",
					facilities: [
						{
							identifier: "COMBAT-1",
							displayName: "Elorde Muay Thai and Boxing",
							metadata: {
								description: "Dedicated combat sports training area.",
								price: 350,
								priceUnit: "session",
								maxOccupancy: 20,
								amenities: [
									"Boxing Ring",
									"Punching Bags",
									"Speed Bags",
									"Floor Mats",
									"Gloves Rental",
								],
							},
							images: getMockImage("Elorde Muay Thai", "boxing,ring,gym"),
						},
					],
				},
				{
					name: "Basketball Court",
					spaceType: SpaceType.COURT,
					subtype: CourtSubtype.BASKETBALL,
					facilities: [
						{
							identifier: "BBALL-1",
							displayName: "Covered Basketball Court",
							metadata: {
								description: "Full-sized hardwood basketball court.",
								price: 500,
								priceUnit: "hour",
								maxOccupancy: 20,
								amenities: [
									"Glass Backboards",
									"Scoreboard",
									"Bleachers",
									"Lighting",
								],
							},
							images: getMockImage("Basketball Court", "basketball,court,indoor"),
						},
					],
				},
				{
					name: "Squash Court",
					spaceType: SpaceType.COURT,
					subtype: CourtSubtype.SQUASH,
					facilities: [
						{
							identifier: "SQUASH-1",
							displayName: "Squash Court 1",
							metadata: {
								description: "Standard squash court with glass back wall.",
								price: 250,
								priceUnit: "hour",
								maxOccupancy: 2,
								amenities: ["Glass Wall", "Wooden Floor"],
							},
							images: getMockImage("Squash Court 1", "squash,court"),
						},
						{
							identifier: "SQUASH-2",
							displayName: "Squash Court 2",
							metadata: {
								description: "Standard squash court.",
								price: 250,
								priceUnit: "hour",
								maxOccupancy: 2,
								amenities: ["Glass Wall", "Wooden Floor"],
							},
							images: getMockImage("Squash Court 2", "squash,court"),
						},
					],
				},
				{
					name: "Billiard Hall",
					spaceType: SpaceType.AMENITY,
					subtype: AmenitySubtype.GAME_ROOM,
					facilities: [
						{
							identifier: "BILLIARD-HALL",
							displayName: "Billiard Hall",
							metadata: {
								description: "Spacious hall with professional billiard tables.",
								price: 120,
								priceUnit: "hour",
								maxOccupancy: 20,
								amenities: [
									"Pool Tables",
									"Cues",
									"Chalk",
									"Lounge Seating",
									"Bar Access",
								],
							},
							images: getMockImage("Billiard Hall", "billiards,pooltable"),
						},
					],
				},
				{
					name: "Table Tennis Area",
					spaceType: SpaceType.AMENITY,
					subtype: AmenitySubtype.GAME_ROOM,
					facilities: [
						{
							identifier: "PINGPONG-AREA",
							displayName: "Table Tennis Area",
							metadata: {
								description: "Area dedicated to table tennis.",
								price: 100,
								priceUnit: "hour",
								maxOccupancy: 10,
								amenities: ["ITTF Tables", "Nets", "Paddles Rental"],
							},
							images: getMockImage("Table Tennis", "pingpong,tabletennis"),
						},
					],
				},
				{
					name: "Dance Studio",
					spaceType: SpaceType.FITNESS,
					subtype: FitnessSubtype.MULTIPURPOSE,
					facilities: [
						{
							identifier: "DANCE-STUDIO",
							displayName: "Dance Studio",
							metadata: {
								description: "Spacious studio with mirrors and sound system.",
								price: 600,
								priceUnit: "hour",
								maxOccupancy: 30,
								amenities: [
									"Wall-to-Wall Mirrors",
									"Sound System",
									"Floating Wood Floor",
									"Ballet Barres",
								],
							},
							images: getMockImage("Dance Studio", "dancestudio,ballet"),
						},
					],
				},
			],
		},
		{
			categoryName: "Wellness & Personal Care",
			types: [
				{
					name: "Fitness Center",
					spaceType: SpaceType.FITNESS,
					subtype: FitnessSubtype.WEIGHT_ROOM,
					facilities: [
						{
							identifier: "GYM-MAIN",
							displayName: "Main Gym",
							metadata: {
								description: "State-of-the-art fitness center.",
								price: 250,
								priceUnit: "visit",
								maxOccupancy: 50,
								amenities: [
									"Cardio Machines",
									"Free Weights",
									"Resistance Machines",
									"Personal Trainers",
								],
							},
							images: getMockImage("Main Gym", "gym,fitness,weights"),
						},
						{
							identifier: "SAUNA-MAIN",
							displayName: "Sauna",
							metadata: {
								description: "Relaxing dry sauna room.",
								price: 150,
								priceUnit: "session",
								maxOccupancy: 10,
								amenities: [
									"Towel Service",
									"Temperature Control",
									"Wooden Seating",
								],
							},
							images: getMockImage("Sauna", "sauna,spa"),
						},
					],
				},
				{
					name: "Massage & Therapy",
					spaceType: SpaceType.AMENITY,
					subtype: AmenitySubtype.SPA,
					facilities: [
						{
							identifier: "MASSAGE-ROOM",
							displayName: "Massage Room",
							metadata: {
								description: "Private massage therapy room.",
								price: 600,
								priceUnit: "session",
								maxOccupancy: 1,
								amenities: [
									"Massage Bed",
									"Aromatherapy",
									"Mood Lighting",
									"Towels",
								],
							},
							images: getMockImage("Massage Room", "massage,spa,relax"),
						},
						{
							identifier: "REFLEXOLOGY",
							displayName: "Reflexology Clinic",
							metadata: {
								description: "Clinic specializing in reflexology treatments.",
								price: 500,
								priceUnit: "session",
								maxOccupancy: 4,
								amenities: ["Reclining Chairs", "Foot Baths", "Therapists"],
							},
							images: getMockImage("Reflexology", "footmassage,spa"),
						},
					],
				},
				{
					name: "Personal Care",
					spaceType: SpaceType.AMENITY,
					subtype: "OTHER",
					facilities: [
						{
							identifier: "BARBER",
							displayName: "Barber Shop",
							metadata: {
								description: "Classic barber shop for men.",
								price: 0,
								priceUnit: "service",
								maxOccupancy: 3,
								amenities: ["Haircut", "Shave", "Grooming Products"],
							},
							images: getMockImage("Barber Shop", "barbershop,haircut"),
						},
						{
							identifier: "SALON",
							displayName: "Beauty Salon",
							metadata: {
								description: "Full-service beauty salon.",
								price: 0,
								priceUnit: "service",
								maxOccupancy: 5,
								amenities: [
									"Hair Styling",
									"Manicure/Pedicure",
									"Makeup",
									"Hair Coloring",
								],
							},
							images: getMockImage("Beauty Salon", "beautysalon,hair"),
						},
					],
				},
			],
		},
		{
			categoryName: "Dining & Events",
			types: [
				{
					name: "Event Hall",
					spaceType: SpaceType.ROOM,
					subtype: RoomSubtype.BALLROOM,
					facilities: [
						{
							identifier: "HALL-QUEZON",
							displayName: "Quezon Hall",
							metadata: {
								description: "Grand ballroom for large events and weddings.",
								price: 20000,
								priceUnit: "day",
								maxOccupancy: 500,
								amenities: [
									"Stage",
									"Sound System",
									"Lighting System",
									"Projector",
									"Air Conditioning",
									"Private Dressing Room",
								],
							},
							images: getMockImage("Quezon Hall", "ballroom,eventhall,wedding"),
						},
						{
							identifier: "HALL-PUGAD",
							displayName: "Pugad Lawin Hall",
							metadata: {
								description: "Medium-sized function hall.",
								price: 10000,
								priceUnit: "day",
								maxOccupancy: 200,
								amenities: [
									"Sound System",
									"Projector",
									"Podium",
									"Air Conditioning",
								],
							},
							images: getMockImage("Pugad Lawin Hall", "conferencehall,event"),
						},
						{
							identifier: "HALL-BAGUMBAYAN",
							displayName: "Bagumbayan Hall",
							metadata: {
								description: "Elegant hall for medium gatherings.",
								price: 8000,
								priceUnit: "day",
								maxOccupancy: 150,
								amenities: [
									"Audio-Visual Equipment",
									"Tables & Chairs",
									"Air Conditioning",
								],
							},
							images: getMockImage("Bagumbayan Hall", "banquethall,party"),
						},
					],
				},
				{
					name: "Function Room",
					spaceType: SpaceType.ROOM,
					subtype: RoomSubtype.CONFERENCE_ROOM,
					facilities: [
						{
							identifier: "FUNC-1",
							displayName: "Small Function Room 1",
							metadata: {
								description: "Intimate room for small meetings or gatherings.",
								price: 3000,
								priceUnit: "4 hours",
								maxOccupancy: 30,
								amenities: ["Whiteboard", "TV Screen", "Conference Table", "Wi-Fi"],
							},
							images: getMockImage("Function Room 1", "meetingroom,corporate"),
						},
						{
							identifier: "FUNC-2",
							displayName: "Small Function Room 2",
							metadata: {
								description: "Standard meeting room.",
								price: 3000,
								priceUnit: "4 hours",
								maxOccupancy: 30,
								amenities: ["Projector", "Screen", "Whiteboard", "Wi-Fi"],
							},
							images: getMockImage("Function Room 2", "conferenceroom,office"),
						},
					],
				},
				{
					name: "Dining Venue",
					spaceType: SpaceType.DINING,
					subtype: DiningSubtype.CASUAL_DINING,
					facilities: [
						{
							identifier: "DINE-BANQUET",
							displayName: "Main Banquet Hall",
							metadata: {
								description: "Spacious banquet hall for dining events.",
								price: 0,
								priceUnit: "order",
								maxOccupancy: 300,
								amenities: ["Buffet Setup", "Bar Area", "Stage"],
							},
							images: getMockImage("Banquet Hall", "restaurant,buffet"),
						},
						{
							identifier: "DINE-DAILY",
							displayName: "Daily Dining Room",
							metadata: {
								description: "Casual dining area for daily meals.",
								price: 0,
								priceUnit: "order",
								maxOccupancy: 100,
								amenities: ["A la Carte Menu", "High Chairs", "TVs"],
							},
							images: getMockImage("Daily Dining", "restaurant,dining,food"),
						},
						{
							identifier: "DINE-COFFEE",
							displayName: "Coffee Shop",
							metadata: {
								description: "Relaxed coffee shop serving brews and pastries.",
								price: 0,
								priceUnit: "order",
								maxOccupancy: 40,
								amenities: ["Free Wi-Fi", "Power Outlets", "Lounge Seating"],
							},
							images: getMockImage("Coffee Shop", "coffeeshop,cafe,latte"),
						},
						{
							identifier: "DINE-BAR",
							displayName: "Bar and Lounge",
							metadata: {
								description: "Evening lounge and bar with drinks and music.",
								price: 0,
								priceUnit: "order",
								maxOccupancy: 60,
								amenities: ["Full Bar", "Live Music Space", "TV Screens"],
							},
							images: getMockImage("Bar Lounge", "bar,cocktails,lounge"),
						},
						{
							identifier: "DINE-SHABU",
							displayName: "Shabu-shabu Restaurant",
							metadata: {
								description: "Specialty Shabu-shabu hotpot restaurant.",
								price: 0,
								priceUnit: "order",
								maxOccupancy: 50,
								amenities: ["Tabletop Burners", "Ventilation"],
							},
							images: getMockImage("Shabu Shabu", "hotpot,dining,asianfood"),
						},
						{
							identifier: "DINE-POTATO",
							displayName: "Potato Corner Stall",
							metadata: {
								description: "Famous flavored fries stall.",
								price: 0,
								priceUnit: "order",
								maxOccupancy: 0,
								amenities: ["Takeout Only"],
							},
							images: getMockImage("Potato Corner", "frenchfries,snack,foodstall"),
						},
					],
				},
				{
					name: "Food Service",
					spaceType: SpaceType.DINING,
					subtype: "OTHER",
					facilities: [
						{
							identifier: "FOOD-FAMILY",
							displayName: "Family Meals Pickup",
							metadata: {
								description: "Counter for picking up family sized meals.",
								price: 0,
								priceUnit: "order",
								maxOccupancy: 0,
								amenities: ["Pickup Counter", "Parking Near Entrance"],
							},
							images: getMockImage("Family Meals", "takeout,foodpacking"),
						},
					],
				},
			],
		},
	];

	try {
		// 1. Clean existing data (Optional: toggle this)
		console.log("🗑️  Cleaning up existing facilities and types...");
		await prisma.facility.deleteMany({});
		await prisma.facilityType.deleteMany({});

		// 2. Insert Data
		for (const cat of categories) {
			console.log(`Processing Category: ${cat.categoryName}`);
			for (const typeData of cat.types) {
				// Create Facility Type
				const fType = await prisma.facilityType.create({
					data: {
						name: typeData.name,
						spaceType: typeData.spaceType,
						subtype: typeData.subtype,
						organizationId: defaultOrgId,
						description: `${typeData.name} - ${cat.categoryName}`,
					},
				});
				console.log(`  Created Type: ${fType.name}`);

				// Create Facilities
				for (const facility of typeData.facilities) {
					await prisma.facility.create({
						data: {
							facilityTypeId: fType.id,
							identifier: facility.identifier,
							displayName: facility.displayName,
							organizationId: defaultOrgId,
							status: FacilityStatus.AVAILABLE,
							subtype: typeData.subtype, // Copy subtype to facility as per schema pattern
							metadata: facility.metadata || {},
							images: facility.images || [],
						},
					});
				}
				console.log(`    -> Added ${typeData.facilities.length} facilities.`);
			}
		}

		console.log("✅ Custom Facility Seeding Completed!");
	} catch (error) {
		console.error("❌ Error seeding custom facilities:", error);
		throw error;
	}
}
