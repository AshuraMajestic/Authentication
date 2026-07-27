import type { ApiResult, User, OAuthProvider } from "../types/auth";
import { api } from "./client";
import { ENDPOINTS } from "./endpoints";

export async function requestPasswordLogin(
  email: string,
  password: string
): Promise<ApiResult<{ otpSentTo: string }>> {
  return api.post(ENDPOINTS.auth.login, { email, password });
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<ApiResult<{ otpSentTo: string }>> {
  return api.post(ENDPOINTS.auth.signup, { name, email, password });
}

export async function verifyOtpAndLogin(
  email: string,
  code: string
): Promise<ApiResult<{ user: User }>> {
  return api.post(ENDPOINTS.auth.otpVerify, { email, code });
}

export async function resendOtp(email: string): Promise<ApiResult<null>> {
  return api.post(ENDPOINTS.auth.otpResend, { email });
}

export async function fetchCurrentUser(): Promise<ApiResult<{ user: User }>> {
  return api.get(ENDPOINTS.auth.me);
}

export async function refreshSession(): Promise<ApiResult<null>> {
  return api.post(ENDPOINTS.auth.refresh);
}

export async function logoutOnServer(): Promise<ApiResult<null>> {
  return api.post(ENDPOINTS.auth.logout);
}

export function startOAuth(provider: OAuthProvider) {
  window.location.href = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000/api"}${ENDPOINTS.auth.oauth(provider)}`;
}