import { Router } from "express";
import passport from "../config/passport.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { credentialsLimiter, otpLimiter } from "../middleware/rateLimit";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  loginSchema,
  resendOtpSchema,
  signupSchema,
  verifyOtpSchema,
} from "../validators/auth.validators.js";
import * as authController from "../controllers/auth.controller";
import { handleOAuthCallback } from "../controllers/oauth.controller";

const router = Router();

router.post(
  "/signup",
  credentialsLimiter,
  validateBody(signupSchema),
  asyncHandler(authController.signup)
);

router.post(
  "/login",
  credentialsLimiter,
  validateBody(loginSchema),
  asyncHandler(authController.login)
);

router.post(
  "/otp/verify",
  otpLimiter,
  validateBody(verifyOtpSchema),
  asyncHandler(authController.verifyOtpAndLogin)
);

router.post(
  "/otp/resend",
  otpLimiter,
  validateBody(resendOtpSchema),
  asyncHandler(authController.resendOtp)
);

router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", authenticate, asyncHandler(authController.me));

// --- OAuth ---------------------------------------------------------------
// Only registered when the relevant env vars are set (see config/passport.ts).

router.get("/oauth/google", passport.authenticate("google", {
  session: false,
  scope: ["profile", "email"],
}));

router.get(
  "/oauth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/oauth/failure" }),
  asyncHandler(handleOAuthCallback)
);

router.get("/oauth/github", passport.authenticate("github", {
  session: false,
  scope: ["user:email"],
}));

router.get(
  "/oauth/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/api/auth/oauth/failure" }),
  asyncHandler(handleOAuthCallback)
);

router.get("/oauth/failure", (_req, res) => {
  res.status(401).json({ error: "OAuth sign-in failed." });
});

export default router;
