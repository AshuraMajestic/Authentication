export const ENDPOINTS = {
  auth: {
    signup: "/auth/signup",
    login: "/auth/login",
    otpVerify: "/auth/otp/verify",
    otpResend: "/auth/otp/resend",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
    oauth: (provider: "google" | "github") => `/auth/oauth/${provider}`,
  },
  admin: {
    users: "/admin/users",
    updateRole: (id: string) => `/admin/users/${id}/role`,
  },
};