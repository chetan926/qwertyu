import { auth } from "../providers/auth";
import { prisma } from "./prisma";

async function seedForFaculty(facultyUser: any, studentUser: any) {
	console.log(`Seeding assessments for user: ${facultyUser.email} (Role: ${facultyUser.role})`);

	// Published Assessment
	const assessment = await prisma.assessment.create({
		data: {
			title: `Data Structures & Algorithms Midterm`,
			description: "Midterm examination covering balanced trees, hashing, and sorting algorithms.",
			duration: 60,
			availabilityStart: new Date(Date.now() - 3600 * 1000), // started 1 hour ago
			availabilityEnd: new Date(Date.now() + 3600 * 24 * 1000), // ends in 24 hours
			attemptLimit: 1,
			gradingScheme: "points",
			institutionName: "SRM University AP",
			facultyName: facultyUser.name,
			facultyId: facultyUser.id,
			published: true,
			webcamMonitoring: true,
			microphoneAnalysis: true,
			browserLockdown: true,
			faceVerification: true,
			gazeTracking: true,
			tabSwitchDetection: true,
			behavioralAnalysis: true,
		},
	});

	// Draft Assessment
	const draftAssessment = await prisma.assessment.create({
		data: {
			title: `Advanced Compiler Design Quiz`,
			description: "Draft quiz on lexing, parsing, and code generation algorithms.",
			duration: 45,
			availabilityStart: null,
			availabilityEnd: null,
			attemptLimit: 2,
			gradingScheme: "points",
			institutionName: "SRM University AP",
			facultyName: facultyUser.name,
			facultyId: facultyUser.id,
			published: false,
			webcamMonitoring: true,
			microphoneAnalysis: false,
			browserLockdown: true,
			faceVerification: false,
			gazeTracking: false,
			tabSwitchDetection: true,
			behavioralAnalysis: false,
		},
	});

	// Questions
	const q1 = await prisma.question.create({
		data: {
			assessmentId: assessment.id,
			type: "multiple-choice",
			text: "What is the worst-case time complexity of searching in a Balanced Binary Search Tree (e.g. AVL Tree)?",
			options: JSON.stringify(["O(1)", "O(log n)", "O(n)", "O(n log n)"]),
			correctAnswer: "O(log n)",
			points: 5,
			difficulty: "medium",
			learningOutcome: "CLO-1",
		},
	});

	const q2 = await prisma.question.create({
		data: {
			assessmentId: assessment.id,
			type: "descriptive",
			text: "Explain the difference between a Hash Map and a Binary Search Tree. When would you prefer one over the other?",
			options: null,
			correctAnswer: "A Hash Map provides O(1) average time complexity for lookups, but does not keep elements sorted. A Binary Search Tree provides O(log n) lookups and keeps elements in sorted order.",
			points: 10,
			difficulty: "medium",
			learningOutcome: "CLO-2",
		},
	});

	const q3 = await prisma.question.create({
		data: {
			assessmentId: assessment.id,
			type: "coding",
			text: "Write a function in Python that takes a list of integers and returns the first duplicate element. If no duplicate exists, return None.",
			options: null,
			correctAnswer: "def find_duplicate(nums):\n    seen = set()\n    for num in nums:\n        if num in seen:\n            return num\n        seen.add(num)\n    return None",
			points: 15,
			difficulty: "hard",
			learningOutcome: "CLO-3",
		},
	});

	// Attempt 1: Graded Attempt
	const gradedAttempt = await prisma.assessmentAttempt.create({
		data: {
			assessmentId: assessment.id,
			studentId: studentUser.id,
			studentName: studentUser.name,
			status: "graded",
			score: 25,
			integrityScore: 92,
			progress: 100,
			startedAt: new Date(Date.now() - 7200 * 1000),
			submittedAt: new Date(Date.now() - 5400 * 1000),
		},
	});

	// Answers for Graded Attempt
	const a1 = await prisma.answer.create({
		data: {
			attemptId: gradedAttempt.id,
			questionId: q1.id,
			response: "O(log n)",
			aiGrade: 5,
			aiConfidence: 1.0,
			manualGrade: 5,
			feedback: "Correct answer.",
			isFlagged: false,
			overrideStatus: "accepted",
			originalResponse: "O(log n)",
		},
	});

	const a2 = await prisma.answer.create({
		data: {
			attemptId: gradedAttempt.id,
			questionId: q2.id,
			response: "Hash Map uses hash tables for O(1) average lookup, but elements are unsorted. BST is sorted and lookups take O(log n).",
			aiGrade: 8,
			aiConfidence: 0.9,
			manualGrade: 10,
			feedback: "Excellent explanation, full marks awarded.",
			isFlagged: false,
			overrideStatus: "modified",
			originalResponse: "Hash Map uses hash tables for O(1) average lookup, but elements are unsorted. BST is sorted and lookups take O(log n).",
			aiEvaluation: JSON.stringify({
				score: 8,
				confidence: 0.9,
				reasoning: "Correct comparison of time complexities."
			})
		},
	});

	const a3 = await prisma.answer.create({
		data: {
			attemptId: gradedAttempt.id,
			questionId: q3.id,
			response: "def find_duplicate(nums):\n    seen = set()\n    for n in nums:\n        if n in seen:\n            return n\n        seen.add(n)\n    return None",
			aiGrade: 15,
			aiConfidence: 0.98,
			manualGrade: 10,
			feedback: "Code is correct, minor penalty for duplicate check variables.",
			isFlagged: false,
			overrideStatus: "modified",
			originalResponse: "def find_duplicate(nums):\n    seen = set()\n    for n in nums:\n        if n in seen:\n            return n\n        seen.add(n)\n    return None",
			aiEvaluation: JSON.stringify({
				score: 15,
				confidence: 0.98,
				reasoning: "Fully correct and optimized solution."
			})
		},
	});

	// Violations for Graded Attempt
	await prisma.violationAlert.create({
		data: {
			attemptId: gradedAttempt.id,
			type: "tab-switch",
			timestamp: new Date(Date.now() - 6600 * 1000),
			severity: "medium",
			description: "Student switched tabs to background browser processes.",
		},
	});

	await prisma.violationAlert.create({
		data: {
			attemptId: gradedAttempt.id,
			type: "gaze-away",
			timestamp: new Date(Date.now() - 6000 * 1000),
			severity: "low",
			description: "Gaze direction deviation detected away from primary monitor screen.",
		},
	});

	// Compliance Audit Trails
	await prisma.evaluationAuditTrail.create({
		data: {
			answerId: a2.id,
			modelUsed: "Groq Llama 3.1 + Ollama Llama 3.2",
			aiScore: 8,
			confidenceScore: 0.9,
			facultyModifications: JSON.stringify({
				manualGrade: 10,
				feedback: "Excellent explanation, full marks awarded.",
				previousManualGrade: null
			}),
			originalAnswer: "Hash Map uses hash tables for O(1) average lookup, but elements are unsorted. BST is sorted and lookups take O(log n).",
			finalAnswerScore: 10,
			similarityResults: JSON.stringify({ semanticSimilarity: 0.88 }),
			riskAnalysisResults: JSON.stringify({ copyPasteDetected: false }),
			overrideStatus: "modified",
			facultyId: facultyUser.id,
			facultyName: facultyUser.name
		},
	});

	await prisma.evaluationAuditTrail.create({
		data: {
			answerId: a3.id,
			modelUsed: "Groq Llama 3.1 + Ollama Llama 3.2",
			aiScore: 15,
			confidenceScore: 0.98,
			facultyModifications: JSON.stringify({
				manualGrade: 10,
				feedback: "Code is correct, minor penalty for duplicate check variables.",
				previousManualGrade: null
			}),
			originalAnswer: "def find_duplicate(nums):\n    seen = set()\n    for n in nums:\n        if n in seen:\n            return n\n        seen.add(n)\n    return None",
			finalAnswerScore: 10,
			similarityResults: JSON.stringify({ semanticSimilarity: 0.99 }),
			riskAnalysisResults: JSON.stringify({ copyPasteDetected: false }),
			overrideStatus: "modified",
			facultyId: facultyUser.id,
			facultyName: facultyUser.name
		},
	});

	// Attempt 2: Submitted Attempt requiring review
	const submittedAttempt = await prisma.assessmentAttempt.create({
		data: {
			assessmentId: assessment.id,
			studentId: studentUser.id,
			studentName: studentUser.name,
			status: "Faculty Review Required",
			score: 15,
			integrityScore: 60,
			progress: 100,
			startedAt: new Date(Date.now() - 3600 * 1000),
			submittedAt: new Date(Date.now() - 1200 * 1000),
		},
	});

	await prisma.answer.create({
		data: {
			attemptId: submittedAttempt.id,
			questionId: q2.id,
			response: "A Hash Map is like a directory indexing lookup while BST keeps ordering. I would copy BST code from stackoverflow.",
			aiGrade: 3,
			aiConfidence: 0.4,
			manualGrade: null,
			feedback: null,
			isFlagged: true,
			overrideStatus: "none",
			originalResponse: "A Hash Map is like a directory indexing lookup while BST keeps ordering. I would copy BST code from stackoverflow.",
			aiEvaluation: JSON.stringify({
				score: 3,
				confidence: 0.4,
				reasoning: "Low similarity to reference solution."
			})
		},
	});

	await prisma.violationAlert.create({
		data: {
			attemptId: submittedAttempt.id,
			type: "multiple-faces",
			timestamp: new Date(Date.now() - 2400 * 1000),
			severity: "high",
			description: "Webcam analysis detected multiple faces in the video feed.",
		},
	});

	// Attempt 3: Active/started attempt (for proctoring tab)
	const startedAttempt = await prisma.assessmentAttempt.create({
		data: {
			assessmentId: assessment.id,
			studentId: studentUser.id,
			studentName: studentUser.name,
			status: "started",
			integrityScore: 90,
			progress: 45,
			startedAt: new Date(Date.now() - 600 * 1000),
		},
	});

	await prisma.violationAlert.create({
		data: {
			attemptId: startedAttempt.id,
			type: "no-face",
			timestamp: new Date(),
			severity: "medium",
			description: "Student is not detected in front of the webcam feed.",
		},
	});
}

