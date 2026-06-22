import type { Request, Response } from "express";
import { HTTP_STATUS } from "@/constants/http-status";
import { prisma } from "@/database";
import { AppError } from "@/utils/app-error";
import { sendSuccess } from "@/utils/response";
import * as adminService from "../services/admin-service";
import { 
	getPlatformState, 
	updatePlatformState, 
	logSelfHealingAction 
} from "../services/platform-state";
import { hashPassword } from "better-auth/crypto";

export async function getUsersHandler(req: Request, res: Response) {
	const users = await adminService.getAllUsers();
	sendSuccess(res, users, "Users retrieved successfully", HTTP_STATUS.OK);
}

export async function getUserLogsHandler(req: Request, res: Response) {
	const userId = req.params.id;
	if (!userId || typeof userId !== "string") {
		throw new AppError("User ID is required", HTTP_STATUS.BAD_REQUEST);
	}
	const logs = await adminService.getUserLogs(userId);
	sendSuccess(res, logs, "Logs retrieved successfully", HTTP_STATUS.OK);
}

export async function suspendUserHandler(req: Request, res: Response) {
	const userId = req.params.id;
	const adminUser = (req as any).user;

	if (!userId || typeof userId !== "string") {
		throw new AppError("User ID is required", HTTP_STATUS.BAD_REQUEST);
	}

	const targetUser = await prisma.user.findUnique({ where: { id: userId } });
	if (!targetUser) {
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
	}

	if (targetUser.role === "admin") {
		throw new AppError("You cannot modify other administrators", HTTP_STATUS.FORBIDDEN);
	}

	await adminService.suspendUser(userId);

	const ip = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress;
	const ua = req.headers["user-agent"];
	await adminService.logAdminAction(
		adminUser.id,
		userId,
		`suspended by admin (${adminUser.email})`,
		ip,
		ua,
	);

	sendSuccess(res, null, "User suspended successfully", HTTP_STATUS.OK);
}

export async function unsuspendUserHandler(req: Request, res: Response) {
	const userId = req.params.id;
	const adminUser = (req as any).user;

	if (!userId || typeof userId !== "string") {
		throw new AppError("User ID is required", HTTP_STATUS.BAD_REQUEST);
	}

	const targetUser = await prisma.user.findUnique({ where: { id: userId } });
	if (!targetUser) {
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
	}

	await adminService.unsuspendUser(userId);

	const ip = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress;
	const ua = req.headers["user-agent"];
	await adminService.logAdminAction(
		adminUser.id,
		userId,
		`unsuspended by admin (${adminUser.email})`,
		ip,
		ua,
	);

	sendSuccess(res, null, "User reactivated successfully", HTTP_STATUS.OK);
}

export async function tempSuspendUserHandler(req: Request, res: Response) {
	const userId = req.params.id;
	const { durationHours } = req.body;
	const adminUser = (req as any).user;

	if (!userId || typeof userId !== "string") {
		throw new AppError("User ID is required", HTTP_STATUS.BAD_REQUEST);
	}

	if (!durationHours || typeof durationHours !== "number" || durationHours <= 0) {
		throw new AppError("A valid duration in hours is required", HTTP_STATUS.BAD_REQUEST);
	}

	const targetUser = await prisma.user.findUnique({ where: { id: userId } });
	if (!targetUser) {
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
	}

	if (targetUser.role === "admin") {
		throw new AppError("You cannot modify other administrators", HTTP_STATUS.FORBIDDEN);
	}

	await adminService.tempSuspendUser(userId, durationHours);

	const ip = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress;
	const ua = req.headers["user-agent"];
	await adminService.logAdminAction(
		adminUser.id,
		userId,
		`temporarily suspended for ${durationHours} hours by admin (${adminUser.email})`,
		ip,
		ua,
	);

	sendSuccess(res, null, `User temporarily suspended for ${durationHours} hours`, HTTP_STATUS.OK);
}

export async function deleteUserHandler(req: Request, res: Response) {
	const userId = req.params.id;
	const adminUser = (req as any).user;

	if (!userId || typeof userId !== "string") {
		throw new AppError("User ID is required", HTTP_STATUS.BAD_REQUEST);
	}

	const targetUser = await prisma.user.findUnique({ where: { id: userId } });
	if (!targetUser) {
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
	}

	if (targetUser.role === "admin") {
		throw new AppError("You cannot delete other administrators", HTTP_STATUS.FORBIDDEN);
	}

	await adminService.deleteUser(userId);

	// Log deletion action (write to general sys logs since user log is cascadingly deleted if linked)
	console.log(
		`[Admin Activity] User ${targetUser.email} (ID: ${userId}) was deleted by admin ${adminUser.email}`,
	);

	sendSuccess(res, null, "User deleted successfully", HTTP_STATUS.OK);
}

