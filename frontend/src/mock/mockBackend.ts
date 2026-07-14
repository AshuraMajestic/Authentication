import type { ApiResult, AuthTokens, OAuthProvider, Role, User } from "../types/auth";



const NETWORK_DELAY_MS = 650;

const delay = <T,>(value: T, ms = NETWORK_DELAY_MS): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

interface FakeUserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  avatarInitials: string;
}

// Seed "database" — try these in the demo. `let` so signups can append to it.
let FAKE_USERS: FakeUserRecord[] = [
  {
    id: "u_admin_01",
    name: "Asha Rao",
    email: "admin@demo.com",
    password: "Admin@123",
    role: "admin",
    avatarInitials: "AR",
  },
  {
    id: "u_manager_01",
    name: "Vikram Shah",
    email: "manager@demo.com",
    password: "Manager@123",
    role: "manager",
    avatarInitials: "VS",
  },
  {
    id: "u_user_01",
    name: "Priya Nair",
    email: "user@demo.com",
    password: "User@123",
    role: "user",
    avatarInitials: "PN",
  },
];

const otpStore = new Map<string, { code: string; expiresAt: number }>();

function makeTokens(userId: string, role: Role): AuthTokens {
  const header = btoa(JSON.stringify({ alg: "mock", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({ sub: userId, role, iat: Date.now() })
  );
  return {
    accessToken: `${header}.${payload}.mock-signature`,
    refreshToken: `refresh_${userId}_${Math.random().toString(36).slice(2)}`,
    expiresAt: Date.now() + 1000 * 60 * 30, // 30 min
  };
}

function toPublicUser(record: FakeUserRecord, provider: User["provider"]): User {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    avatarInitials: record.avatarInitials,
    provider,
  };
}

function dispatchOtp(email: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(email.toLowerCase(), { code, expiresAt: Date.now() + 1000 * 60 * 5 });
  return code;
}

function findByEmail(email: string) {
  return FAKE_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase() || "??";
}

export async function requestPasswordLogin(
  email: string,
  password: string
): Promise<ApiResult<{ otpSentTo: string; devOtpHint: string }>> {
  const record = findByEmail(email);

  if (!record) {
    return delay({
      ok: false,
      error: "No account with that email yet. Create one instead?",
    });
  }
  if (record.password !== password) {
    return delay({ ok: false, error: "Incorrect password." });
  }

  const code = dispatchOtp(record.email);
  return delay({
    ok: true,
    data: { otpSentTo: record.email, devOtpHint: code },
  });
}


export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<ApiResult<{ otpSentTo: string; devOtpHint: string }>> {
  if (findByEmail(email)) {
    return delay({
      ok: false,
      error: "An account with that email already exists. Try signing in instead.",
    });
  }
  if (password.length < 8) {
    return delay({ ok: false, error: "Password must be at least 8 characters." });
  }

  const record: FakeUserRecord = {
    id: `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    email: email.trim(),
    password,
    role: "user",
    avatarInitials: initials(name),
  };
  FAKE_USERS = [...FAKE_USERS, record];

  const code = dispatchOtp(record.email);
  return delay({ ok: true, data: { otpSentTo: record.email, devOtpHint: code } });
}

export async function verifyOtpAndLogin(
  email: string,
  code: string
): Promise<ApiResult<{ user: User; tokens: AuthTokens }>> {
  const entry = otpStore.get(email.trim().toLowerCase());
  const record = findByEmail(email);

  if (!entry || !record) {
    return delay({ ok: false, error: "No OTP request found. Start again." });
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return delay({ ok: false, error: "This code expired. Request a new one." });
  }
  if (entry.code !== code.trim()) {
    return delay({ ok: false, error: "That code doesn't match." });
  }

  otpStore.delete(email);
  return delay({
    ok: true,
    data: { user: toPublicUser(record, "password"), tokens: makeTokens(record.id, record.role) },
  });
}

export async function resendOtp(
  email: string
): Promise<ApiResult<{ devOtpHint: string }>> {
  const record = findByEmail(email);
  if (!record) return delay({ ok: false, error: "Unknown account." });
  return delay({ ok: true, data: { devOtpHint: dispatchOtp(record.email) } });
}

export async function signInWithOAuth(
  provider: OAuthProvider
): Promise<ApiResult<{ user: User; tokens: AuthTokens }>> {
  const record = FAKE_USERS[1];
  return delay(
    {
      ok: true,
      data: {
        user: toPublicUser(record, provider),
        tokens: makeTokens(record.id, record.role),
      },
    },
    1000
  );
}

export async function refreshSession(
  refreshToken: string,
  currentUserId: string
): Promise<ApiResult<{ tokens: AuthTokens }>> {
  if (!refreshToken.startsWith("refresh_")) {
    return delay({ ok: false, error: "Malformed refresh token." });
  }
  const record = FAKE_USERS.find((u) => u.id === currentUserId);
  if (!record) return delay({ ok: false, error: "Session no longer valid." });
  return delay({ ok: true, data: { tokens: makeTokens(record.id, record.role) } }, 300);
}

export async function logoutOnServer(): Promise<ApiResult<null>> {
  return delay({ ok: true, data: null }, 250);
}

export const DEMO_ACCOUNTS = FAKE_USERS.map(({ email, password, role }) => ({
  email,
  password,
  role,
}));

export const PROMOTABLE_ROLES = ["user", "manager"] as const;
export type PromotableRole = (typeof PROMOTABLE_ROLES)[number];

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function listUsers(): Promise<ApiResult<DirectoryUser[]>> {
  return delay(
    { ok: true, data: FAKE_USERS.map(({ password: _password, ...rest }) => rest) },
    400
  );
}

export async function updateUserRole(
  userId: string,
  nextRole: PromotableRole
): Promise<ApiResult<DirectoryUser>> {
  if (!PROMOTABLE_ROLES.includes(nextRole)) {
    return delay({
      ok: false,
      error: "The admin role can only be granted directly in the database.",
    });
  }
  const record = FAKE_USERS.find((u) => u.id === userId);
  if (!record) return delay({ ok: false, error: "User not found." });
  if (record.role === "admin") {
    return delay({ ok: false, error: "Admin accounts can't be changed from the UI." });
  }

  record.role = nextRole;
  const { password: _password, ...publicUser } = record;
  return delay({ ok: true, data: publicUser }, 400);
}
