// features/dashboard/layouts/DashboardLayout.tsx

import { Outlet, Navigate } from "react-router-dom";
import { useAuth }           from "@/features/Login/useAuth";
import { DashboardSidebar }  from "./DashboardSidebar";
import { DashboardNavbar }   from "./DashboardNavbar";
import { MobileBottomBar }   from "./MobileBottomBar";

// ─── Full-screen loader ───────────────────────────────────────────────────────

const WorkspaceLoader = () => (
  <div
    className="flex h-screen w-full items-center justify-center flex-col gap-4"
    style={{ background: "#09090f" }}
  >
    <div
      className="h-10 w-10 rounded-full border-4 animate-spin"
      style={{ borderColor: "rgba(255,255,255,0.08)", borderTopColor: "#FF6432" }}
    />
    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.30)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      Loading your workspace…
    </p>
  </div>
);

// ─── Layout ───────────────────────────────────────────────────────────────────

export const DashboardLayout = () => {
  const { user, hydrationStatus } = useAuth();

  // ── Still in-flight ────────────────────────────────────────────────────────
  // Only block render during "loading". "idle" falls through to the !user redirect
  // (same logic as ProtectedRoute — avoids infinite spinner after logout).
  if (hydrationStatus === "loading") {
    return <WorkspaceLoader />;
  }

  // ── No user (post-logout, bad token, error) → login ───────────────────────
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: "#09090f" }}
    >
      {/* Desktop sidebar — hidden on mobile via CSS inside the component */}
      <DashboardSidebar />

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardNavbar />

        {/* Page content — extra bottom padding on mobile to clear the bottom bar */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation bar */}
      <MobileBottomBar />
    </div>
  );
};