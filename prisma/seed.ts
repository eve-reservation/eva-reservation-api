import { PrismaClient } from "../generated/prisma";
import * as argon2 from "argon2";
import { seedCustomFacilities } from "./seeds/customFacilitySeeder";
const prisma = new PrismaClient();

async function main() {
	// Seed template data
	// await seedTemplates(); // Keeping this might be good, but user wants SPECIFIC data. I'll uncomment if needed, but let's prioritize the new one.
	// Actually, I'll keep seedTemplates as comment or run it before if it's unrelated.
	// The user's request is "make me a seeder".

	await seedCustomFacilities();

	console.log("Seeding completed successfully!");
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error("Error during seeding:", e);
		await prisma.$disconnect();
		process.exit(1);
	});
