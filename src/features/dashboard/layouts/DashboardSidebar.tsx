// features/dashboard/layouts/DashboardSidebar.tsx

import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { useAuth } from "@/features/Login/useAuth";
import { getNavItems, isNavItemActive } from "./navConfig";

// ─── Role badge colours ───────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  admin:                    { label: "Admin",    color: "#FF6432", bg: "rgba(255,100,50,0.12)"  },
  Franchise_setup_client:   { label: "Franchise",color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  training_client: { label: "Training", color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location  = useLocation();
  const { user } = useAuth();

  const role      = user?.dashboard_roles ?? "";
  const navItems  = getNavItems(role);
  const badge     = ROLE_BADGE[role];

  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .map((n) => n![0].toUpperCase())
    .join("")
    .slice(0, 2) || "??";

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:flex relative h-screen flex-col shrink-0 overflow-hidden"
      style={{
        background:  "#09090f",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Logo ───────────────────────────────────────────────────────────── */}
      <div
        className="flex h-16 items-center gap-3 px-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg,#FFA01E,#FF6432)",
            boxShadow:  "0 4px 14px rgba(255,100,50,0.35)",
          }}
        >
          <Zap className="h-5 w-5 text-black" fill="black" />
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p
                className="whitespace-nowrap text-base font-black tracking-widest"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  background: "linear-gradient(90deg,#fff 60%,rgba(255,255,255,0.4))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                SKELARMOR
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = isNavItemActive(item.path, location.pathname);
          return (
            <NavLink key={item.path} to={item.path} className="block">
              <div
                className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
                style={{
                  background: isActive ? "rgba(255,100,50,0.10)" : "transparent",
                  color:      isActive ? "#FF6432" : "rgba(255,255,255,0.45)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.80)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.45)";
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-pill"
                    className="absolute inset-y-1.5 left-0 w-[3px] rounded-full"
                    style={{ background: "#FF6432" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* ── User strip ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!collapsed && badge && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-3"
          >
            <div
              className="rounded-xl px-3 py-2.5 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Avatar */}
              <div
                className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: badge.bg, color: badge.color }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || "User"}
                </p>
                <span
                  className="text-[10px] font-semibold rounded-full px-1.5 py-0.5"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Collapse toggle ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-10 items-center justify-center transition-colors shrink-0"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.25)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.70)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
      >
        {collapsed
          ? <ChevronRight className="h-4 w-4" />
          : <ChevronLeft  className="h-4 w-4" />
        }
      </button>
    </motion.aside>
  );
};