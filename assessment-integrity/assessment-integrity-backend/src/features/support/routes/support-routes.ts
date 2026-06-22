import { type IRouter, Router } from "express";
import {
  getTickets,
  createTicket,
  postMessage,
  updateTicketStatus,
  getSupportAnalytics,
  sendSupportRegisterOtp,
  verifySupportRegisterOtp
} from "../controllers/support-controller";

const router: IRouter = Router();

// POST /api/support/send-otp
router.post("/send-otp", sendSupportRegisterOtp);

// POST /api/support/verify-otp
router.post("/verify-otp", verifySupportRegisterOtp);

// GET /api/support/tickets
router.get("/tickets", getTickets);

// POST /api/support/tickets
router.post("/tickets", createTicket);

// POST /api/support/tickets/:ticketId/messages
router.post("/tickets/:ticketId/messages", postMessage);

// POST /api/support/tickets/:ticketId/status
router.post("/tickets/:ticketId/status", updateTicketStatus);

// GET /api/support/analytics
router.get("/analytics", getSupportAnalytics);

export { router as supportRouter };
