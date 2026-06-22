import { prisma } from "./database";
import { auth } from "./providers/auth";

async function verify() {
	try {
		console.log("--- Verifying Database Seed Data ---");
		
		const users = await prisma.user.findMany();
		console.log(`Users in DB: ${users.length}`);
		for (const u of users) {
			console.log(` - Email: ${u.email}, Role: ${u.role}, Institution: ${u.institutionName}`);
		}

		const assessments = await prisma.assessment.findMany();
		console.log(`Assessments: ${assessments.length}`);

		const questions = await prisma.question.findMany();
		console.log(`Questions: ${questions.length}`);

		const attempts = await prisma.assessmentAttempt.findMany();
		console.log(`AssessmentAttempts: ${attempts.length}`);

		const answers = await prisma.answer.findMany();
		console.log(`Answers: ${answers.length}`);

		const violations = await prisma.violationAlert.findMany();
		console.log(`ViolationAlerts: ${violations.length}`);

		const auditTrails = await prisma.evaluationAuditTrail.findMany();
		console.log(`EvaluationAuditTrails: ${auditTrails.length}`);

		const tickets = await prisma.supportTicket.findMany();
		console.log(`SupportTickets: ${tickets.length}`);

		const messages = await prisma.ticketMessage.findMany();
		console.log(`TicketMessages: ${messages.length}`);

		const logs = await prisma.userLog.findMany();
		console.log(`UserLogs: ${logs.length}`);

		console.log("\n--- Testing Sign In Credentials ---");

		const testAccounts = [
			{ email: "neelampallicharanbalaji14@gmail.com", pass: "Charan@123", role: "admin" },
			{ email: "student@srmap.edu.in", pass: "Student@123", role: "student" },
			{ email: "faculty@srmap.edu.in", pass: "Faculty@123", role: "faculty" },
			{ email: "support@support.com", pass: "Support@123", role: "support" }
		];

		for (const acc of testAccounts) {
			try {
				const res = await auth.api.signInEmail({
					body: {
						email: acc.email,
						password: acc.pass
					}
				});
				console.log(`✔ Sign In Success for ${acc.role} (${acc.email})`);
			} catch (err: any) {
				console.error(`❌ Sign In Failed for ${acc.role} (${acc.email}):`, err.message || err);
			}
		}

		process.exit(0);
	} catch (error) {
		console.error("Verification failed:", error);
		process.exit(1);
	}
}

verify();
