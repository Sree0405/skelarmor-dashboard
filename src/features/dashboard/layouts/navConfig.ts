// features/dashboard/layouts/navConfig.ts

import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Dumbbell,
  Building2,
  Eye,
  LineChart,
  Briefcase,
  CreditCard,
  UserCheck,
  Building,
  type LucideIcon,
  UserCircle,
} from "lucide-react";

export type NavItem = {
  label: string;
  path:  string;
  icon:  LucideIcon;
};

export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", path: "/dashboard/admin",           icon: LayoutDashboard },
    { label: "Customers", path: "/dashboard/admin/customers", icon: Users           },
    { label: "Progress",  path: "/dashboard/admin/progress",  icon: TrendingUp      },
    { label: "Gym Setup", path: "/dashboard/admin/gym-setup", icon: Dumbbell        },
    { label: "Gym clients", path: "/dashboard/admin/gym-clients", icon: Building2 },
    { label: "Leads",     path: "/dashboard/admin/leads",     icon: UserCheck       },
    { label: "Organizations", path: "/dashboard/admin/organizations", icon: Building },
    { label: "Profile", path: "/dashboard/admin/profile",  icon: UserCircle },

  ],

  Franchise_setup_client: [
    { label: "Overview", path: "/dashboard/franchise", icon: Eye },
    { label: "Projects", path: "/dashboard/franchise/projects", icon: Briefcase },
    { label: "Payments", path: "/dashboard/franchise/payments", icon: CreditCard },
    { label: "Profile", path: "/dashboard/franchise/profile", icon: UserCircle },
  ],

  training_client: [
    { label: "Overview",  path: "/dashboard/training",           icon: Eye      },
    { label: "Progress",  path: "/dashboard/training/progress",  icon: LineChart},
    { label: "Payments",  path: "/dashboard/training/payments",  icon: CreditCard},
    { label: "Profile", path: "/dashboard/training/profile",  icon: UserCircle },

  ],
};

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard/admin":                "Dashboard",
  "/dashboard/admin/customers":      "Customers",
  "/dashboard/admin/progress":       "Progress Tracking",
  "/dashboard/admin/gym-setup":      "Gym Setup",
  "/dashboard/admin/gym-setup/new":  "New Project",
  "/dashboard/admin/gym-clients":    "Gym clients",
  "/dashboard/admin/leads":          "Leads",
  "/dashboard/admin/organizations":  "Organizations",
  "/dashboard/admin/profile":        "Profile",
  "/dashboard/franchise":            "Overview",
  "/dashboard/franchise/projects":   "Projects",
  "/dashboard/franchise/payments":   "Payments",
  "/dashboard/franchise/profile":    "Profile",
  "/dashboard/training":             "Overview",
  "/dashboard/training/progress":    "My Progress",
  "/dashboard/training/payments":    "Payments",
  "/dashboard/training/profile":     "Profile",
};

type NavOptions = {
  isMainOrg?: boolean;
  isSuperAdmin?: boolean;
};

export function getNavItems(role: string | null | undefined, opts?: NavOptions): NavItem[] {
  if (!role) return [];
  const base = NAV_BY_ROLE[role] ?? [];
  if (role !== "admin") return base;
  if (opts?.isSuperAdmin) return base;
  const withoutSuperOnly = base.filter((item) => item.path !== "/dashboard/admin/organizations");
  if (opts?.isMainOrg === false) {
    return withoutSuperOnly.filter((item) => item.path !== "/dashboard/admin/leads");
  }
  return withoutSuperOnly;
}

/** Dashboard home segments: match exact path only, not deeper routes. */
const DASHBOARD_INDEX_PATHS = new Set([
  "/dashboard/admin",
  "/dashboard/franchise",
  "/dashboard/training",
]);

function normalizePath(p: string): string {
  const t = p.replace(/\/+$/, "") || "/";
  return t;
}

/** Active nav item, including detail routes (e.g. gym-setup/:id). */
export function isNavItemActive(itemPath: string, pathname: string): boolean {
  const normItem = normalizePath(itemPath);
  const normPath = normalizePath(pathname);
  if (normPath === normItem) return true;
  if (DASHBOARD_INDEX_PATHS.has(normItem)) return false;
  return normPath.startsWith(`${normItem}/`);
}

/**
 * Mobile bottom bar: at most this many slots. When `items.length` exceeds this,
 * the last slot is a “More” control and the rest move into its menu.
 */
export const MOBILE_BOTTOM_BAR_MAX_SLOTS = 5;

export function splitNavForMobileBottomBar(items: NavItem[]): {
  primary: NavItem[];
  overflow: NavItem[];
} {
  if (items.length <= MOBILE_BOTTOM_BAR_MAX_SLOTS) {
    return { primary: [...items], overflow: [] };
  }
  const primaryCount = MOBILE_BOTTOM_BAR_MAX_SLOTS - 1;
  return {
    primary: items.slice(0, primaryCount),
    overflow: items.slice(primaryCount),
  };
}

/** Resolves dynamic admin routes (e.g. `/customers/:id`) to a readable title. */
export function resolvePageTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact) return exact;
  if (/^\/dashboard\/admin\/gym-clients\/[^/]+$/.test(pathname)) return "Gym client";
  if (/^\/dashboard\/admin\/customers\/[^/]+$/.test(pathname)) return "Customer";
  if (/^\/dashboard\/admin\/gym-setup\/(?!new$)[^/]+$/.test(pathname)) return "Project";
  if (/^\/dashboard\/admin\/leads\/[^/]+$/.test(pathname)) return "Lead";
  if (/^\/dashboard\/franchise\/projects\/[^/]+$/.test(pathname)) return "Project";
  return "Dashboard";
}