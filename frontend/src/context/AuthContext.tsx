import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { OAuthProvider, Role, User } from "../types/auth";
import {
  bootstrapSession,
  fetchCurrentUser,
  logoutOnServer,
  registerUser,
  requestPasswordLogin,
  resendOtp,
  startOAuth,
  verifyOtpAndLogin,
} from "../api";

// Access token lives in memory only, so there's no client-visible expiry to
// schedule against — this just pings /refresh periodically to mint a new one
// off the httpOnly refresh cookie before the access token goes stale.
const SILENT_REFRESH_INTERVAL_MS = 25 * 60 * 1000;

type LoginStage = "credentials" | "otp";
type AuthFlow = "login" | "signup";

interface PendingLogin {
  email: string;
}

interface AuthContextValue {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  loginStage: LoginStage;
  authFlow: AuthFlow;
  pendingLogin: PendingLogin | null;
  error: string | null;
  isSubmitting: boolean;

  submitCredentials: (email: string, password: string) => Promise<void>;
  submitSignup: (name: string, email: string, password: string) => Promise<void>;
  submitOtp: (code: string) => Promise<boolean>;
  resendCode: () => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => void;
  setUserFromOAuth: (user: User) => void;
  resetLoginFlow: () => void;
  logout: () => void;
  clearError: () => void;

  hasRole: (...roles: Role[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [loginStage, setLoginStage] = useState<LoginStage>("credentials");
  const [authFlow, setAuthFlow] = useState<AuthFlow>("login");
  const [pendingLogin, setPendingLogin] = useState<PendingLogin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount there's no access token yet (it's in-memory, wiped on reload),
  // only the httpOnly refresh cookie. So bootstrap via /refresh first to mint
  // one, then confirm identity via /me.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const refreshResult = await bootstrapSession();
      if (cancelled) return;

      if (!refreshResult.ok) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      const me = await fetchCurrentUser();
      if (cancelled) return;

      if (me.ok) {
        setUser(me.data.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    if (status !== "authenticated") return;

    refreshTimer.current = setInterval(async () => {
      const result = await bootstrapSession();
      if (!result.ok) {
        setUser(null);
        setStatus("unauthenticated");
      }
    }, SILENT_REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [status]);

  const clearError = useCallback(() => setError(null), []);

  const submitCredentials = useCallback(async (email: string, password: string) => {
    setIsSubmitting(true);
    setError(null);
    const result = await requestPasswordLogin(email, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAuthFlow("login");
    setPendingLogin({ email: result.data.otpSentTo });
    setLoginStage("otp");
  }, []);

  const submitSignup = useCallback(async (name: string, email: string, password: string) => {
    setIsSubmitting(true);
    setError(null);
    const result = await registerUser(name, email, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAuthFlow("signup");
    setPendingLogin({ email: result.data.otpSentTo });
    setLoginStage("otp");
  }, []);

  const submitOtp = useCallback(
    async (code: string) => {
      if (!pendingLogin) return false;
      setIsSubmitting(true);
      setError(null);
      const result = await verifyOtpAndLogin(pendingLogin.email, code);
      setIsSubmitting(false);

      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setUser(result.data.user);
      setStatus("authenticated");
      setLoginStage("credentials");
      setPendingLogin(null);
      return true;
    },
    [pendingLogin]
  );

  const resendCode = useCallback(async () => {
    if (!pendingLogin) return;
    setError(null);
    const result = await resendOtp(pendingLogin.email);
    if (!result.ok) {
      setError(result.error);
    }
  }, [pendingLogin]);

  const loginWithOAuth = useCallback((provider: OAuthProvider) => {
    setError(null);
    startOAuth(provider);
  }, []);

  // Called by the /oauth/callback page once it has stored the access token
  // and confirmed identity via /me — skips straight to authenticated.
  const setUserFromOAuth = useCallback((oauthUser: User) => {
    setUser(oauthUser);
    setStatus("authenticated");
  }, []);

  const resetLoginFlow = useCallback(() => {
    setLoginStage("credentials");
    setAuthFlow("login");
    setPendingLogin(null);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    void logoutOnServer();
    setUser(null);
    setStatus("unauthenticated");
    resetLoginFlow();
  }, [resetLoginFlow]);

  const hasRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      loginStage,
      authFlow,
      pendingLogin,
      error,
      isSubmitting,
      submitCredentials,
      submitSignup,
      submitOtp,
      resendCode,
      loginWithOAuth,
      setUserFromOAuth,
      resetLoginFlow,
      logout,
      clearError,
      hasRole,
    }),
    [
      user,
      status,
      loginStage,
      authFlow,
      pendingLogin,
      error,
      isSubmitting,
      submitCredentials,
      submitSignup,
      submitOtp,
      resendCode,
      loginWithOAuth,
      setUserFromOAuth,
      resetLoginFlow,
      logout,
      clearError,
      hasRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}