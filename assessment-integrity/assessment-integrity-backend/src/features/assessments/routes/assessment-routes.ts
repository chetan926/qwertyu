import { type IRouter, Router } from "express";
import {
	createAssessment,
	editAssessment,
	publishAssessment,
	getAssessments,
	getAssessmentById,
	startAttempt,
	updateProgress,
	logViolation,
	submitAttempt,
	getAttempts,
	getAttemptDetails,
	evaluateAttempt,
	reEvaluateAttempt,
	getAttemptAuditTrail,
	getAssessmentAuditTrail,
	getAnalytics,
} from "../controllers/assessment-controller";

const router: IRouter = Router();

// Assessments list and CRUD
router.get("/", getAssessments);
router.post("/", createAssessment);
router.get("/:id", getAssessmentById);
router.put("/:id", editAssessment);
router.post("/:id/publish", publishAssessment);

// Attempt actions (Students)
router.post("/:id/start", startAttempt);
router.post("/attempts/:attemptId/progress", updateProgress);
router.post("/attempts/:attemptId/violation", logViolation);
router.post("/attempts/:attemptId/submit", submitAttempt);

// Evaluation and proctoring (Faculty)
router.get("/:id/attempts", getAttempts);
router.get("/attempts/:attemptId", getAttemptDetails);
router.post("/attempts/:attemptId/evaluate", evaluateAttempt);
router.post("/attempts/:attemptId/re-evaluate", reEvaluateAttempt);
router.get("/attempts/:attemptId/audit", getAttemptAuditTrail);
router.get("/:id/audit-trail", getAssessmentAuditTrail);
router.get("/:id/analytics", getAnalytics);

export { router as assessmentRouter };
