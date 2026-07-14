export type Role = "admin" | "manager" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarInitials: string;
  provider: "password" | "google" | "github";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

export interface Session {
  user: User;
  tokens: AuthTokens;
}

export type OAuthProvider = "google" | "github";

/** Discriminated result type so callers must handle both branches. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
