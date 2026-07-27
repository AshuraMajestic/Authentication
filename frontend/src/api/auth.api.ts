import type { ApiResult, User, OAuthProvider } from "../types/auth";
import { api } from "./client";
import { ENDPOINTS } from "./endpoints";
import { tokenStore } from "./tokenStore";

export async function requestPasswordLogin(email: string, password: string): Promise<ApiResult<{ otpSentTo: string }>> {
  return api.post(ENDPOINTS.auth.login, { email, password });
}

export async function registerUser(name: string, email: string, password: string): Promise<ApiResult<{ otpSentTo: string }>> {
  return api.post(ENDPOINTS.auth.signup, { name, email, password });
}

export async function verifyOtpAndLogin(email: string, code: string): Promise<ApiResult<{ user: User }>> {
  const result = await api.post<{ user: User; accessToken: string }>(ENDPOINTS.auth.otpVerify, { email, code });
  if (result.ok) {
    tokenStore.set(result.data.accessToken);
    return { ok: true, data: { user: result.data.user } };
  }
  return result;
}

export async function resendOtp(email: string): Promise<ApiResult<null>> {
  return api.post(ENDPOINTS.auth.otpResend, { email });
}

export async function fetchCurrentUser(): Promise<ApiResult<{ user: User }>> {
  return api.get(ENDPOINTS.auth.me);
}

// Called once on app load — uses the httpOnly refresh cookie to mint a fresh access token.
export async function bootstrapSession(): Promise<ApiResult<{ accessToken: string }>> {
  const result = await api.post<{ accessToken: string }>(ENDPOINTS.auth.refresh);
  if (result.ok) tokenStore.set(result.data.accessToken);
  return result;
}

export async function logoutOnServer(): Promise<ApiResult<null>> {
  const result = await api.post<null>(ENDPOINTS.auth.logout);
  tokenStore.set(null);
  return result;
}

export function startOAuth(provider: OAuthProvider) {
  window.location.href = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000/api"}${ENDPOINTS.auth.oauth(provider)}`;
}

// Called by the /oauth/callback page with the token from the URL.
export function completeOAuthLogin(accessToken: string) {
  tokenStore.set(accessToken);
}