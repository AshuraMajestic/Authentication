import type { CookieOptions, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { env, isProd } from "../config/env.js";
import { User, initialsFromName, toPublicUser } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { createOtp, getPendingOtpPurpose, verifyOtp } from "../utils/otp.js";
import { canEchoOtpInResponse, sendOtpEmail } from "../utils/mailer";
import {
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from "../utils/tokens.js";

const REFRESH_COOKIE_NAME = "sg_refresh";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  domain: env.COOKIE_DOMAIN,
  path: "/api/auth",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

async function respondWithSession(res: Response, userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized("Session no longer valid.");

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user.id as string);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
  res.json({ user: toPublicUser(user), accessToken });
}

/** POST /api/auth/signup — creates the account (role: "user"), sends an OTP. Does NOT log in yet. */
export async function signup(req: Request, res: Response) {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict("An account with that email already exists. Try signing in instead.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    name,
    email,
    passwordHash,
    role: "user", // new accounts always start here
    provider: "password",
    avatarInitials: initialsFromName(name),
  });

  const code = await createOtp(email, "signup");
  await sendOtpEmail(email, code, "signup");

  res.status(200).json({
    otpSentTo: email,
    ...(canEchoOtpInResponse() ? { devOtpHint: code } : {}),
  });
}

/** POST /api/auth/login — step 1: verify credentials, dispatch OTP. Does NOT log in yet. */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.passwordHash) {
    throw ApiError.badRequest("No account with that email yet. Create one instead?");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw ApiError.badRequest("Incorrect password.");
  }

  const code = await createOtp(email, "login");
  await sendOtpEmail(email, code, "login");

  res.status(200).json({
    otpSentTo: email,
    ...(canEchoOtpInResponse() ? { devOtpHint: code } : {}),
  });
}

/** POST /api/auth/otp/verify — step 2: confirm the code, issue the session. Used by both login and signup. */
export async function verifyOtpAndLogin(req: Request, res: Response) {
  const { email, code } = req.body as { email: string; code: string };

  const user = await User.findOne({ email });
  if (!user) throw ApiError.badRequest("No account with that email.");

  const purpose = await getPendingOtpPurpose(email);
  if (!purpose) throw ApiError.badRequest("No pending code for this email. Start again.");

  await verifyOtp(email, purpose, code);

  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    await user.save();
  }

  await respondWithSession(res, user.id as string);
}

/** POST /api/auth/otp/resend */
export async function resendOtp(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  const user = await User.findOne({ email });
  if (!user) throw ApiError.badRequest("Unknown account.");

  const purpose = (await getPendingOtpPurpose(email)) ?? (user.isEmailVerified ? "login" : "signup");
  const code = await createOtp(email, purpose);
  await sendOtpEmail(email, code, purpose);

  res.status(200).json({
    ...(canEchoOtpInResponse() ? { devOtpHint: code } : {}),
  });
}

/** POST /api/auth/refresh — rotates the refresh token (from httpOnly cookie) and mints a new access token. */
export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!token) throw ApiError.unauthorized("No refresh token.");

  const rotated = await rotateRefreshToken(token);
  if (!rotated) {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
    throw ApiError.unauthorized("Session expired. Please sign in again.");
  }

  const user = await User.findById(rotated.userId);
  if (!user) throw ApiError.unauthorized("Session no longer valid.");

  res.cookie(REFRESH_COOKIE_NAME, rotated.newRawToken, refreshCookieOptions);
  res.json({ accessToken: signAccessToken(user) });
}

/** POST /api/auth/logout */
export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (token) await revokeRefreshToken(token);
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
  res.status(204).send();
}

/** GET /api/auth/me — protected, returns the caller's own profile. */
export async function me(req: Request, res: Response) {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw ApiError.unauthorized();
  res.json({ user: toPublicUser(user) });
}

export const REFRESH_COOKIE = REFRESH_COOKIE_NAME;
export const refreshCookieConfig = refreshCookieOptions;
export { respondWithSession };
