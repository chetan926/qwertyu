import { auth } from "../providers/auth";
import { prisma } from "./prisma";

async function seed() {
	try {
		console.log("Seeding admin user...");
		const email = "neelampallicharanbalaji14@gmail.com";

		const existing = await prisma.user.findUnique({
			where: { email },
		});

		if (existing) {
			await prisma.user.delete({
				where: { email },
			});
			console.log("Deleted old admin user to update credentials...");
		}

		const user = await auth.api.signUpEmail({
			body: {
				email,
				password: "Charan@123",
				name: "System Admin",
			},
		});
		console.log("Created base user with updated credentials:", user);

		const updated = await prisma.user.update({
			where: { email },
			data: { role: "admin" },
		});

		console.log("Seed successful! Admin role updated for user:", updated.email);
		process.exit(0);
	} catch (error) {
		console.error("Seed failed:", error);
		process.exit(1);
	}
}

seed();
