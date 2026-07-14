import type { JSX } from "react";
import type { OAuthProvider } from "../types/auth";
import { useAuth } from "../hooks/useAuth";

type IconComponent = () => JSX.Element;

const PROVIDERS: { id: OAuthProvider; label: string; icon: IconComponent }[] = [
  { id: "google", label: "Continue with Google", icon: GoogleIcon },
  { id: "github", label: "Continue with GitHub", icon: GitHubIcon },
];

export function OAuthButtons() {
  const { loginWithOAuth, isSubmitting } = useAuth();

  return (
    <div className="grid gap-2.5">
      {PROVIDERS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          disabled={isSubmitting}
          onClick={() => loginWithOAuth(id)}
          className="flex items-center justify-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:border-indigo/40 hover:bg-indigo-tint disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon />
          {label}
        </button>
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.95a9 9 0 0 0 0 8.06l3-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.42 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#181717" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97.01 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.6.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.67.8.56A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
