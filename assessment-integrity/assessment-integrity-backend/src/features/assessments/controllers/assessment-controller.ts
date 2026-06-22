import type { Request, Response } from "express";
import { prisma } from "@/database";
import { HTTP_STATUS } from "@/constants/http-status";
import { AppError } from "@/utils/app-error";
import { sendSuccess } from "@/utils/response";
import { getEmbedding } from "../services/vector-service";
import { orchestrateEvaluation } from "../services/evaluation-engine";

/**
 * Express v5 parameter helpers to avoid string/string[] type mismatch
 */
function getParamString(param: any): string {
	if (Array.isArray(param)) {
		return String(param[0] || "");
	}
	return String(param || "");
}

function getHeaderString(header: any): string {
	if (Array.isArray(header)) {
		return String(header[0] || "");
	}
	return String(header || "");
}

/**
 * Helper to check if a user is faculty or admin
 */
async function checkFaculty(userId: string) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new AppError("Forbidden: User not found.", HTTP_STATUS.FORBIDDEN);
	}
	// Duplicate credentials testing support: allow registered users to manage assessments
	return user;
}

/**
 * GET /api/assessments
 * Returns assessments.
 * - Faculty: returns assessments they created.
 * - Student: returns published assessments matching their institution.
 */
export async function getAssessments(req: Request, res: Response): Promise<void> {
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized: Missing User ID in headers", HTTP_STATUS.UNAUTHORIZED);
	}

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
	}

	// Dynamic duplicate credentials support: respect x-user-role if provided
	const clientRole = getHeaderString(req.headers["x-user-role"]);
	const role = clientRole || user.role;

	if (role === "faculty" || role === "admin") {
		const assessments = await prisma.assessment.findMany({
			where: { facultyId: user.id },
			include: {
				_count: {
					select: { attempts: true, questions: true },
				},
			},
			orderBy: { createdAt: "desc" },
		}) as any[];
		sendSuccess(res, assessments, "Assessments retrieved successfully", HTTP_STATUS.OK);
	} else {
		// Student: assessments matching student's institution
		const institution = user.email === "neelampallicharanbalaji14@gmail.com"
			? (user.institutionName || "SRM University AP")
			: user.institutionName;
		if (!institution) {
			sendSuccess(res, [], "Link your institution to see assessments", HTTP_STATUS.OK);
			return;
		}

		// Find assessments in same institution
		const assessments = await prisma.assessment.findMany({
			where: {
				institutionName: institution,
			},
			include: {
				attempts: {
					where: { studentId: user.id },
				},
				_count: {
					select: { questions: true },
				},
			},
			orderBy: { createdAt: "desc" },
		}) as any[];

		// Map to indicate if student has already completed or started it
		const formatted = assessments.map((a) => {
			const attempt = a.attempts?.[0];
			return {
				id: a.id,
				title: a.title,
				description: a.description,
				duration: a.duration,
				availabilityStart: a.availabilityStart,
				availabilityEnd: a.availabilityEnd,
				gradingScheme: a.gradingScheme,
				facultyName: a.facultyName,
				questionsCount: a._count?.questions || 0,
				attemptStatus: attempt ? attempt.status : "not_started",
				attemptId: attempt ? attempt.id : null,
				attemptScore: attempt ? attempt.score : null,
				attemptIntegrity: attempt ? attempt.integrityScore : null,
			};
		});

		sendSuccess(res, formatted, "Student assessments retrieved successfully", HTTP_STATUS.OK);
	}
}

/**
 * GET /api/assessments/:id
 */
export async function getAssessmentById(req: Request, res: Response): Promise<void> {
	const id = getParamString(req.params.id);
	const userId = getHeaderString(req.headers["x-user-id"]);

	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
	}

	const assessment = await prisma.assessment.findUnique({
		where: { id },
		include: {
			questions: true,
		},
	}) as any;

	if (!assessment) {
		throw new AppError("Assessment not found", HTTP_STATUS.NOT_FOUND);
	}

	// Security: If user is a student, strip correctAnswer field from MCQs
	const clientRole = getHeaderString(req.headers["x-user-role"]);
	const role = clientRole || user.role;

	if (role === "user" && assessment.questions) {
		assessment.questions = assessment.questions.map((q: any) => ({
			...q,
			correctAnswer: null, // do not send answers to client
		}));
	}

	sendSuccess(res, assessment, "Assessment retrieved successfully", HTTP_STATUS.OK);
}

