import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { RefreshToken } from "../models/RefreshToken";
import type { UserDoc } from "../models/User";

export interface AccessTokenPayload {
  sub: string;
  role: string;
}

export function signAccessToken(user: UserDoc): string {
  const payload: AccessTokenPayload = { sub: user.id as string, role: user.role };
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function generateRawRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}


export async function issueRefreshToken(userId: string): Promise<string> {
  const raw = generateRawRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(raw),
    expiresAt,
  });

  return raw;
}


export async function rotateRefreshToken(
  rawToken: string
): Promise<{ userId: string; newRawToken: string } | null> {
  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return null;
  }

  const newRaw = generateRawRefreshToken();
  const newHash = hashToken(newRaw);

  existing.revokedAt = new Date();
  existing.replacedByTokenHash = newHash;
  await existing.save();

  await RefreshToken.create({
    user: existing.user,
    tokenHash: newHash,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  return { userId: existing.user.toString(), newRawToken: newRaw };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken) },
    { $set: { revokedAt: new Date() } }
  );
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}
