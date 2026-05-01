/**
 * Canonical `directus_users.goal` values for training clients (API / Directus).
 * Labels are display-only in the UI.
 */
export const CUSTOMER_GOAL_OPTIONS = [
  { value: "weight_loss", label: "Weight lost" },
  { value: "weight_gain", label: "Weight gain" },
  { value: "transformation", label: "Transformation" },
] as const;

export type CustomerGoalValue = (typeof CUSTOMER_GOAL_OPTIONS)[number]["value"];

export function formatCustomerGoalLabel(goal: string | null | undefined): string {
  if (!goal) return "—";
  const hit = CUSTOMER_GOAL_OPTIONS.find((o) => o.value === goal);
  return hit?.label ?? goal.replace(/_/g, " ");
}

/** Maps stored goal → `StatusBadge` `status` key (add styles in StatusBadge for each). */
export function customerGoalBadgeKey(goal: string | null | undefined): string {
  if (goal === "weight_loss" || goal === "weight_gain" || goal === "transformation") return goal;
  if (goal && String(goal).length > 0) return "planning";
  return "planning";
}
