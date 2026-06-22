import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./database";

async function bootstrap() {
	try {
		await prisma.$connect();
		console.log("Database connected");

		app.listen(env.PORT, "0.0.0.0", () => {
			console.log(`Server running on http://127.0.0.1:${env.PORT} [${env.NODE_ENV}]`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

bootstrap();
