import { type IRouter, Router } from "express";
import { HTTP_STATUS } from "@/constants/http-status";
import { auth } from "@/providers/auth";
import { AppError } from "@/utils/app-error";
import {
	deleteUserHandler,
	getUserLogsHandler,
	getUsersHandler,
	suspendUserHandler,
	tempSuspendUserHandler,
	unsuspendUserHandler,
	updateUserRoleHandler,
	getSettingsHandler,
	updateSettingsHandler,
	getSystemHealthHandler,
	getAgentStatusHandler,
	getAssessmentsComplianceHandler,
	getAdminAuditLogsHandler,
	triggerSelfHealHandler,
	resetUserPasswordHandler,
	forceLogoutUserHandler,
} from "../controllers/admin-controller";

const router: IRouter = Router();

// Middleware to verify session and admin role
async function adminMiddleware(req: any, res: any, next: any) {
	const sessionData = await auth.api.getSession({
		headers: new Headers(req.headers as any),
	});

	if (!sessionData || !sessionData.user) {
		throw new AppError("Unauthorized: Session not found", HTTP_STATUS.UNAUTHORIZED);
	}

	if (
		sessionData.user.role !== "admin" ||
		sessionData.user.email !== "neelampallicharanbalaji14@gmail.com"
	) {
		throw new AppError("Forbidden: Administrator privileges required", HTTP_STATUS.FORBIDDEN);
	}

	// Attach user and session to request for downstream handlers
	req.user = sessionData.user;
	req.session = sessionData.session;

	next();
}

// Secure all admin routes using the adminMiddleware
router.use(adminMiddleware);

// GET /api/admin/users
router.get("/users", getUsersHandler);

// GET /api/admin/users/:id/logs
router.get("/users/:id/logs", getUserLogsHandler);

// POST /api/admin/users/:id/suspend
router.post("/users/:id/suspend", suspendUserHandler);

// POST /api/admin/users/:id/unsuspend
router.post("/users/:id/unsuspend", unsuspendUserHandler);

// POST /api/admin/users/:id/temp-suspend
router.post("/users/:id/temp-suspend", tempSuspendUserHandler);

// POST /api/admin/users/:id/role
router.post("/users/:id/role", updateUserRoleHandler);

// DELETE /api/admin/users/:id
router.delete("/users/:id", deleteUserHandler);

// Global settings
router.get("/settings", getSettingsHandler);
router.post("/settings", updateSettingsHandler);

// System diagnostics
router.get("/health", getSystemHealthHandler);
router.get("/agents", getAgentStatusHandler);
router.get("/assessments", getAssessmentsComplianceHandler);
router.get("/audit-logs", getAdminAuditLogsHandler);
router.post("/self-heal", triggerSelfHealHandler);

// User force commands
router.post("/users/:id/reset-password", resetUserPasswordHandler);
router.post("/users/:id/force-logout", forceLogoutUserHandler);

export { router as adminRouter };
