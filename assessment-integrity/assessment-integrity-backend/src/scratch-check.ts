import { prisma } from "./database";
import { auth } from "./providers/auth";

async function run() {
	try {
		console.log("--- Checking Admin Account in Database ---");
		const email = "neelampallicharanbalaji14@gmail.com";
		const user = await prisma.user.findUnique({
			where: { email },
			include: {
				accounts: true,
			},
		});

		if (!user) {
			console.log("User not found!");
			process.exit(0);
		}

		console.log("User Record:", {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			status: user.status,
			suspendedUntil: user.suspendedUntil,
		});

		console.log("Accounts count:", user.accounts.length);
		for (const acc of user.accounts) {
			console.log("Account Provider:", acc.providerId);
		}

		// Try to test sign-in logic locally to see what error it returns
		console.log("\n--- Testing Sign In Locally ---");
		try {
			const res = await auth.api.signInEmail({
				body: {
					email,
					password: "Charan@123",
				},
			});
			console.log("Local Sign In Success! Token:", res.token);
		} catch (err: any) {
			console.error("Local Sign In Failed with error:", err);
			if (err.body) {
				console.error("Error body:", err.body);
			}
		}

		process.exit(0);
	} catch (error) {
		console.error("Error running check:", error);
		process.exit(1);
	}
}

run();
