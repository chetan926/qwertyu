import { prisma } from "@/database";
import { auth } from "@/providers/auth";
import { AppError } from "@/utils/app-error";
import type {
	ForgotPasswordPayload,
	LoginPayload,
	LoginResult,
	MagicLinkPayload,
} from "../types/authentication.types";

/**
 * Check if a user exists by email
 */
export async function checkUserRegistration(email: string): Promise<boolean> {
	const user = await prisma.user.findUnique({
		where: { email: email.toLowerCase() },
	});
	return !!user;
}

/**
 * Email + Password Login
 *
 * Delegates to Better Auth's built-in signInEmailPassword.
 * Better Auth validates credentials against the `accounts` table
 * (hashed password stored in Account.password).
 */
export async function loginWithEmailPassword(
	payload: LoginPayload,
	ipAddress?: string,
	userAgent?: string,
): Promise<LoginResult> {
	const result = await auth.api.signInEmail({
		body: {
			email: payload.email,
			password: payload.password,
		},
		headers: {
			"x-forwarded-for": ipAddress ?? "",
			"user-agent": userAgent ?? "",
		},
	});

	if (!result?.user || !result.token) {
		throw new AppError("Invalid email or password", 401);
	}

	let finalRole = (result.user as any).role;
	if (payload.role) {
		const emailLower = payload.email.toLowerCase();
		let targetRole = payload.role;
		if (emailLower === "neelampallicharanbalaji14@gmail.com") {
			targetRole = "admin";
		} else if (emailLower.endsWith("@support.com")) {
			targetRole = "support";
		} else if (targetRole !== "user" && targetRole !== "faculty") {
			targetRole = "user";
		}

		const dbUser = await prisma.user.findUnique({
			where: { id: result.user.id },
		});
		if (dbUser && dbUser.role !== targetRole) {
			await prisma.user.update({
				where: { id: dbUser.id },
				data: { role: targetRole },
			});
			finalRole = targetRole;
		} else if (dbUser) {
			finalRole = dbUser.role;
		}
	}

	return {
		user: {
			id: result.user.id,
			name: result.user.name,
			email: result.user.email,
			emailVerified: result.user.emailVerified,
			image: result.user.image ?? null,
			role: finalRole,
			status: (result.user as any).status,
			suspendedUntil: (result.user as any).suspendedUntil,
			institutionName: (result.user as any).institutionName,
			department: (result.user as any).department,
			academicId: (result.user as any).academicId,
			createdAt: result.user.createdAt,
			updatedAt: result.user.updatedAt,
		},
		session: {
			token: result.token,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days fallback
		},
	};
}

/**
 * Forgot Password
 *
 * Triggers Better Auth's built-in password reset flow.
 * Better Auth will send a reset email using its configured mailer.
 * Always returns success to avoid email enumeration.
 */
export async function requestPasswordReset(
	payload: ForgotPasswordPayload,
	frontendOrigin?: string,
): Promise<void> {
	try {
		const origin = frontendOrigin || "http://localhost:5173";
		await auth.api.requestPasswordReset({
			body: {
				email: payload.email,
				redirectTo: `${origin}`,
			},
		});
	} catch (err) {
		console.error("[Auth Service] requestPasswordReset failed:", err);
		// Swallow errors intentionally — never reveal if email exists to API caller
	}
}

/**
 * Magic Link (Email me a magic link)
 *
 * NOTE: Better Auth's magicLink plugin must be added to auth.ts plugins
 * for this to work. See comment in authentication-routes.ts.
 * Kept here as a stub so the route is wired up and ready.
 */
export async function sendMagicLink(payload: MagicLinkPayload): Promise<void> {
	try {
		// @ts-expect-error — magicLink is optional; add plugin to auth.ts to activate
		await auth.api.signInMagicLink({
			body: {
				email: payload.email,
				callbackURL: `${process.env.BETTER_AUTH_URL}/dashboard`,
			},
		});
	} catch {
		// Swallow errors — never reveal if email exists
	}
}

export async function getGoogleOAuthURL(callbackURL?: string): Promise<string> {
	const cb = callbackURL || "http://localhost:5174";
	const result = await auth.api.signInSocial({
		body: {
			provider: "google",
			callbackURL: cb,
		},
	});
	if (!result?.url) {
		throw new AppError("Failed to generate Google OAuth URL", 500);
	}
	return result.url;
}

/**
 * Logout
 *
 * Revokes the current session token in the `sessions` table.
 */
export async function logout(sessionToken: string): Promise<void> {
	await auth.api.signOut({
		headers: {
			authorization: `Bearer ${sessionToken}`,
		},
	});
}

/**
 * Verify Password Reset OTP
 */
export async function verifyPasswordResetOtp(email: string, otp: string): Promise<string> {
	const emailLower = email.toLowerCase();
	console.log(`[OTP Verification] Checking OTP for email: ${emailLower}, code: ${otp}`);

	const record = await prisma.verification.findFirst({
		where: {
			identifier: `otp:${emailLower}`,
		},
	});

	if (!record) {
		console.log(
			`[OTP Verification] No verification record found for identifier: otp:${emailLower}`,
		);
		throw new AppError("Invalid or expired OTP code.", 400);
	}

	console.log(
		`[OTP Verification] Found record: identifier=${record.identifier}, value=${record.value}, expiresAt=${record.expiresAt.toISOString()}, now=${new Date().toISOString()}`,
	);

	if (record.expiresAt.getTime() <= Date.now()) {
		console.log(`[OTP Verification] OTP record has expired!`);
		throw new AppError("Invalid or expired OTP code.", 400);
	}

	const [storedOtp, betterAuthToken] = record.value.split(":");
	console.log(`[OTP Verification] Comparing storedOtp=${storedOtp} with inputOtp=${otp}`);
	if (!storedOtp || !betterAuthToken || storedOtp !== otp) {
		console.log(`[OTP Verification] OTP mismatch or parsing failed!`);
		throw new AppError("Invalid OTP code.", 400);
	}

	// Clean up verification record after single successful use
	await prisma.verification.delete({
		where: { id: record.id },
	});

	console.log(`[OTP Verification] Success! Returning token.`);
	return betterAuthToken;
}

/**
 * Update academic credentials for a user
 */
export async function updateUserCredentials(
	email: string,
	institutionName: string,
	department: string,
	academicId: string,
	role?: string,
): Promise<void> {
	const emailLower = email.toLowerCase();
	const user = await prisma.user.findUnique({
		where: { email: emailLower },
	});

	if (!user) {
		throw new AppError("User not found.", 404);
	}

	await prisma.user.update({
		where: { email: emailLower },
		data: {
			institutionName,
			department,
			academicId,
			role: role || user.role,
		},
	});
}
