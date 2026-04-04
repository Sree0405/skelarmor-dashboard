// features/auth/utils.ts

// ─── Role type ────────────────────────────────────────────────────────────────

export type DashboardRole =
  | "admin"
  | "Franchise_setup_client"
  | "training_client";

export const ALL_ROLES: DashboardRole[] = [
  "admin",
  "Franchise_setup_client",
  "training_client",
];

// ─── Role → route mapping ─────────────────────────────────────────────────────

const ROLE_DESTINATIONS: Record<DashboardRole, string> = {
  admin:                    "/dashboard/admin",
  Franchise_setup_client:   "/dashboard/franchise",
  training_client: "/dashboard/training",
};

/**
 * Returns the canonical dashboard path for a given role.
 * Falls back to "/" (login) if the role is unrecognised or missing.
 */
export function getRoleDestination(
  role: string | null | undefined
): string {
  if (!role) return "/";
  return ROLE_DESTINATIONS[role as DashboardRole] ?? "/";
}

/**
 * Returns true when `role` is one of the three known dashboard roles.
 */
export function isValidRole(role: unknown): role is DashboardRole {
  return ALL_ROLES.includes(role as DashboardRole);
}

/**
 * Returns true when the user's role matches at least one of the allowed roles.
 * Pass an empty array to allow any authenticated user.
 */
export function hasAccess(
  userRole: string | null | undefined,
  allowedRoles: DashboardRole[]
): boolean {
  if (!userRole) return false;
  if (allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole as DashboardRole);
}