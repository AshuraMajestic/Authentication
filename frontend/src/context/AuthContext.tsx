import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { OAuthProvider, Role, Session, User } from "../types/auth";
import {
  logoutOnServer,
  refreshSession,
  requestPasswordLogin,
  resendOtp,
  signInWithOAuth,
  verifyOtpAndLogin,
} from "../mock/mockBackend";

const SESSION_STORAGE_KEY = import.meta.env.VITE_SESSION_STORAGE_KEY;

type LoginStage = "credentials" | "otp";

interface PendingLogin {
  email: string;
  devOtpHint: string;
}

interface AuthContextValue {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  loginStage: LoginStage;
  pendingLogin: PendingLogin | null;
  error: string | null;
  isSubmitting: boolean;

  submitCredentials: (email: string, password: string) => Promise<void>;
  submitOtp: (code: string) => Promise<boolean>;
  resendCode: () => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;
  resetLoginFlow: () => void;
  logout: () => void;
  clearError: () => void;

  hasRole: (...roles: Role[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (parsed.tokens.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [loginStage, setLoginStage] = useState<LoginStage>("credentials");
  const [pendingLogin, setPendingLogin] = useState<PendingLogin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((next: Session | null) => {
    setSession(next);
    if (next) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const stored = readStoredSession();
    setSession(stored);
    setStatus(stored ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (!session) return;

    const msUntilRefresh = Math.max(session.tokens.expiresAt - Date.now() - 60_000, 5_000);
    refreshTimer.current = setTimeout(async () => {
      const result = await refreshSession(session.tokens.refreshToken, session.user.id);
      if (result.ok) {
        persist({ user: session.user, tokens: result.data.tokens });
      } else {
        persist(null);
        setStatus("unauthenticated");
      }
    }, msUntilRefresh);

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [session, persist]);

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
    setPendingLogin({ email: result.data.otpSentTo, devOtpHint: result.data.devOtpHint });
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
      persist({ user: result.data.user, tokens: result.data.tokens });
      setStatus("authenticated");
      setLoginStage("credentials");
      setPendingLogin(null);
      return true;
    },
    [pendingLogin, persist]
  );

  const resendCode = useCallback(async () => {
    if (!pendingLogin) return;
    setError(null);
    const result = await resendOtp(pendingLogin.email);
    if (result.ok) {
      setPendingLogin({ email: pendingLogin.email, devOtpHint: result.data.devOtpHint });
    } else {
      setError(result.error);
    }
  }, [pendingLogin]);

  const loginWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      setIsSubmitting(true);
      setError(null);
      const result = await signInWithOAuth(provider);
      setIsSubmitting(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      persist({ user: result.data.user, tokens: result.data.tokens });
      setStatus("authenticated");
    },
    [persist]
  );

  const resetLoginFlow = useCallback(() => {
    setLoginStage("credentials");
    setPendingLogin(null);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    void logoutOnServer();
    persist(null);
    setStatus("unauthenticated");
    resetLoginFlow();
  }, [persist, resetLoginFlow]);

  const hasRole = useCallback(
    (...roles: Role[]) => !!session && roles.includes(session.user.role),
    [session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      status,
      loginStage,
      pendingLogin,
      error,
      isSubmitting,
      submitCredentials,
      submitOtp,
      resendCode,
      loginWithOAuth,
      resetLoginFlow,
      logout,
      clearError,
      hasRole,
    }),
    [
      session,
      status,
      loginStage,
      pendingLogin,
      error,
      isSubmitting,
      submitCredentials,
      submitOtp,
      resendCode,
      loginWithOAuth,
      resetLoginFlow,
      logout,
      clearError,
      hasRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