/**
 * POST /api/assessments
 * Body: { title, description, duration, availabilityStart, availabilityEnd, attemptLimit, gradingScheme, questions, webcamMonitoring, ... }
 */
export async function createAssessment(req: Request, res: Response): Promise<void> {
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	const faculty = await checkFaculty(userId);

	const {
		title,
		description,
		duration,
		availabilityStart,
		availabilityEnd,
		attemptLimit,
		gradingScheme,
		webcamMonitoring,
		microphoneAnalysis,
		browserLockdown,
		faceVerification,
		gazeTracking,
		tabSwitchDetection,
		behavioralAnalysis,
		questions,
	} = req.body;

	if (!title || !duration) {
		throw new AppError("Title and Duration are required", HTTP_STATUS.BAD_REQUEST);
	}

	const assessment = await prisma.assessment.create({
		data: {
			title,
			description,
			duration: Number(duration),
			availabilityStart: availabilityStart ? new Date(availabilityStart) : null,
			availabilityEnd: availabilityEnd ? new Date(availabilityEnd) : null,
			attemptLimit: Number(attemptLimit || 1),
			gradingScheme: gradingScheme || "points",
			institutionName: faculty.institutionName || "SRM University AP",
			facultyName: faculty.name,
			facultyId: faculty.id,
			webcamMonitoring: !!webcamMonitoring,
			microphoneAnalysis: !!microphoneAnalysis,
			browserLockdown: !!browserLockdown,
			faceVerification: !!faceVerification,
			gazeTracking: !!gazeTracking,
			tabSwitchDetection: !!tabSwitchDetection,
			behavioralAnalysis: !!behavioralAnalysis,
			published: true,
		},
	});

	// Insert questions
	if (questions && Array.isArray(questions)) {
		for (const q of questions) {
			await prisma.question.create({
				data: {
					assessmentId: assessment.id,
					type: q.type,
					text: q.text,
					options: q.options ? JSON.stringify(q.options) : null,
					correctAnswer: q.correctAnswer || null,
					points: Number(q.points || 1),
					difficulty: q.difficulty || "medium",
					learningOutcome: q.learningOutcome || null,
				},
			});
		}
	}

	const createdAssessment = await prisma.assessment.findUnique({
		where: { id: assessment.id },
		include: { questions: true },
	});

	sendSuccess(res, createdAssessment, "Assessment created successfully", HTTP_STATUS.CREATED);
}

/**
 * PUT /api/assessments/:id
 */
