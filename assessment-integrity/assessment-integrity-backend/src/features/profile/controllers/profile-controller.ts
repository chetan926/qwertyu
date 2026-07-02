import type { Request, Response } from "express";
import { prisma } from "../../../database";
import { HTTP_STATUS } from "../../../constants/http-status";
import { AppError } from "../../../utils/app-error";
import { sendSuccess } from "../../../utils/response";
import { hashPassword, verifyPassword } from "better-auth/crypto";

function getHeaderString(header: any): string {
  if (Array.isArray(header)) {
    return String(header[0] || "");
  }
  return String(header || "");
}

/**
 * GET /api/profile
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = getHeaderString(req.headers["x-user-id"]);
  if (!userId) {
    throw new AppError("Unauthorized: Missing user headers", HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: {
        select: {
          id: true,
          providerId: true,
          scope: true,
          createdAt: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, user, "Profile retrieved successfully", HTTP_STATUS.OK);
}

/**
 * PUT /api/profile
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = getHeaderString(req.headers["x-user-id"]);
  if (!userId) {
    throw new AppError("Unauthorized: Missing user headers", HTTP_STATUS.UNAUTHORIZED);
  }

  const {
    name,
    email,
    phoneNumber,
    bio,
    designation,
    institutionName,
    department,
    academicId,
    rollNumber,
    semester,
    branch,
    section,
    subjects,
    accessLevel,
    managedDepartments,
    image
  } = req.body;

  // Find if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  // Update user database record
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name !== undefined ? name : user.name,
      email: email !== undefined ? email : user.email,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : user.phoneNumber,
      bio: bio !== undefined ? bio : user.bio,
      designation: designation !== undefined ? designation : user.designation,
      institutionName: institutionName !== undefined ? institutionName : user.institutionName,
      department: department !== undefined ? department : user.department,
      academicId: academicId !== undefined ? academicId : user.academicId,
      rollNumber: rollNumber !== undefined ? rollNumber : user.rollNumber,
      semester: semester !== undefined ? semester : user.semester,
      branch: branch !== undefined ? branch : user.branch,
      section: section !== undefined ? section : user.section,
      subjects: subjects !== undefined ? subjects : user.subjects,
      accessLevel: accessLevel !== undefined ? accessLevel : user.accessLevel,
      managedDepartments: managedDepartments !== undefined ? managedDepartments : user.managedDepartments,
      image: image !== undefined ? image : user.image
    }
  });

  // Create audit log for profile update
  const ip = getHeaderString(req.headers["x-forwarded-for"]) || req.socket.remoteAddress || "";
  const ua = getHeaderString(req.headers["user-agent"]) || "";
  await prisma.userLog.create({
    data: {
      userId,
      action: "update_profile",
      ipAddress: ip,
      userAgent: ua
    }
  });

  // Generate notification
  await prisma.notification.create({
    data: {
      userId,
      title: "Account Details Updated",
      description: "Your profile information has been successfully synchronized and updated.",
      type: "system",
      priority: "low",
      senderName: "Security Control",
      senderRole: "system",
    }
  });

  sendSuccess(res, updated, "Profile updated successfully", HTTP_STATUS.OK);
}

/**
 * PUT /api/profile/password
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  const userId = getHeaderString(req.headers["x-user-id"]);
  if (!userId) {
    throw new AppError("Unauthorized: Missing user headers", HTTP_STATUS.UNAUTHORIZED);
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError("Current password and new password are required", HTTP_STATUS.BAD_REQUEST);
  }

  const account = await prisma.account.findFirst({
    where: { userId, providerId: "credential" }
  });

  if (!account || !account.password) {
    throw new AppError("Credentials account not found for this user", HTTP_STATUS.NOT_FOUND);
  }

  const isCorrect = await verifyPassword({
    password: currentPassword,
    hash: account.password
  });

  if (!isCorrect) {
    throw new AppError("Incorrect current password", HTTP_STATUS.BAD_REQUEST);
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.account.update({
    where: { id: account.id },
    data: { password: hashedPassword }
  });

  // Clean up all active sessions for this user (force re-login on all devices for security)
  await prisma.session.deleteMany({
    where: { userId }
  });

  // Audit log
  const ip = getHeaderString(req.headers["x-forwarded-for"]) || req.socket.remoteAddress || "";
  const ua = getHeaderString(req.headers["user-agent"]) || "";
  await prisma.userLog.create({
    data: {
      userId,
      action: "change_password",
      ipAddress: ip,
      userAgent: ua
    }
  });

  // Notification
  await prisma.notification.create({
    data: {
      userId,
      title: "Security Password Changed",
      description: "Your password was changed. All active sessions have been revoked for your safety.",
      type: "system",
      priority: "high",
      senderName: "Security Control",
      senderRole: "system",
    }
  });

  sendSuccess(res, null, "Password changed successfully. Please log in again.", HTTP_STATUS.OK);
}

/**
 * POST /api/profile/2fa
 */
