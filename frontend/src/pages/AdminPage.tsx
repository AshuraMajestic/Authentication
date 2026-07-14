import { AppShell } from "../components/AppShell";
import { DEMO_ACCOUNTS } from "../mock/mockBackend";

export default function AdminPage() {
  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-wide text-indigo">Admin console</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
        User &amp; role management
      </h1>
      <p className="mt-1.5 max-w-xl text-sm text-ink-soft">
        Only accounts with the <code className="font-mono">admin</code> role reach this
        route — enforced by{" "}
        <code className="font-mono">&lt;RequireRole roles={"{"}["admin"]{"}"}&gt;</code>.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-indigo-tint text-xs uppercase tracking-wide text-indigo-deep">
            <tr>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ACCOUNTS.map((acc) => (
              <tr key={acc.email} className="border-t border-line">
                <td className="px-4 py-3 font-mono text-xs text-ink">{acc.email}</td>
                <td className="px-4 py-3 capitalize text-ink-soft">{acc.role}</td>
                <td className="px-4 py-3">
                  <button
                    disabled
                    title="Wire this up to your real backend"
                    className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft opacity-60"
                  >
                    Edit role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