export async function editAssessment(req: Request, res: Response): Promise<void> {
	const id = getParamString(req.params.id);
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	await checkFaculty(userId);

	const {
		title,
		description,
		duration,
		availabilityStart,
		availabilityEnd,
		attemptLimit,
		gradingScheme,
		webcamMonitoring,
		microphoneAnalysis,
		browserLockdown,
		faceVerification,
		gazeTracking,
		tabSwitchDetection,
		behavioralAnalysis,
		questions,
	} = req.body;

	const assessment = await prisma.assessment.findUnique({ where: { id } });
	if (!assessment) {
		throw new AppError("Assessment not found", HTTP_STATUS.NOT_FOUND);
	}

	await prisma.assessment.update({
		where: { id },
		data: {
			title: title ?? assessment.title,
			description: description ?? assessment.description,
			duration: duration ? Number(duration) : assessment.duration,
			availabilityStart: availabilityStart ? new Date(availabilityStart) : assessment.availabilityStart,
			availabilityEnd: availabilityEnd ? new Date(availabilityEnd) : assessment.availabilityEnd,
			attemptLimit: attemptLimit ? Number(attemptLimit) : assessment.attemptLimit,
			gradingScheme: gradingScheme ?? assessment.gradingScheme,
			webcamMonitoring: webcamMonitoring !== undefined ? !!webcamMonitoring : assessment.webcamMonitoring,
			microphoneAnalysis: microphoneAnalysis !== undefined ? !!microphoneAnalysis : assessment.microphoneAnalysis,
			browserLockdown: browserLockdown !== undefined ? !!browserLockdown : assessment.browserLockdown,
			faceVerification: faceVerification !== undefined ? !!faceVerification : assessment.faceVerification,
			gazeTracking: gazeTracking !== undefined ? !!gazeTracking : assessment.gazeTracking,
			tabSwitchDetection: tabSwitchDetection !== undefined ? !!tabSwitchDetection : assessment.tabSwitchDetection,
			behavioralAnalysis: behavioralAnalysis !== undefined ? !!behavioralAnalysis : assessment.behavioralAnalysis,
		},
	});

	if (questions && Array.isArray(questions)) {
		// Drop old questions and insert new ones
		await prisma.question.deleteMany({ where: { assessmentId: id } });
		for (const q of questions) {
			await prisma.question.create({
				data: {
					assessmentId: id,
					type: q.type,
					text: q.text,
					options: q.options ? JSON.stringify(q.options) : null,
					correctAnswer: q.correctAnswer || null,
					points: Number(q.points || 1),
					difficulty: q.difficulty || "medium",
					learningOutcome: q.learningOutcome || null,
				},
			});
		}
	}

	const updated = await prisma.assessment.findUnique({
		where: { id },
		include: { questions: true },
	});

	sendSuccess(res, updated, "Assessment updated successfully", HTTP_STATUS.OK);
}

/**
 * POST /api/assessments/:id/publish
 */
export async function publishAssessment(req: Request, res: Response): Promise<void> {
	const id = getParamString(req.params.id);
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	await checkFaculty(userId);

	const updated = await prisma.assessment.update({
		where: { id },
		data: { published: true },
	});

	sendSuccess(res, updated, "Assessment published successfully", HTTP_STATUS.OK);
}

/**
 * POST /api/assessments/:id/start
 * Starts assessment attempt for a student.
 */
export async function startAttempt(req: Request, res: Response): Promise<void> {
	const id = getParamString(req.params.id);
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	const student = await prisma.user.findUnique({ where: { id: userId } });
	if (!student) {
		throw new AppError("Student record not found", HTTP_STATUS.NOT_FOUND);
	}

	const assessment = await prisma.assessment.findUnique({
		where: { id },
		include: { questions: true },
	}) as any;

	if (!assessment) {
		throw new AppError("Assessment not found", HTTP_STATUS.NOT_FOUND);
	}

	// Check if already completed attempt
	const existing = await prisma.assessmentAttempt.findFirst({
		where: {
			assessmentId: id,
			studentId: student.id,
		},
	});

	if (existing) {
		if (existing.status === "submitted" || existing.status === "graded" || existing.status === "Faculty Review Required") {
			throw new AppError("You have already completed this assessment.", HTTP_STATUS.BAD_REQUEST);
		}
		// Resume existing started attempt
		sendSuccess(res, { attempt: existing, questions: (assessment.questions || []).map((q: any) => ({ ...q, correctAnswer: null })) }, "Attempt resumed", HTTP_STATUS.OK);
		return;
	}

	const attempt = await prisma.assessmentAttempt.create({
		data: {
			assessmentId: id,
			studentId: student.id,
			studentName: student.name,
			status: "started",
			integrityScore: 100,
			progress: 0,
		},
	});

	sendSuccess(
		res,
		{ attempt, questions: (assessment.questions || []).map((q: any) => ({ ...q, correctAnswer: null })) },
		"Attempt started successfully",
		HTTP_STATUS.CREATED,
	);
}

/**
 * POST /api/assessments/attempts/:attemptId/progress
 * Body: { progress, integrityScore }
 */
export async function updateProgress(req: Request, res: Response): Promise<void> {
	const attemptId = getParamString(req.params.attemptId);
	const { progress, integrityScore } = req.body;

	const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
	if (!attempt) {
		throw new AppError("Attempt not found", HTTP_STATUS.NOT_FOUND);
	}

	const updated = await prisma.assessmentAttempt.update({
		where: { id: attemptId },
		data: {
			progress: progress !== undefined ? Number(progress) : attempt.progress,
			integrityScore: integrityScore !== undefined ? Number(integrityScore) : attempt.integrityScore,
		},
	});

	sendSuccess(res, updated, "Progress updated successfully", HTTP_STATUS.OK);
}

