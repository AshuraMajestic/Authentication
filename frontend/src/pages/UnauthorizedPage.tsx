import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-canvas grid place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50">
          <span className="font-mono text-lg font-semibold text-bad">403</span>
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold text-ink">
          You don't have access
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {user
            ? `Your role (${user.role}) isn't authorized to view that page.`
            : "You need permission to view that page."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-indigo px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-deep"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
