import type { ApiResult, AuthTokens, OAuthProvider, Role, User } from "../types/auth";

/**
 * ---------------------------------------------------------------------------
 * MOCK BACKEND
 * ---------------------------------------------------------------------------
 * Everything in this file stands in for a real server. In a real app this
 * whole module is deleted and replaced with `fetch("/api/...")` calls to
 * your actual backend. Nothing outside this file should know or care that
 * the "backend" here is fake — the function signatures and ApiResult<T>
 * shape are what a real API client would also expose.
 * ---------------------------------------------------------------------------
 */

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

// Seed "database" — try these in the demo.
const FAKE_USERS: FakeUserRecord[] = [
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
    expiresAt: Date.now() + 1000 * 60 * 30, 
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

export async function requestPasswordLogin(
  email: string,
  password: string
): Promise<ApiResult<{ otpSentTo: string; devOtpHint: string }>> {
  const record = FAKE_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );

  if (!record || record.password !== password) {
    return delay({ ok: false, error: "Invalid email or password." });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(record.email, { code, expiresAt: Date.now() + 1000 * 60 * 5 });

  return delay({
    ok: true,
    data: { otpSentTo: record.email, devOtpHint: code },
  });
}

export async function verifyOtpAndLogin(
  email: string,
  code: string
): Promise<ApiResult<{ user: User; tokens: AuthTokens }>> {
  const entry = otpStore.get(email.trim().toLowerCase());
  const record = FAKE_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );

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
  const record = FAKE_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (!record) return delay({ ok: false, error: "Unknown account." });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(record.email, { code, expiresAt: Date.now() + 1000 * 60 * 5 });
  return delay({ ok: true, data: { devOtpHint: code } });
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
