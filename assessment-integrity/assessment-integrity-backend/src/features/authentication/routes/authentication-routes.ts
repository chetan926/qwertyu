import { type IRouter, Router } from "express";
import {
	checkUser,
	forgotPassword,
	googleOAuth,
	linkCredentials,
	login,
	logoutUser,
	magicLink,
	verifyOtp,
} from "../controllers/authentication-controller";

/**
 * Authentication Routes — /api/authentication
 *
 * NOTE ON GOOGLE OAUTH:
 * Better Auth automatically handles:
 *   GET  /api/auth/signin/google       → redirects to Google
 *   GET  /api/auth/callback/google     → exchanges code, creates session
 * These are already mounted in app.ts via `toNodeHandler(auth)`.
 *
 * The GET /api/authentication/google route below is a convenience alias
 * that simply redirects to the Better Auth Google signin URL.
 *
 * NOTE ON MAGIC LINK:
 * To enable magic links, add the magicLink plugin to src/auth/auth.ts:
 *   import { magicLink } from "better-auth/plugins";
 *   plugins: [openAPI(), magicLink({ sendMagicLink: async ({ email, url }) => { ... } })]
 *
 * NOTE ON FORGOT PASSWORD:
 * Better Auth's forgetPassword requires an email sender configured.
 * Add emailAndPassword.sendResetPassword to auth.ts:
 *   emailAndPassword: {
 *     enabled: true,
 *     sendResetPassword: async ({ user, url }) => { ... }
 *   }
 */

const router: IRouter = Router();

// GET /api/authentication/check-user
router.get("/check-user", checkUser);

// POST /api/authentication/login
router.post("/login", login);

// POST /api/authentication/forgot-password
router.post("/forgot-password", forgotPassword);

// POST /api/authentication/verify-otp
router.post("/verify-otp", verifyOtp);

// POST /api/authentication/magic-link
router.post("/magic-link", magicLink);

// GET  /api/authentication/google  (convenience redirect)
router.get("/google", googleOAuth);

// POST /api/authentication/link-credentials
router.post("/link-credentials", linkCredentials);

// POST /api/authentication/logout
router.post("/logout", logoutUser);

export { router as authenticationRouter };
