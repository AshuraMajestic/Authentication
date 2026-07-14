import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { OAuthButtons } from "../components/OAuthButtons";
import { OtpInput } from "../components/OtpInput";

export default function LoginPage() {
  const {
    loginStage,
    pendingLogin,
    error,
    isSubmitting,
    submitCredentials,
    submitOtp,
    resendCode,
    resetLoginFlow,
    clearError,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const isFlipped = loginStage === "otp";

  async function handleCredentialsSubmit(e: FormEvent) {
    e.preventDefault();
    await submitCredentials(email, password);
    setOtp("");
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    const success = await submitOtp(otp);
    if (success) {
      navigate(location.state?.from ?? "/", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
     

      <main className="flex-1 grid place-items-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="keycard-perspective">
            <div className={`keycard relative ${isFlipped ? "is-flipped" : ""}`}>

              <div
                className={`keycard-face rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(20,22,43,0.04),0_12px_32px_-16px_rgba(36,29,110,0.18)] p-7 sm:p-8 ${
                  isFlipped ? "invisible pointer-events-none absolute inset-0" : ""
                }`}
              >
                <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">
                  Welcome back
                </h1>
                <p className="mt-1.5 text-sm text-ink-soft">
                  Sign in to continue to your dashboard.
                </p>

                <form onSubmit={handleCredentialsSubmit} className="mt-6 grid gap-4">
                  <Field label="Email" htmlFor="email">
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError();
                      }}
                      placeholder="you@company.com"
                      className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-indigo"
                    />
                  </Field>

                  <Field label="Password" htmlFor="password">
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearError();
                      }}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-indigo"
                    />
                  </Field>

                  {error && !isFlipped && <ErrorNote message={error} />}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-lg bg-indigo py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-deep disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Checking credentials…" : "Continue"}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-xs text-ink-soft">or</span>
                  <span className="h-px flex-1 bg-line" />
                </div>

                <OAuthButtons />

              </div>

              <div
                className={`keycard-face back relative overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(20,22,43,0.04),0_12px_32px_-16px_rgba(36,29,110,0.18)] p-7 sm:p-8 ${
                  !isFlipped ? "invisible pointer-events-none absolute inset-0" : ""
                }`}
              >
                {isFlipped && <div className="scanline" aria-hidden="true" />}

                <button
                  type="button"
                  onClick={() => {
                    resetLoginFlow();
                    setOtp("");
                  }}
                  className="text-xs font-medium text-ink-soft hover:text-ink"
                >
                  ← Back
                </button>

                <h1 className="mt-3 font-display text-2xl font-semibold text-ink tracking-tight">
                  Verify it's you
                </h1>
                <p className="mt-1.5 text-sm text-ink-soft">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium text-ink">{pendingLogin?.email}</span>.
                </p>

                {pendingLogin?.devOtpHint && (
                  <p className="mt-2 rounded-md bg-amber-tint px-3 py-2 font-mono text-xs text-ink">
                    Demo mode — no real backend, so here's the code:{" "}
                    <span className="font-semibold">{pendingLogin.devOtpHint}</span>
                  </p>
                )}

                <form onSubmit={handleOtpSubmit} className="mt-5 grid gap-4">
                  <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} />

                  {error && isFlipped && <ErrorNote message={error} />}

                  <button
                    type="submit"
                    disabled={isSubmitting || otp.length !== 6}
                    className="w-full rounded-lg bg-indigo py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-deep disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Verifying…" : "Verify & sign in"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => resendCode()}
                  className="mt-4 w-full text-center text-xs font-medium text-indigo hover:underline"
                >
                  Resend code
                </button>
              </div>
            </div>
          </div>

          
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="grid gap-1.5">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-bad" role="alert">
      {message}
    </p>
  );
}

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <rect width="26" height="26" rx="7" fill="#3730A3" />
      <path
        d="M13 6.5c-2.5 0-4.2 1.7-4.2 3.9v1.4H8v6.7h10v-6.7h-.8v-1.4c0-2.2-1.7-3.9-4.2-3.9Zm0 1.8c1.4 0 2.4.9 2.4 2.1v1.4h-4.8v-1.4c0-1.2 1-2.1 2.4-2.1Z"
        fill="white"
      />
    </svg>
  );
}
