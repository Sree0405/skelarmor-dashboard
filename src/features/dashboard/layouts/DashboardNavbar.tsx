// features/dashboard/layouts/DashboardNavbar.tsx

import { Link, useLocation } from "react-router-dom";
import { LogOut, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/features/Login/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { resolvePageTitle } from "./navConfig";

// ─── Role accent colours ──────────────────────────────────────────────────────

const ROLE_ACCENT: Record<string, { color: string; bg: string; label: string }> = {
  admin:                    { color: "#FF6432", bg: "rgba(255,100,50,0.12)",  label: "Admin"     },
  Franchise_setup_client:   { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "Franchise" },
  training_client: { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  label: "Training"  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const DashboardNavbar = () => {
  const location      = useLocation();
  const { user, logout } = useAuth();
  const [focused, setFocused] = useState(false);

  const role    = user?.dashboard_roles ?? "";
  const accent  = ROLE_ACCENT[role] ?? { color: "#FF6432", bg: "rgba(255,100,50,0.12)", label: "" };
  const title   = resolvePageTitle(location.pathname);

  const profileBase =
    location.pathname.match(/^\/dashboard\/(?:admin|franchise|training)/)?.[0] ?? null;
  const profileTo = profileBase ? `${profileBase}/profile` : "/dashboard/admin/profile";

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "User";
  const firstName = user?.first_name || fullName.split(" ")[0];
  const initials  = fullName
    .split(" ")
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "??";

  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6"
      style={{
        background:  "rgba(9,9,15,0.80)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Left: page title ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Role badge — desktop only */}
        {accent.label && (
          <span
            className="hidden sm:inline-flex items-center text-[10px] font-bold tracking-widest rounded-full px-2.5 py-1 uppercase"
            style={{ background: accent.bg, color: accent.color }}
          >
            {accent.label}
          </span>
        )}
        <h1
          className="text-base sm:text-lg font-semibold tracking-tight"
          style={{
            color:      "#fff",
            fontFamily: "'Barlow', sans-serif",
          }}
        >
          {title}
        </h1>
      </div>

      {/* ── Right: search + profile link ───────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Search — hidden on mobile */}
        <div
          className="hidden sm:flex relative items-center transition-all duration-200"
          style={{ width: focused ? 220 : 160 }}
        >
          <Search
            className="absolute left-3 h-3.5 w-3.5 pointer-events-none"
            style={{ color: "rgba(255,255,255,0.30)" }}
          />
          <input
            type="text"
            placeholder="Search…"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              height:      36,
              width:       "100%",
              borderRadius: 10,
              paddingLeft:  32,
              paddingRight: 12,
              fontSize:     13,
              fontFamily:   "'DM Sans', system-ui, sans-serif",
              color:        "#fff",
              outline:      "none",
              background:   focused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
              border:       `1px solid ${focused ? "rgba(255,160,30,0.30)" : "rgba(255,255,255,0.07)"}`,
              transition:   "all 0.2s ease",
            }}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {/* User avatar chip → profile */}
          <Link
            to={profileTo}
            className="flex h-9 items-center gap-2 rounded-xl pl-1 pr-3 transition-all duration-150 no-underline"
            style={{
              background: "rgba(255,255,255,0.04)",
              border:     "1px solid rgba(255,255,255,0.07)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)")}
          >
            <div
              className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: accent.bg, color: accent.color }}
            >
              {initials}
            </div>
            <span
              className="hidden sm:block text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.80)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {firstName}
            </span>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#FF6432]/45"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border:     "1px solid rgba(255,255,255,0.07)",
                  color:      "rgba(255,255,255,0.45)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(248,113,113,0.10)";
                  e.currentTarget.style.color = "#f87171";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                }}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm border-white/10 bg-[#0c0c14] text-white shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Sign out?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/55">
                  You&apos;ll need to sign in again to access your dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500"
                  onClick={() => void logout()}
                >
                  Sign out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
};