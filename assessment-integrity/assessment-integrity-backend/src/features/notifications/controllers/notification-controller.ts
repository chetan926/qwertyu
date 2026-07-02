import type { Request, Response } from "express";
import { prisma } from "../../../database";
import { HTTP_STATUS } from "../../../constants/http-status";
import { AppError } from "../../../utils/app-error";
import { sendSuccess } from "../../../utils/response";

function getHeaderString(header: any): string {
  if (Array.isArray(header)) {
    return String(header[0] || "");
  }
  return String(header || "");
}

/**
 * GET /api/notifications
 */
export async function getNotifications(req: Request, res: Response): Promise<void> {
  const userId = getHeaderString(req.headers["x-user-id"]);
  if (!userId) {
    throw new AppError("Unauthorized: Missing user headers", HTTP_STATUS.UNAUTHORIZED);
  }

  const { read, type } = req.query;

  const whereClause: any = { userId };

  if (read !== undefined) {
    whereClause.read = read === "true";
  }

  if (type !== undefined) {
    whereClause.type = String(type);
  }

  const notifications = await prisma.notification.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  sendSuccess(res, notifications, "Notifications retrieved successfully", HTTP_STATUS.OK);
}

/**
 * POST /api/notifications
 * Body: { title, description, type, priority, targetRole, targetUserId, senderName, senderRole }
 */
export async function createNotification(req: Request, res: Response): Promise<void> {
  const senderId = getHeaderString(req.headers["x-user-id"]);
  const { title, description, type, priority, targetRole, targetUserId, senderName, senderRole } = req.body;

  if (!title || !description || !type) {
    throw new AppError("Title, description and type are required fields", HTTP_STATUS.BAD_REQUEST);
  }

  const createdNotifications = [];

  if (targetUserId) {
    // Single user target
    const notif = await prisma.notification.create({
      data: {
        userId: targetUserId,
        title,
        description,
        type,
        priority: priority || "medium",
        senderName: senderName || "System",
        senderRole: senderRole || "system",
      },
    });
    createdNotifications.push(notif);
  } else if (targetRole) {
    // Role-based target (announcements/broadcasts)
    let users = [];
    if (targetRole === "all") {
      users = await prisma.user.findMany({ select: { id: true } });
    } else {
      users = await prisma.user.findMany({
        where: { role: targetRole },
        select: { id: true },
      });
    }

    for (const u of users) {
      const notif = await prisma.notification.create({
        data: {
          userId: u.id,
          title,
          description,
          type,
          priority: priority || "medium",
          senderName: senderName || "System",
          senderRole: senderRole || "system",
        },
      });
      createdNotifications.push(notif);
    }
  } else {
    // If neither is specified, send to the sender themselves or reject
    if (!senderId) {
      throw new AppError("Target user or role is required", HTTP_STATUS.BAD_REQUEST);
    }
    const notif = await prisma.notification.create({
      data: {
        userId: senderId,
        title,
        description,
        type,
        priority: priority || "medium",
        senderName: senderName || "System",
        senderRole: senderRole || "system",
      },
    });
    createdNotifications.push(notif);
  }

  sendSuccess(res, createdNotifications, "Notification(s) created successfully", HTTP_STATUS.CREATED);
}

/**
 * POST /api/notifications/mark-read
 */
export async function markAllRead(req: Request, res: Response): Promise<void> {
  const userId = getHeaderString(req.headers["x-user-id"]);
  if (!userId) {
    throw new AppError("Unauthorized: Missing user headers", HTTP_STATUS.UNAUTHORIZED);
  }

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  sendSuccess(res, null, "All notifications marked as read", HTTP_STATUS.OK);
}

/**
 * POST /api/notifications/:id/read
 */
export async function markRead(req: Request, res: Response): Promise<void> {
  const userId = getHeaderString(req.headers["x-user-id"]);
  const id = req.params.id as string;

  if (!userId) {
    throw new AppError("Unauthorized: Missing user headers", HTTP_STATUS.UNAUTHORIZED);
  }

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== userId) {
    throw new AppError("Notification not found or unauthorized", HTTP_STATUS.NOT_FOUND);
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  sendSuccess(res, updated, "Notification marked as read", HTTP_STATUS.OK);
}

/**
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(req: Request, res: Response): Promise<void> {
  const userId = getHeaderString(req.headers["x-user-id"]);
  const id = req.params.id as string;

  if (!userId) {
    throw new AppError("Unauthorized: Missing user headers", HTTP_STATUS.UNAUTHORIZED);
  }

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== userId) {
    throw new AppError("Notification not found or unauthorized", HTTP_STATUS.NOT_FOUND);
  }

  await prisma.notification.delete({
    where: { id },
  });

  sendSuccess(res, null, "Notification deleted successfully", HTTP_STATUS.OK);
}
