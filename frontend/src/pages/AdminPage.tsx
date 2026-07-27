import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  listUsers,
  PROMOTABLE_ROLES,
  updateUserRole,
  type DirectoryUser,
  type PromotableRole,
} from "../api";
import { useAuth } from "../hooks/useAuth";

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<DirectoryUser[] | null>(null);
  const [pendingRoleById, setPendingRoleById] = useState<Record<string, PromotableRole>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; message: string; ok: boolean } | null>(
    null
  );

  async function refresh() {
    const result = await listUsers();
    if (result.ok) setUsers(result.data?.users);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handlePromote(target: DirectoryUser) {
    const nextRole = pendingRoleById[target.id] ?? (target.role as PromotableRole);
    if (nextRole === target.role) return;

    setSavingId(target.id);
    setFeedback(null);
    const result = await updateUserRole(target.id, nextRole);
    setSavingId(null);

    if (result.ok) {
      setFeedback({ id: target.id, message: `Updated to ${result.data?.user?.role}.`, ok: true });
      setUsers((prev) =>
        prev ? prev.map((u) => (u.id === target.id ? { ...u, role: result.data?.user?.role } : u)) : prev
      );
    } else {
      setFeedback({ id: target.id, message: result.error, ok: false });
    }
  }

  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-wide text-indigo">Admin console</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
        User &amp; role management
      </h1>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-indigo-tint text-xs uppercase tracking-wide text-indigo-deep">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {!users && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-xs text-ink-soft">
                  Loading users…
                </td>
              </tr>
            )}
            {users?.map((u) => {
              const isAdmin = u.role === "admin";
              const isSelf = u.id === currentUser?.id;
              const selected = pendingRoleById[u.id] ?? (u.role as PromotableRole);
              const dirty = !isAdmin && selected !== u.role;

              return (
                <tr key={u.id} className="border-t border-line align-top">
                  <td className="px-4 py-3 text-ink">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-soft">{u.email}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <span className="rounded-full bg-indigo-tint px-2.5 py-1 text-[11px] font-semibold uppercase text-indigo-deep">
                        admin · db only
                      </span>
                    ) : (
                      <select
                        value={selected}
                        disabled={isSelf}
                        onChange={(e) =>
                          setPendingRoleById((prev) => ({
                            ...prev,
                            [u.id]: e.target.value as PromotableRole,
                          }))
                        }
                        className="rounded-md border border-line bg-surface px-2 py-1 text-xs capitalize outline-none focus:border-indigo disabled:opacity-50"
                      >
                        {PROMOTABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin || isSelf ? (
                      <span className="text-xs text-ink-soft">
                        {isSelf ? "That's you" : "Direct DB only"}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePromote(u)}
                          disabled={!dirty || savingId === u.id}
                          className="rounded-md bg-indigo px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-indigo-deep disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {savingId === u.id ? "Saving…" : "Save"}
                        </button>
                        {feedback?.id === u.id && (
                          <span
                            className={`text-xs ${feedback.ok ? "text-[#0E7A55]" : "text-bad"}`}
                          >
                            {feedback.message}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}