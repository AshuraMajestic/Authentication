import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AppShell } from "../components/AppShell";
import type { Role } from "../types/auth";

const SECTIONS: { to: string; title: string; description: string; roles: Role[] }[] = [
  {
    to: "/admin",
    title: "Admin console",
    description: "Manage every user's role and access across the org.",
    roles: ["admin"],
  },
  {
    to: "/manager",
    title: "Manager workspace",
    description: "Review team activity and approve pending requests.",
    roles: ["admin", "manager"],
  },
  {
    to: "/account",
    title: "Your account",
    description: "Profile details, session info, and sign-in method.",
    roles: ["admin", "manager", "user"],
  },
];

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  if (!user) return null;

  const visible = SECTIONS.filter((s) => hasRole(...s.roles));

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Hey {user.name.split(" ")[0]} 👋
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        You're signed in as <span className="font-medium text-ink">{user.role}</span> via{" "}
        {user.provider === "password" ? "email & password" : user.provider}. Here's what
        you're authorized to open.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {visible.map((section) => (
          <Link
            key={section.to}
            to={section.to}
            className="group rounded-xl border border-line bg-surface p-5 transition hover:border-indigo/40 hover:shadow-[0_12px_32px_-20px_rgba(36,29,110,0.35)]"
          >
            <h2 className="font-display font-semibold text-ink group-hover:text-indigo">
              {section.title}
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">{section.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-line p-5 text-xs text-ink-soft">
        Try visiting <code className="font-mono">/admin</code> while signed in as the{" "}
        <code className="font-mono">user</code> demo account — the{" "}
        <code className="font-mono">RequireRole</code> guard will redirect you to{" "}
        <code className="font-mono">/unauthorized</code>.
      </div>
    </AppShell>
  );
}