/**
 * POST /api/assessments/attempts/:attemptId/violation
 * Body: { type, severity, description }
 */
export async function logViolation(req: Request, res: Response): Promise<void> {
	const attemptId = getParamString(req.params.attemptId);
	const { type, severity, description } = req.body;

	const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
	if (!attempt) {
		throw new AppError("Attempt not found", HTTP_STATUS.NOT_FOUND);
	}

	const alert = await prisma.violationAlert.create({
		data: {
			attemptId,
			type,
			severity: severity || "medium",
			description: description || "Anomaly detected during webcam analysis",
		},
	});

	// Deduct integrity score based on violation severity
	let deduction = 5;
	if (severity === "high") deduction = 20;
	if (severity === "medium") deduction = 10;
	
	const newScore = Math.max(0, attempt.integrityScore - deduction);

	await prisma.assessmentAttempt.update({
		where: { id: attemptId },
		data: { integrityScore: newScore },
	});

	sendSuccess(res, alert, "Violation logged and integrity score adjusted", HTTP_STATUS.CREATED);
}

/**
 * POST /api/assessments/attempts/:attemptId/submit
 * Body: { answers: { questionId: string, response: string }[] }
 */
export async function submitAttempt(req: Request, res: Response): Promise<void> {
	const attemptId = getParamString(req.params.attemptId);
	const { answers } = req.body;

	const attempt = await prisma.assessmentAttempt.findUnique({
		where: { id: attemptId },
		include: { assessment: { include: { questions: true } } },
	}) as any;

	if (!attempt) {
		throw new AppError("Attempt not found", HTTP_STATUS.NOT_FOUND);
	}

	if (attempt.status !== "started") {
		throw new AppError("Attempt has already been submitted", HTTP_STATUS.BAD_REQUEST);
	}

	let totalScore = 0;
	let maxScore = 0;
	let hasLowConfidence = false;

	// Process each answer
	if (answers && Array.isArray(answers) && attempt.assessment?.questions) {
		const violations = await prisma.violationAlert.findMany({
			where: { attemptId }
		});

		for (const ans of answers) {
			const question = attempt.assessment.questions.find((q: any) => q.id === ans.questionId);
			if (!question) continue;

			maxScore += question.points;
			let aiGrade: number | null = null;
			let aiConfidence: number | null = null;
			let isFlagged = false;
			let aiEvaluationStr: string | null = null;
			let embeddingStr: string | null = null;

			if (question.type === "multiple-choice") {
				const isCorrect = question.correctAnswer?.trim().toLowerCase() === ans.response?.trim().toLowerCase();
				aiGrade = isCorrect ? question.points : 0;
				aiConfidence = 1.0;
				totalScore += aiGrade ?? 0;
				embeddingStr = JSON.stringify(await getEmbedding(ans.response || ""));
			} else if (question.type === "descriptive" || question.type === "coding") {
				// Run Orchestrator Evaluation
				const evalResult = await orchestrateEvaluation(
					question.text,
					question.correctAnswer || "",
					ans.response || "",
					question.points,
					violations,
					attempt.integrityScore
				);

				aiGrade = evalResult.scores.consolidated;
				aiConfidence = evalResult.scores.reliability;
				aiEvaluationStr = JSON.stringify(evalResult);
				embeddingStr = JSON.stringify(await getEmbedding(ans.response || ""));
				
				if (evalResult.scores.reliability < 0.75) {
					isFlagged = true;
					hasLowConfidence = true;
				}
				totalScore += aiGrade ?? 0;
			} else {
				// File Upload/Other
				aiGrade = null;
				aiConfidence = null;
				isFlagged = true;
				hasLowConfidence = true;
			}

			await prisma.answer.create({
				data: {
					attemptId,
					questionId: question.id,
					response: ans.response || "",
					aiGrade: aiGrade ?? null,
					aiConfidence: aiConfidence ?? null,
					isFlagged,
					aiEvaluation: aiEvaluationStr,
					embedding: embeddingStr,
					originalResponse: ans.response || ""
				},
			});
		}
	}

	// Update attempt details
	const finalScore = maxScore > 0 ? totalScore : null;
	const attemptStatus = hasLowConfidence ? "Faculty Review Required" : "submitted";

	await prisma.assessmentAttempt.update({
		where: { id: attemptId },
		data: {
			status: attemptStatus,
			score: finalScore,
			submittedAt: new Date(),
			progress: 100,
		},
	});

	sendSuccess(res, null, "Assessment submitted successfully", HTTP_STATUS.OK);
}

