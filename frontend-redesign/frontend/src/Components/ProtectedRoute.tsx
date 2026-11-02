import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../Context/useAuth";
import type { AccessLevel } from "../Types";

/** Wrap a page to require login, and optionally one of several access levels. */
export default function ProtectedRoute({ levels, children }: { levels?: AccessLevel[]; children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <p className="center muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (levels && !levels.includes(user.accessLevel)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
