import type { Request, Response } from "express";

import { HTTP_STATUS } from "@/constants/http-status";
import { AppError } from "@/utils/app-error";
import { sendSuccess } from "@/utils/response";

import { forgotPasswordSchema, loginSchema, magicLinkSchema } from "../schemas/login-schema";

import {
	checkUserRegistration,
	getGoogleOAuthURL,
	loginWithEmailPassword,
	logout,
	requestPasswordReset,
	sendMagicLink,
	updateUserCredentials,
	verifyPasswordResetOtp,
} from "../services/authentication-service";

/**
 * GET /api/authentication/check-user
 * Query: ?email=...
 */
export async function checkUser(req: Request, res: Response): Promise<void> {
	const email = req.query.email as string;

	if (!email) {
		throw new AppError("Email is required", HTTP_STATUS.BAD_REQUEST);
	}

	const exists = await checkUserRegistration(email);

	sendSuccess(res, { exists }, exists ? "User found" : "User not found", HTTP_STATUS.OK);
}

/**
 * POST /api/authentication/login
 * Body: { email, password }
 */
export async function login(req: Request, res: Response): Promise<void> {
	const parsed = loginSchema.safeParse(req.body);

	if (!parsed.success) {
		throw new AppError(
			parsed.error.issues[0]?.message ?? "Validation failed",
			HTTP_STATUS.BAD_REQUEST,
		);
	}

	const ipAddress = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress;

	const userAgent = req.headers["user-agent"];

	const result = await loginWithEmailPassword(parsed.data, ipAddress, userAgent);

	// Set session token cookies for web clients
	const cookieOptions = {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax" as const,
		expires: result.session.expiresAt,
		path: "/",
	};

	res.cookie("session_token", result.session.token, cookieOptions);
	res.cookie("better-auth.session_token", result.session.token, cookieOptions);

	sendSuccess(res, result, "Login successful", HTTP_STATUS.OK);
}

/**
 * POST /api/authentication/forgot-password
 * Body: { email }
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
	const parsed = forgotPasswordSchema.safeParse(req.body);

	if (!parsed.success) {
		throw new AppError(
			parsed.error.issues[0]?.message ?? "Validation failed",
			HTTP_STATUS.BAD_REQUEST,
		);
	}

	let frontendOrigin = "http://localhost:5173";
	const referer = req.headers.referer || req.headers.origin;
	if (referer) {
		try {
			const parsedUrl = new URL(referer);
			if (parsedUrl.origin.includes("localhost") || parsedUrl.origin.includes("127.0.0.1")) {
				frontendOrigin = parsedUrl.origin;
			}
		} catch {
			// ignore
		}
	}

	await requestPasswordReset(parsed.data, frontendOrigin);

	// Always return 200 to prevent email enumeration
	sendSuccess(res, null, "If that email exists, a reset link has been sent.", HTTP_STATUS.OK);
}

/**
 * POST /api/authentication/verify-otp
 * Body: { email, otp }
 */
export async function verifyOtp(req: Request, res: Response): Promise<void> {
	const { email, otp } = req.body;

	if (!email || !otp) {
		throw new AppError("Email and OTP are required.", HTTP_STATUS.BAD_REQUEST);
	}

	const betterAuthToken = await verifyPasswordResetOtp(email, otp);

	sendSuccess(res, { token: betterAuthToken }, "OTP verified successfully", HTTP_STATUS.OK);
}

/**
 * POST /api/authentication/magic-link
 * Body: { email }
 */
export async function magicLink(req: Request, res: Response): Promise<void> {
	const parsed = magicLinkSchema.safeParse(req.body);

	if (!parsed.success) {
		throw new AppError(
			parsed.error.issues[0]?.message ?? "Validation failed",
			HTTP_STATUS.BAD_REQUEST,
		);
	}

	await sendMagicLink(parsed.data);

	sendSuccess(res, null, "If that email exists, a magic link has been sent.", HTTP_STATUS.OK);
}

/**
 * GET /api/authentication/google
 * Redirects to Google OAuth
 */
export async function googleOAuth(req: Request, res: Response): Promise<void> {
	let callbackURL = "http://localhost:5174";
	const referer = req.headers.referer;
	if (referer) {
		try {
			callbackURL = new URL(referer).origin;
		} catch {
			// ignore
		}
	}
	const url = await getGoogleOAuthURL(callbackURL);
	res.redirect(url);
}

/**
 * POST /api/authentication/logout
 * Requires Authorization: Bearer <token>
 * or session cookie
 */
export async function logoutUser(req: Request, res: Response): Promise<void> {
	const cookies: Record<string, string> = {};
	const cookieHeader = req.headers.cookie;
	if (cookieHeader) {
		for (const pair of cookieHeader.split(";")) {
			const [key, val] = pair.split("=");
			if (key && val) {
				cookies[key.trim()] = decodeURIComponent(val.trim());
			}
		}
	}

	const token =
		cookies.session_token ??
		cookies["better-auth.session_token"] ??
		cookies["better-auth.session-token"] ??
		req.headers.authorization?.replace("Bearer ", "");

	const clearOptions = {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax" as const,
		path: "/",
	};

	res.clearCookie("session_token", clearOptions);
	res.clearCookie("better-auth.session_token", clearOptions);
	res.clearCookie("better-auth.session-token", clearOptions);

	if (token) {
		try {
			await logout(token);
		} catch (err) {
			console.error("Error revoking session during logout:", err);
		}
	}

	sendSuccess(res, null, "Logged out successfully", HTTP_STATUS.OK);
}

/**
 * POST /api/authentication/link-credentials
 * Body: { email, institutionName, department, academicId }
 */
export async function linkCredentials(req: Request, res: Response): Promise<void> {
	const { email, institutionName, department, academicId, role } = req.body;

	if (!email || !institutionName || !department || !academicId) {
		throw new AppError("All fields are required.", HTTP_STATUS.BAD_REQUEST);
	}

	await updateUserCredentials(email, institutionName, department, academicId, role);

	sendSuccess(res, null, "Academic credentials linked successfully", HTTP_STATUS.OK);
}