/**
 * GET /api/assessments/:id/attempts
 * Faculty only: fetches attempts for an assessment.
 */
export async function getAttempts(req: Request, res: Response): Promise<void> {
	const id = getParamString(req.params.id);
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	await checkFaculty(userId);

	const attempts = await prisma.assessmentAttempt.findMany({
		where: { assessmentId: id },
		include: {
			violations: true,
		},
		orderBy: { createdAt: "desc" },
	});

	sendSuccess(res, attempts, "Attempts retrieved successfully", HTTP_STATUS.OK);
}

/**
 * GET /api/assessments/attempts/:attemptId
 */
export async function getAttemptDetails(req: Request, res: Response): Promise<void> {
	const attemptId = getParamString(req.params.attemptId);
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	const attempt = await prisma.assessmentAttempt.findUnique({
		where: { id: attemptId },
		include: {
			assessment: { include: { questions: true } },
			answers: { include: { question: true } },
			violations: true,
		},
	});

	if (!attempt) {
		throw new AppError("Attempt not found", HTTP_STATUS.NOT_FOUND);
	}

	sendSuccess(res, attempt, "Attempt details retrieved successfully", HTTP_STATUS.OK);
}

/**
 * POST /api/assessments/attempts/:attemptId/evaluate
 * Body: { grades: { answerId: string, manualGrade: number, feedback: string }[] }
 */
export async function evaluateAttempt(req: Request, res: Response): Promise<void> {
	const attemptId = getParamString(req.params.attemptId);
	const { grades } = req.body;
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	const faculty = await checkFaculty(userId);

	const attempt = await prisma.assessmentAttempt.findUnique({
		where: { id: attemptId },
		include: { answers: true },
	}) as any;

	if (!attempt) {
		throw new AppError("Attempt not found", HTTP_STATUS.NOT_FOUND);
	}

	let newTotalScore = 0;

	if (grades && Array.isArray(grades) && attempt.answers) {
		for (const g of grades) {
			const ans = attempt.answers.find((a: any) => a.id === g.answerId);
			if (!ans) continue;

			const originalResponse = ans.originalResponse || ans.response;
			const overrideStatus = g.overrideStatus || (Number(g.manualGrade) === ans.aiGrade ? "accepted" : "modified");

			await prisma.answer.update({
				where: { id: ans.id },
				data: {
					manualGrade: Number(g.manualGrade),
					feedback: g.feedback || null,
					overrideStatus: overrideStatus,
					originalResponse: originalResponse
				},
			});

			newTotalScore += Number(g.manualGrade);

			// Extract similarity and risk results from aiEvaluation if present
			let similarityResults = "{}";
			let riskAnalysisResults = "{}";
			if (ans.aiEvaluation) {
				try {
					const evalObj = JSON.parse(ans.aiEvaluation);
					similarityResults = JSON.stringify(evalObj.reasoning || {});
					riskAnalysisResults = JSON.stringify(evalObj.risk || {});
				} catch (e) {}
			}

			// Add to IMMUTABLE audit trail
			await prisma.evaluationAuditTrail.create({
				data: {
					answerId: ans.id,
					modelUsed: "Groq Llama 3.1 + Ollama Llama 3.2",
					aiScore: ans.aiGrade || 0,
					confidenceScore: ans.aiConfidence || 0,
					facultyModifications: JSON.stringify({
						manualGrade: Number(g.manualGrade),
						feedback: g.feedback || null,
						previousManualGrade: ans.manualGrade
					}),
					originalAnswer: originalResponse,
					finalAnswerScore: Number(g.manualGrade),
					similarityResults,
					riskAnalysisResults,
					overrideStatus,
					facultyId: userId,
					facultyName: faculty.name
				}
			});
		}
	}

	// Update attempt status to graded
	const updated = await prisma.assessmentAttempt.update({
		where: { id: attemptId },
		data: {
			status: "graded",
			score: newTotalScore,
		},
	});

	sendSuccess(res, updated, "Evaluation submitted and audit trail recorded", HTTP_STATUS.OK);
}

