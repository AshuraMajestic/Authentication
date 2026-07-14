import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "../types/auth";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <FullScreenLoader />;
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { hasRole, status } = useAuth();

  if (status === "loading") return <FullScreenLoader />;
  if (!hasRole(...roles)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-canvas">
      <div className="flex items-center gap-3 text-ink-soft font-mono text-sm">
        <span className="h-2 w-2 rounded-full bg-indigo animate-pulse" />
        checking session…
      </div>
    </div>
  );
}
