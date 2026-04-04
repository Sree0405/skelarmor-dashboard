// features/auth/components/ProtectedRoute.tsx

import { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, selectIsAuth, selectRole } from "../store";
import { DashboardRole, getRoleDestination, hasAccess } from "../utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: DashboardRole[];
  loginPath?: string;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

const SessionLoader = () => (
  <div
    style={{
      minHeight:      "100vh",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      background:     "#05070D",
      fontFamily:     "system-ui, sans-serif",
      color:          "rgba(255,255,255,0.35)",
      fontSize:       13,
      letterSpacing:  "0.06em",
    }}
  >
    Verifying session…
  </div>
);

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

export const ProtectedRoute = ({
  children,
  allowedRoles = [],
  loginPath    = "/",
}: ProtectedRouteProps) => {
  const hydrationStatus = useAuthStore((s) => s.hydrationStatus);
  const isAuthenticated = useAuthStore(selectIsAuth);
  const role            = useAuthStore(selectRole);
  const location        = useLocation();

  // ── 1. Actively fetching /users/me — show loader ──────────────────────────
  // "idle"  → no token / post-logout → fall through to unauthenticated redirect
  // "error" → 401 or network fail   → fall through to unauthenticated redirect
  // "done"  → user loaded           → fall through to role check
  if (hydrationStatus === "loading") {
    return <SessionLoader />;
  }

  // ── 2. Not authenticated ──────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location }}
      />
    );
  }

  // ── 3. Wrong role ─────────────────────────────────────────────────────────
  if (allowedRoles.length > 0 && !hasAccess(role, allowedRoles)) {
    return <Navigate to={getRoleDestination(role)} replace />;
  }

  // ── 4. Access granted ─────────────────────────────────────────────────────
  return children;
};

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const AdminRoute = ({ children }: { children: JSX.Element }) => (
  <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>
);

export const FranchiseRoute = ({ children }: { children: JSX.Element }) => (
  <ProtectedRoute allowedRoles={["Franchise_setup_client"]}>{children}</ProtectedRoute>
);

export const TrainingRoute = ({ children }: { children: JSX.Element }) => (
  <ProtectedRoute allowedRoles={["training_client"]}>{children}</ProtectedRoute>
);