import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types/auth";

const ROLE_STYLES: Record<Role, string> = {
  admin: "bg-indigo-tint text-indigo-deep",
  manager: "bg-amber-tint text-amber-700",
  user: "bg-[#E7F8F1] text-[#0E7A55]",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-indigo font-display text-xs font-bold text-white">
              SG
            </div>
            <span className="font-display font-semibold tracking-tight text-ink">
              SecureGate
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${ROLE_STYLES[user.role]}`}
            >
              {user.role}
            </span>
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-indigo-tint font-mono text-xs font-semibold text-indigo-deep">
                {user.avatarInitials}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium text-ink">{user.name}</p>
                <p className="text-xs text-ink-soft">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-bad/40 hover:text-bad"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