/**
 * POST /api/assessments/attempts/:attemptId/re-evaluate
 */
export async function reEvaluateAttempt(req: Request, res: Response): Promise<void> {
	const attemptId = getParamString(req.params.attemptId);
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	await checkFaculty(userId);

	const attempt = await prisma.assessmentAttempt.findUnique({
		where: { id: attemptId },
		include: { 
			answers: { include: { question: true } },
			assessment: true
		},
	}) as any;

	if (!attempt) {
		throw new AppError("Attempt not found", HTTP_STATUS.NOT_FOUND);
	}

	const violations = await prisma.violationAlert.findMany({
		where: { attemptId }
	});

	let totalScore = 0;
	let hasLowConfidence = false;

	for (const ans of attempt.answers) {
		const question = ans.question;
		
		if (question.type === "multiple-choice") {
			const isCorrect = question.correctAnswer?.trim().toLowerCase() === ans.response?.trim().toLowerCase();
			const aiGrade = isCorrect ? question.points : 0;
			totalScore += aiGrade;
			
			await prisma.answer.update({
				where: { id: ans.id },
				data: {
					aiGrade,
					aiConfidence: 1.0,
					manualGrade: null,
					overrideStatus: "none"
				}
			});
		} else if (question.type === "descriptive" || question.type === "coding") {
			const evalResult = await orchestrateEvaluation(
				question.text,
				question.correctAnswer || "",
				ans.response || "",
				question.points,
				violations,
				attempt.integrityScore
			);

			const aiGrade = evalResult.scores.consolidated;
			const aiConfidence = evalResult.scores.reliability;
			const isFlagged = evalResult.scores.reliability < 0.75;
			
			if (isFlagged) {
				hasLowConfidence = true;
			}
			totalScore += aiGrade;

			await prisma.answer.update({
				where: { id: ans.id },
				data: {
					aiGrade,
					aiConfidence,
					isFlagged,
					aiEvaluation: JSON.stringify(evalResult),
					embedding: JSON.stringify(await getEmbedding(ans.response || "")),
					manualGrade: null,
					overrideStatus: "none"
				}
			});
		}
	}

	const attemptStatus = hasLowConfidence ? "Faculty Review Required" : "submitted";
	const updatedAttempt = await prisma.assessmentAttempt.update({
		where: { id: attemptId },
		data: {
			status: attemptStatus,
			score: totalScore
		},
		include: {
			answers: { include: { question: true } }
		}
	});

	sendSuccess(res, updatedAttempt, "Re-evaluation completed successfully", HTTP_STATUS.OK);
}

/**
 * GET /api/assessments/attempts/:attemptId/audit
 */
export async function getAttemptAuditTrail(req: Request, res: Response): Promise<void> {
	const attemptId = getParamString(req.params.attemptId);
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	await checkFaculty(userId);

	const attempt = await prisma.assessmentAttempt.findUnique({
		where: { id: attemptId },
		include: { answers: true }
	});

	if (!attempt) {
		throw new AppError("Attempt not found", HTTP_STATUS.NOT_FOUND);
	}

	const answerIds = attempt.answers.map(a => a.id);

	const auditTrails = await prisma.evaluationAuditTrail.findMany({
		where: { answerId: { in: answerIds } },
		orderBy: { timestamp: "desc" }
	});

	sendSuccess(res, auditTrails, "Audit trail retrieved successfully", HTTP_STATUS.OK);
}

/**
 * GET /api/assessments/:id/audit-trail
 */