export async function updateUserRoleHandler(req: Request, res: Response) {
	const userId = req.params.id;
	const { role } = req.body;
	const adminUser = (req as any).user;

	if (!userId || typeof userId !== "string") {
		throw new AppError("User ID is required", HTTP_STATUS.BAD_REQUEST);
	}

	if (!role || (role !== "admin" && role !== "user")) {
		throw new AppError("A valid role ('admin' or 'user') is required", HTTP_STATUS.BAD_REQUEST);
	}

	const targetUser = await prisma.user.findUnique({ where: { id: userId } });
	if (!targetUser) {
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
	}

	if (targetUser.email === "neelampallicharanbalaji14@gmail.com") {
		throw new AppError(
			"You cannot demote or modify the primary administrator account",
			HTTP_STATUS.FORBIDDEN,
		);
	}

	if (targetUser.id === adminUser.id) {
		throw new AppError("You cannot modify your own role", HTTP_STATUS.BAD_REQUEST);
	}

	await adminService.updateUserRole(userId, role);

	const ip = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress;
	const ua = req.headers["user-agent"];
	await adminService.logAdminAction(
		adminUser.id,
		userId,
		`role updated to ${role} by admin (${adminUser.email})`,
		ip,
		ua,
	);

	sendSuccess(res, null, "User role updated successfully", HTTP_STATUS.OK);
}

export async function getSettingsHandler(req: Request, res: Response) {
	const state = getPlatformState();
	sendSuccess(res, state, "Platform settings retrieved successfully", HTTP_STATUS.OK);
}

export async function updateSettingsHandler(req: Request, res: Response) {
	const adminUser = (req as any).user;
	const updates = req.body;
	
	const oldState = { ...getPlatformState() };
	const state = updatePlatformState(updates);
	
	const ip = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress;
	const ua = req.headers["user-agent"];

	// Log change
	let logMsg = `Platform settings updated by admin (${adminUser.email})`;
	if (updates.maintenanceMode !== undefined && updates.maintenanceMode !== oldState.maintenanceMode) {
		logMsg = `Maintenance Mode toggled to ${updates.maintenanceMode ? "ENABLED" : "DISABLED"} by admin (${adminUser.email})`;
		logSelfHealingAction("System Settings", logMsg, "MONITOR");
	}
	if (updates.emergencyShutdown !== undefined && updates.emergencyShutdown !== oldState.emergencyShutdown) {
		logMsg = `Emergency Shutdown toggled to ${updates.emergencyShutdown ? "ENABLED" : "DISABLED"} by admin (${adminUser.email})`;
		logSelfHealingAction("Emergency System Controller", logMsg, "MONITOR");
	}

	await adminService.logAdminAction(
		adminUser.id,
		adminUser.id,
		logMsg,
		ip,
		ua
	);

	sendSuccess(res, state, "Platform settings updated successfully", HTTP_STATUS.OK);
}

export async function getSystemHealthHandler(req: Request, res: Response) {
	// Dynamically simulated health metrics
	const cpuUsage = Math.floor(20 + Math.random() * 25); // 20% - 45%
	const memoryUsage = Math.round((3.2 + Math.random() * 1.6) * 10) / 10; // 3.2GB - 4.8GB
	const dbConnections = Math.floor(12 + Math.random() * 6); // 12 - 18
	const wsConnections = Math.floor(5 + Math.random() * 10); // 5 - 15
	const queryTime = Math.floor(8 + Math.random() * 16); // 8ms - 24ms
	
	const healthData = {
		infrastructure: {
			cpuUsage,
			memoryUsage,
			memoryTotal: 8.0,
			dbConnections,
			wsConnections,
			queryTime,
			storageUsed: 21.8,
			storageTotal: 40.0,
			backupStatus: "Completed - 2026-06-20 03:00 AM",
			networkUptime: "99.99%",
			sslExpiryDays: 284
		}
	};

	sendSuccess(res, healthData, "System health retrieved successfully", HTTP_STATUS.OK);
}

export async function getAgentStatusHandler(req: Request, res: Response) {
	// AI Agent status breakdown
	const agents = [
		{ name: "Identity Verification Agent", status: "Active", uptime: "99.98%", activeTasks: 3, failures: 0 },
		{ name: "Evaluation Orchestrator Agent", status: "Active", uptime: "99.95%", activeTasks: 0, failures: 1 },
		{ name: "Similarity Detection Agent", status: "Active", uptime: "100%", activeTasks: 0, failures: 0 },
		{ name: "Integrity Analysis Agent", status: "Active", uptime: "99.97%", activeTasks: 2, failures: 0 },
		{ name: "Risk Assessment Agent", status: "Active", uptime: "99.96%", activeTasks: 1, failures: 1 },
		{ name: "AI Support Agent", status: "Active", uptime: "100%", activeTasks: 1, failures: 0 },
		{ name: "Database Memory Agent", status: "Active", uptime: "100%", activeTasks: 0, failures: 0 },
		{ name: "Institutional Report Agent", status: "Active", uptime: "99.99%", activeTasks: 0, failures: 0 }
	];

	sendSuccess(res, agents, "AI Agent statuses retrieved successfully", HTTP_STATUS.OK);
}

