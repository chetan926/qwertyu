import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Express } from "express";
import { adminRouter } from "./admin/routes/admin-routes";
import { env } from "./config/env";
import { getPlatformState } from "./admin/services/platform-state";
import { registerSwaggerDocs } from "./docs/swagger";

import { authenticationRouter } from "./features/authentication/routes/authentication-routes";
import { assessmentRouter } from "./features/assessments/routes/assessment-routes";
import { supportRouter } from "./features/support/routes/support-routes";
import { healthRouter } from "./features/health/routes/health-routes";
import { notificationRouter } from "./features/notifications/routes/notification-routes";
import { profileRouter } from "./features/profile/routes/profile-routes";
import { proctoringRouter } from "./features/proctoring/routes/proctoring-routes";
import { textExtractionRouter } from "./features/text-extraction/routes/text-extraction-routes";
import { answerSimilarityRouter } from "./features/answer-similarity/routes/answer-similarity-routes";
import { plagiarismRouter } from "./features/plagiarism/routes/plagiarism-routes";
import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";
import { auth } from "./providers/auth";

const app: Express = express();

app.use(
	cors({
		origin: [
			env.BETTER_AUTH_URL,
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:5175",
		],
		credentials: true,
	}),
);

// Logging middleware
app.use((req, _res, next) => {
	console.log(`[HTTP] ${req.method} ${req.url}`);
	next();
});

registerSwaggerDocs(app);

// Better Auth error redirect handler (sends users back to the frontend with the error param)
app.get("/api/auth/error", (req, res) => {
	const error = req.query.error || "UNKNOWN";
	const referer = req.headers.referer;
	let frontendUrl = "http://localhost:5173";

	if (referer) {
		try {
			const origin = new URL(referer).origin;
			if (
				origin === "http://localhost:5173" ||
				origin === "http://localhost:5174" ||
				origin === "http://localhost:5175"
			) {
				frontendUrl = origin;
			}
		} catch {
			// ignore
		}
	}
	res.redirect(`${frontendUrl}?error=${encodeURIComponent(String(error))}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Better Auth routes
app.all("/api/auth/*any", toNodeHandler(auth));


// Blocker middleware for Maintenance Mode and Emergency Shutdown
app.use((req, res, next) => {
	const { maintenanceMode, emergencyShutdown } = getPlatformState();
	if (maintenanceMode || emergencyShutdown) {
		const userId = req.headers["x-user-id"] as string;
		const userRole = req.headers["x-user-role"] as string;

		const isAdmin = userRole === "admin" || userId === "admin-user-id" || userRole === "support";
		const isPublicRoute = req.url.startsWith("/api/admin") || req.url.startsWith("/api/auth") || req.url.startsWith("/api/health");

		if (!isAdmin && !isPublicRoute) {
			if (emergencyShutdown) {
				return res.status(503).json({
					status: "EMERGENCY_SHUTDOWN",
					message: "System has been suspended by the administrator for safety and security."
				});
			}
			if (maintenanceMode) {
				return res.status(503).json({
					status: "MAINTENANCE_MODE",
					message: "System is undergoing planned maintenance. Please try again later."
				});
			}
		}
	}
	next();
});

// Feature routes
app.use("/api/health", healthRouter);
app.use("/api/authentication", authenticationRouter);
app.use("/api/assessments", assessmentRouter);
app.use("/api/support", supportRouter);
app.use("/api/admin", adminRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/profile", profileRouter);
app.use("/api/proctoring", proctoringRouter);
app.use("/api/text-extraction", textExtractionRouter);
app.use("/api/answer-similarity", answerSimilarityRouter);
app.use("/api/plagiarism", plagiarismRouter);

app.use(notFound);
app.use(errorHandler);

export { app };