export async function toggle2FA(req: Request, res: Response): Promise<void> {
  const userId = getHeaderString(req.headers["x-user-id"]);
  if (!userId) {
    throw new AppError("Unauthorized: Missing user headers", HTTP_STATUS.UNAUTHORIZED);
  }

  const { enabled } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: !!enabled }
  });

  // Audit log
  const ip = getHeaderString(req.headers["x-forwarded-for"]) || req.socket.remoteAddress || "";
  const ua = getHeaderString(req.headers["user-agent"]) || "";
  await prisma.userLog.create({
    data: {
      userId,
      action: enabled ? "enable_2fa" : "disable_2fa",
      ipAddress: ip,
      userAgent: ua
    }
  });

  // Notification
  await prisma.notification.create({
    data: {
      userId,
      title: enabled ? "Two-Factor Authentication Enabled" : "Two-Factor Authentication Disabled",
      description: enabled
        ? "Two-Factor Authentication (2FA) is now active on your account."
        : "Two-Factor Authentication (2FA) has been deactivated. Your account is less secure.",
      type: "system",
      priority: enabled ? "medium" : "high",
      senderName: "Security Control",
      senderRole: "system",
    }
  });

  sendSuccess(res, updated, "2FA status updated successfully", HTTP_STATUS.OK);
}

/**
 * GET /api/profile/history
 */
export async function getActivityHistory(req: Request, res: Response): Promise<void> {
  const userId = getHeaderString(req.headers["x-user-id"]);
  if (!userId) {
    throw new AppError("Unauthorized: Missing user headers", HTTP_STATUS.UNAUTHORIZED);
  }

  const logs = await prisma.userLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  sendSuccess(res, logs, "Activity history retrieved successfully", HTTP_STATUS.OK);
}

/**
 * GET /api/profile/sessions
 */
export async function getSessions(req: Request, res: Response): Promise<void> {
  const userId = getHeaderString(req.headers["x-user-id"]);
  if (!userId) {
    throw new AppError("Unauthorized: Missing user headers", HTTP_STATUS.UNAUTHORIZED);
  }

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  sendSuccess(res, sessions, "Active sessions retrieved successfully", HTTP_STATUS.OK);
}

/**
 * DELETE /api/profile/sessions/:id
 */
export async function revokeSession(req: Request, res: Response): Promise<void> {
  const userId = getHeaderString(req.headers["x-user-id"]);
  const id = req.params.id as string;

  if (!userId) {
    throw new AppError("Unauthorized: Missing user headers", HTTP_STATUS.UNAUTHORIZED);
  }

  const session = await prisma.session.findUnique({
    where: { id }
  });

  if (!session || session.userId !== userId) {
    throw new AppError("Session not found or unauthorized", HTTP_STATUS.NOT_FOUND);
  }

  await prisma.session.delete({
    where: { id }
  });

  sendSuccess(res, null, "Session revoked successfully", HTTP_STATUS.OK);
}