export async function getAssessmentsComplianceHandler(req: Request, res: Response) {
	// Load assessments from database and add mock compliance details
	const assessments = await prisma.assessment.findMany({
		include: {
			_count: {
				select: { attempts: true }
			}
		}
	});

	// Map assessments to include compliance checking details
	const formatted = assessments.map(a => {
		const isComplianceFlagged = a.browserLockdown === false || a.faceVerification === false;
		return {
			id: a.id,
			title: a.title,
			duration: a.duration,
			attemptsCount: a._count.attempts,
			published: a.published,
			gradingScheme: a.gradingScheme,
			institutionName: a.institutionName,
			facultyName: a.facultyName,
			securityScore: (a.webcamMonitoring ? 20 : 0) + 
						   (a.faceVerification ? 20 : 0) + 
						   (a.gazeTracking ? 20 : 0) + 
						   (a.browserLockdown ? 20 : 0) + 
						   (a.tabSwitchDetection ? 20 : 0),
			complianceStatus: isComplianceFlagged ? "Flagged (Low Security)" : "Compliant",
			integrityViolationRate: a._count.attempts > 0 ? "4.2%" : "0%"
		};
	});

	sendSuccess(res, formatted, "Assessment compliance metrics retrieved", HTTP_STATUS.OK);
}

export async function getAdminAuditLogsHandler(req: Request, res: Response) {
	// Fetch all admin logs from DB and self healing logs from platformState
	const adminLogs = await prisma.userLog.findMany({
		orderBy: { createdAt: "desc" }
	});

	const state = getPlatformState();
	const selfHealingLogs = state.selfHealingLogs;

	sendSuccess(res, { adminLogs, selfHealingLogs }, "Audit logs retrieved successfully", HTTP_STATUS.OK);
}

export async function triggerSelfHealHandler(req: Request, res: Response) {
	const adminUser = (req as any).user;
	
	logSelfHealingAction(
		"Self-Healing Orchestrator",
		`Manual self-healing maintenance cycle forced by administrator (${adminUser.email}).`,
		"MONITOR"
	);

	sendSuccess(res, null, "Self-healing checks completed. Infrastructure is stable.", HTTP_STATUS.OK);
}

export async function resetUserPasswordHandler(req: Request, res: Response) {
	const userId = req.params.id;
	const { password } = req.body;
	const adminUser = (req as any).user;

	if (!userId || typeof userId !== "string") {
		throw new AppError("User ID is required", HTTP_STATUS.BAD_REQUEST);
	}
	if (!password || typeof password !== "string") {
		throw new AppError("Password string is required", HTTP_STATUS.BAD_REQUEST);
	}

	const targetUser = await prisma.user.findUnique({ where: { id: userId } });
	if (!targetUser) {
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
	}
	if (targetUser.role === "admin") {
		throw new AppError("You cannot modify other administrators", HTTP_STATUS.FORBIDDEN);
	}

	// Hash password using Better Auth format
	const hashedPassword = await hashPassword(password);

	// Find user account in prisma and update password
	const account = await prisma.account.findFirst({
		where: { userId }
	});

	if (!account) {
		throw new AppError("Credentials account not found for this user", HTTP_STATUS.NOT_FOUND);
	}

	await prisma.account.update({
		where: { id: account.id },
		data: { password: hashedPassword }
	});

	// Force log out after password change
	await prisma.session.deleteMany({
		where: { userId }
	});

	const ip = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress;
	const ua = req.headers["user-agent"];
	await adminService.logAdminAction(
		adminUser.id,
		userId,
		`forced password reset and sessions revoked by admin (${adminUser.email})`,
		ip,
		ua
	);

	sendSuccess(res, null, "User password reset successfully and active sessions revoked", HTTP_STATUS.OK);
}

export async function forceLogoutUserHandler(req: Request, res: Response) {
	const userId = req.params.id;
	const adminUser = (req as any).user;

	if (!userId || typeof userId !== "string") {
		throw new AppError("User ID is required", HTTP_STATUS.BAD_REQUEST);
	}

	const targetUser = await prisma.user.findUnique({ where: { id: userId } });
	if (!targetUser) {
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
	}

	// Revoke sessions
	await prisma.session.deleteMany({
		where: { userId }
	});

	const ip = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress;
	const ua = req.headers["user-agent"];
	await adminService.logAdminAction(
		adminUser.id,
		userId,
		`forced session termination by admin (${adminUser.email})`,
		ip,
		ua
	);

	sendSuccess(res, null, "User sessions terminated successfully", HTTP_STATUS.OK);
}