async function seed() {
	try {
		console.log("--- Clearing Existing Database Data ---");
		await prisma.userLog.deleteMany({});
		await prisma.ticketMessage.deleteMany({});
		await prisma.supportTicket.deleteMany({});
		await prisma.evaluationAuditTrail.deleteMany({});
		await prisma.violationAlert.deleteMany({});
		await prisma.answer.deleteMany({});
		await prisma.assessmentAttempt.deleteMany({});
		await prisma.question.deleteMany({});
		await prisma.assessment.deleteMany({});
		await prisma.verification.deleteMany({});
		await prisma.account.deleteMany({});
		await prisma.session.deleteMany({});
		await prisma.user.deleteMany({});

		console.log("--- Seeding Users via Authentication Sign-up ---");

		// Seed Admin User
		const adminEmail = "neelampallicharanbalaji14@gmail.com";
		await auth.api.signUpEmail({
			body: {
				email: adminEmail,
				password: "Charan@123",
				name: "System Admin",
			},
		});
		const adminUser = await prisma.user.update({
			where: { email: adminEmail },
			data: {
				role: "admin",
				institutionName: "SRM University AP",
				department: "Computer Science & Engineering",
				academicId: "FAC-ADMIN",
				status: "active",
			},
		});
		console.log("Admin user seeded.");

		// Seed Student User
		const studentEmail = "student@srmap.edu.in";
		await auth.api.signUpEmail({
			body: {
				email: studentEmail,
				password: "Student@123",
				name: "Charan Student",
			},
		});
		const studentUser = await prisma.user.update({
			where: { email: studentEmail },
			data: {
				role: "user",
				institutionName: "SRM University AP",
				department: "Computer Science & Engineering",
				academicId: "STU-2026-081",
				status: "active",
			},
		});
		console.log("Student user seeded.");

		// Seed Faculty User
		const facultyEmail = "faculty@srmap.edu.in";
		await auth.api.signUpEmail({
			body: {
				email: facultyEmail,
				password: "Faculty@123",
				name: "Dr. Robert Chen",
			},
		});
		const facultyUser = await prisma.user.update({
			where: { email: facultyEmail },
			data: {
				role: "faculty",
				institutionName: "SRM University AP",
				department: "Computer Science & Engineering",
				academicId: "FAC-2026-102",
				status: "active",
			},
		});
		console.log("Faculty user seeded.");

		// Seed Support User
		const supportEmail = "support@support.com";
		// Pre-verify support email as required by the database hook
		await prisma.verification.create({
			data: {
				identifier: `verified-register-email:${supportEmail}`,
				value: "verified-code-token",
				expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
			},
		});
		await auth.api.signUpEmail({
			body: {
				email: supportEmail,
				password: "Support@123",
				name: "Alex Support",
			},
		});
		const supportUser = await prisma.user.update({
			where: { email: supportEmail },
			data: {
				role: "support",
				institutionName: "SRM University AP",
				department: "Technical Support",
				academicId: "SUP-2026-003",
				status: "active",
			},
		});
		console.log("Support agent user seeded.");

		console.log("--- Seeding Assessments & Attempts for Admin and Faculty ---");
		await seedForFaculty(facultyUser, studentUser);
		await seedForFaculty(adminUser, studentUser);

		console.log("--- Seeding Support Tickets ---");

		// Ticket 1: Pending ticket
		const ticket1 = await prisma.supportTicket.create({
			data: {
				referenceNumber: "TKT-3910",
				studentId: studentUser.id,
				studentName: studentUser.name,
				email: studentUser.email,
				category: "technical",
				priority: "high",
				department: "Technical Support",
				status: "pending",
				description: "My webcam verification fails at step 2 of identity clearance. I have a midterm starting in 30 minutes. Please help!",
				queuePosition: 1,
				estimatedWait: 4,
			},
		});

		await prisma.ticketMessage.create({
			data: {
				ticketId: ticket1.id,
				senderId: studentUser.id,
				senderName: studentUser.name,
				senderRole: "user",
				content: "I have tried reloading the page but the face recognition model still says loading camera stream.",
			},
		});

		await prisma.ticketMessage.create({
			data: {
				ticketId: ticket1.id,
				senderId: "system-ai",
				senderName: "IntegrityOS AI Support",
				senderRole: "ai",
				content: "Hello! I am the AI support assistant. I see you are having trouble with your webcam capture. Please ensure that browser permissions are granted for this domain. A support agent is also joining shortly.",
			},
		});

		// Ticket 2: Active chat ticket assigned to support agent
		const ticket2 = await prisma.supportTicket.create({
			data: {
				referenceNumber: "TKT-8210",
				studentId: studentUser.id,
				studentName: studentUser.name,
				email: studentUser.email,
				category: "integrity-clarifications",
				priority: "medium",
				department: "Academic Integrity Office",
				status: "active",
				description: "I received a gaze-away warning flag on my report, but my screen layout is ultra-wide. I would like to clarify this.",
				queuePosition: 0,
				estimatedWait: 0,
				assignedAgentId: supportUser.id,
				assignedAgentName: supportUser.name,
			},
		});

		await prisma.ticketMessage.create({
			data: {
				ticketId: ticket2.id,
				senderId: studentUser.id,
				senderName: studentUser.name,
				senderRole: "user",
				content: "Hello, I wanted to explain that because I have a 34-inch monitor, looking at my taskbar on the far right triggers the gaze warnings. I was not cheating.",
			},
		});

		await prisma.ticketMessage.create({
			data: {
				ticketId: ticket2.id,
				senderId: supportUser.id,
				senderName: supportUser.name,
				senderRole: "support",
				content: "Hello Charan. I understand. Let me check your screen coordinate offset calibration logs. I will make a note of this for the instructor's final evaluation.",
			},
		});

		// Ticket 3: Resolved ticket
		const ticket3 = await prisma.supportTicket.create({
			data: {
				referenceNumber: "TKT-4122",
				studentId: studentUser.id,
				studentName: studentUser.name,
				email: studentUser.email,
				category: "account-recovery",
				priority: "low",
				department: "Technical Support",
				status: "resolved",
				description: "Forgot password link was not arriving. Resolved when I checked spam folders.",
				queuePosition: 0,
				estimatedWait: 0,
				assignedAgentId: supportUser.id,
				assignedAgentName: supportUser.name,
				resolutionDetails: "User located email in spam folder and successfully updated credentials.",
			},
		});

		await prisma.ticketMessage.create({
			data: {
				ticketId: ticket3.id,
				senderId: studentUser.id,
				senderName: studentUser.name,
				senderRole: "user",
				content: "Nevermind, I found the reset link. It was filtered into junk mail. I successfully logged in now. Thanks!",
			},
		});

		console.log("Support tickets seeded.");

		console.log("--- Seeding User Audit Logs ---");

		await prisma.userLog.create({
			data: {
				userId: adminUser.id,
				action: "login",
				ipAddress: "192.168.1.100",
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
		});

		await prisma.userLog.create({
			data: {
				userId: studentUser.id,
				action: "register",
				ipAddress: "192.168.1.101",
				userAgent: "Chrome on macOS Catalina",
			},
		});

		await prisma.userLog.create({
			data: {
				userId: studentUser.id,
				action: "login",
				ipAddress: "192.168.1.101",
				userAgent: "Chrome on macOS Catalina",
			},
		});

		await prisma.userLog.create({
			data: {
				userId: facultyUser.id,
				action: "login",
				ipAddress: "192.168.1.102",
				userAgent: "Firefox on Windows 11",
			},
		});

		console.log("User audit logs seeded.");
		console.log("--- Seeding Successful! ---");
		process.exit(0);
	} catch (error) {
		console.error("Seed failed:", error);
		process.exit(1);
	}
}

seed();
