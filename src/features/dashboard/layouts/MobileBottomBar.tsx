// features/dashboard/layouts/MobileBottomBar.tsx

import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/Login/useAuth";
import { useOrganization } from "@/features/dashboard/hooks/useOrganization";
import {
  getNavItems,
  isNavItemActive,
  splitNavForMobileBottomBar,
  type NavItem,
} from "./navConfig";

const accent = "#FF6432";
const muted = "rgba(255,255,255,0.38)";
const mutedLabel = "rgba(255,255,255,0.30)";

function BottomTab({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = isNavItemActive(item.path, pathname);

  return (
    <NavLink
      to={item.path}
      className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5"
    >
      {isActive && (
        <motion.div
          layoutId="bottom-pill"
          className="absolute inset-x-1 top-2 bottom-2 rounded-2xl"
          style={{ background: "rgba(255,100,50,0.13)" }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      <div
        className="relative z-10 flex h-6 w-6 items-center justify-center"
        style={{ color: isActive ? accent : muted }}
      >
        <item.icon className="h-5 w-5" />
        {isActive && (
          <motion.span
            layoutId="bottom-dot"
            className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
            style={{ background: accent }}
          />
        )}
      </div>

      <span
        className="relative z-10 text-[10px] font-semibold tracking-wide"
        style={{
          color: isActive ? accent : mutedLabel,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {item.label}
      </span>
    </NavLink>
  );
}

export const MobileBottomBar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();
  const { isMain, isSuperAdmin } = useOrganization();
  const navItems = getNavItems(user?.dashboard_roles ?? "", {
    isMainOrg: isMain,
    isSuperAdmin,
  });
  const { primary, overflow } = splitNavForMobileBottomBar(navItems);

  const overflowActive = overflow.some((item) => isNavItemActive(item.path, pathname));
  const showMore = overflow.length > 0;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-center gap-0.5 px-1.5 pb-safe"
      style={{
        height: 68,
        background: "rgba(9,9,15,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {primary.map((item) => (
        <BottomTab key={item.path} item={item} pathname={pathname} />
      ))}

      {showMore && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 outline-none",
                "focus-visible:ring-2 focus-visible:ring-[#FF6432]/40 [-webkit-tap-highlight-color:transparent]"
              )}
              style={{ color: overflowActive ? accent : muted }}
              aria-label="More navigation"
            >
              {overflowActive && (
                <motion.div
                  layoutId="bottom-pill"
                  className="absolute inset-x-1 top-2 bottom-2 rounded-2xl"
                  style={{ background: "rgba(255,100,50,0.13)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex h-6 w-6 items-center justify-center">
                <LayoutGrid className="h-5 w-5" />
                {overflowActive && (
                  <motion.span
                    layoutId="bottom-dot"
                    className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    style={{ background: accent }}
                  />
                )}
              </div>
              <span
                className="relative z-10 text-[10px] font-semibold tracking-wide"
                style={{
                  color: overflowActive ? accent : mutedLabel,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                More
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="center"
            sideOffset={10}
            className="min-w-[12rem] border-white/10 bg-[#0f0f16] p-1.5 text-white shadow-xl"
          >
            {overflow.map((item) => {
              const active = isNavItemActive(item.path, pathname);
              return (
                <DropdownMenuItem key={item.path} asChild className="p-0 focus:bg-transparent">
                  <NavLink
                    to={item.path}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium outline-none",
                      active ? "bg-[#FF6432]/14 text-[#FF6432]" : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                    {item.label}
                  </NavLink>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
};