export async function getAssessmentAuditTrail(req: Request, res: Response): Promise<void> {
	const assessmentId = getParamString(req.params.id);
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	await checkFaculty(userId);

	// Get all attempts for this assessment
	const attempts = await prisma.assessmentAttempt.findMany({
		where: { assessmentId },
		include: { answers: true }
	});

	const answerIds = attempts.flatMap(att => att.answers.map(ans => ans.id));

	const auditTrails = await prisma.evaluationAuditTrail.findMany({
		where: { answerId: { in: answerIds } },
		orderBy: { timestamp: "desc" }
	});

	sendSuccess(res, auditTrails, "Assessment audit trail retrieved successfully", HTTP_STATUS.OK);
}

/**
 * GET /api/assessments/:id/analytics
 */
export async function getAnalytics(req: Request, res: Response): Promise<void> {
	const id = getParamString(req.params.id);
	const userId = getHeaderString(req.headers["x-user-id"]);
	if (!userId) {
		throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
	}

	await checkFaculty(userId);

	const attempts = await prisma.assessmentAttempt.findMany({
		where: { assessmentId: id, status: { in: ["submitted", "graded", "Faculty Review Required"] } },
		include: { violations: true, answers: true },
	}) as any[];

	const assessment = await prisma.assessment.findUnique({
		where: { id },
		include: { questions: true },
	}) as any;

	if (!assessment) {
		throw new AppError("Assessment not found", HTTP_STATUS.NOT_FOUND);
	}

	const totalAttemptsCount = attempts.length;

	let totalScore = 0;
	let highestScore = 0;
	let lowestScore = 100;
	let totalIntegrity = 0;
	let totalViolations = 0;

	const scoreIntervals = { "0-50": 0, "50-70": 0, "70-90": 0, "90-100": 0 };
	const violationsByType: Record<string, number> = {};

	for (const att of attempts) {
		const score = att.score || 0;
		totalScore += score;
		if (score > highestScore) highestScore = score;
		if (score < lowestScore) lowestScore = score;

		totalIntegrity += att.integrityScore;
		totalViolations += (att.violations?.length || 0);

		// Score categorization
		const percentage = score;
		if (percentage < 50) scoreIntervals["0-50"]++;
		else if (percentage < 70) scoreIntervals["50-70"]++;
		else if (percentage < 90) scoreIntervals["70-90"]++;
		else scoreIntervals["90-100"]++;

		if (att.violations) {
			for (const v of att.violations) {
				violationsByType[v.type] = (violationsByType[v.type] || 0) + 1;
			}
		}
	}

	const averageScore = totalAttemptsCount > 0 ? Math.round((totalScore / totalAttemptsCount) * 10) / 10 : 0;
	const averageIntegrity = totalAttemptsCount > 0 ? Math.round(totalIntegrity / totalAttemptsCount) : 100;

	// Calculate learning outcome attainment and question difficulty analysis
	const questionStats = (assessment.questions || []).map((q: any) => {
		const answersForQuestion = attempts.flatMap((att) => (att.answers || []).filter((ans: any) => ans.questionId === q.id));
		const answersCount = answersForQuestion.length;
		const correctAnswersCount = answersForQuestion.filter((ans: any) => {
			const grade = ans.manualGrade !== null && ans.manualGrade !== undefined ? ans.manualGrade : (ans.aiGrade || 0);
			return grade >= q.points * 0.7;
		}).length;

		const successRate = answersCount > 0 ? Math.round((correctAnswersCount / answersCount) * 100) : 100;
		return {
			questionId: q.id,
			text: q.text,
			type: q.type,
			learningOutcome: q.learningOutcome || "General",
			successRate,
			difficulty: q.difficulty,
		};
	});

	const analyticsData = {
		totalAttempts: totalAttemptsCount,
		averageScore,
		highestScore: totalAttemptsCount > 0 ? highestScore : 0,
		lowestScore: totalAttemptsCount > 0 ? lowestScore : 0,
		averageIntegrity,
		totalViolations,
		scoreDistribution: Object.entries(scoreIntervals).map(([range, count]) => ({ range, count })),
		violationBreakdown: Object.entries(violationsByType).map(([type, count]) => ({ type, count })),
		questionStats,
	};

	sendSuccess(res, analyticsData, "Analytics retrieved successfully", HTTP_STATUS.OK);
}
