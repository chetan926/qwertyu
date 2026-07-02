import { type IRouter, Router } from "express";
import {
  getNotifications,
  createNotification,
  markAllRead,
  markRead,
  deleteNotification
} from "../controllers/notification-controller";

const router: IRouter = Router();

// GET /api/notifications
router.get("/", getNotifications);

// POST /api/notifications
router.post("/", createNotification);

// POST /api/notifications/mark-read
router.post("/mark-read", markAllRead);

// POST /api/notifications/:id/read
router.post("/:id/read", markRead);

// DELETE /api/notifications/:id
router.delete("/:id", deleteNotification);

export { router as notificationRouter };
