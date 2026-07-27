import { AppShell } from "../components/AppShell";
import { useAuth } from "../hooks/useAuth";

export default function AccountPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-wide text-[#0E7A55]">Your account</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
        Profile &amp; session
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <InfoCard label="Name" value={user.name} />
        <InfoCard label="Email" value={user.email} />
        <InfoCard label="Role" value={user.role} capitalize />
        <InfoCard
          label="Signed in via"
          value={user.provider === "password" ? "Email + password + OTP" : user.provider}
        />
      </div>

      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <p className="text-xs font-medium text-ink-soft">Session</p>
        <p className="mt-2 text-sm text-ink-soft">
          Your session is stored in a secure, httpOnly cookie managed by the server —
          it isn&apos;t readable from the browser, so there&apos;s no token to display here.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-indigo-tint p-3 font-mono text-[11px] leading-relaxed text-indigo-deep">
{JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </AppShell>
  );
}

function InfoCard({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className={`mt-1 text-sm font-medium text-ink ${capitalize ? "capitalize" : ""}`}>
        {value}
      </p>
    </div>
  );
}