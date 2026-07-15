import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { Otp } from "../models/Otp";
import { ApiError } from "./ApiError";

function generateCode(): string {
  // crypto.randomInt is not modulo-biased, unlike Math.random().
  return crypto.randomInt(100000, 1000000).toString();
}

/** Creates (or replaces) the pending OTP for an email + purpose, returns the plaintext code to send. */
export async function createOtp(email: string, purpose: "login" | "signup"): Promise<string> {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

  await Otp.deleteMany({ email: email.toLowerCase(), purpose, consumedAt: null });
  await Otp.create({ email: email.toLowerCase(), purpose, codeHash, expiresAt });

  return code;
}

/** Returns which purpose ("login" | "signup") currently has a pending, unconsumed code for this email, if any. */
export async function getPendingOtpPurpose(
  email: string
): Promise<"login" | "signup" | null> {
  const record = await Otp.findOne({
    email: email.toLowerCase(),
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  return (record?.purpose as "login" | "signup" | undefined) ?? null;
}
export async function verifyOtp(
  email: string,
  purpose: "login" | "signup",
  submittedCode: string
): Promise<void> {
  const record = await Otp.findOne({
    email: email.toLowerCase(),
    purpose,
    consumedAt: null,
  }).sort({ createdAt: -1 });

  if (!record) {
    throw ApiError.badRequest("No pending code for this email. Start again.");
  }
  if (record.expiresAt < new Date()) {
    throw ApiError.badRequest("This code expired. Request a new one.");
  }
  if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw ApiError.badRequest("Too many incorrect attempts. Request a new code.");
  }

  const matches = await bcrypt.compare(submittedCode.trim(), record.codeHash);
  if (!matches) {
    record.attempts += 1;
    await record.save();
    throw ApiError.badRequest("That code doesn't match.");
  }

  record.consumedAt = new Date();
  await record.save();
}
