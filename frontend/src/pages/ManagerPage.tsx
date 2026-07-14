import { AppShell } from "../components/AppShell";

const REQUESTS = [
  { id: "REQ-104", title: "Time off — Aug 4-8", requester: "Priya Nair", status: "Pending" },
  { id: "REQ-103", title: "Budget increase — Design tools", requester: "Rohan Iyer", status: "Pending" },
  { id: "REQ-101", title: "New hire — Frontend Eng", requester: "Priya Nair", status: "Approved" },
];

export default function ManagerPage() {
  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-wide text-amber-700">
        Manager workspace
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
        Pending approvals
      </h1>
      <p className="mt-1.5 max-w-xl text-sm text-ink-soft">
        Reachable by <code className="font-mono">admin</code> and{" "}
        <code className="font-mono">manager</code> roles.
      </p>

      <ul className="mt-6 grid gap-3">
        {REQUESTS.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3.5"
          >
            <div>
              <p className="text-sm font-medium text-ink">{r.title}</p>
              <p className="text-xs text-ink-soft">
                {r.id} · requested by {r.requester}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                r.status === "Approved"
                  ? "bg-[#E7F8F1] text-[#0E7A55]"
                  : "bg-amber-tint text-amber-700"
              }`}
            >
              {r.status}
            </span>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
