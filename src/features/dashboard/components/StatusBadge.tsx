import { cn } from "@/lib/utils";
import { CUSTOMER_GOAL_OPTIONS, formatCustomerGoalLabel } from "@/features/dashboard/modules/customers/goalConstants";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "customer" | "project";
}

const statusStyles: Record<string, string> = {
  active: "bg-primary/15 text-primary border-primary/20",
  inactive: "bg-muted text-muted-foreground border-border",
  planning: "bg-accent/15 text-accent border-accent/20",
  ongoing: "bg-primary/15 text-primary border-primary/20",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  weight_loss: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  weight_gain: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  transformation: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  pending: "bg-accent/15 text-accent border-accent/20",
};

function badgeLabel(status: string): string {
  if (CUSTOMER_GOAL_OPTIONS.some((o) => o.value === status)) {
    return formatCustomerGoalLabel(status);
  }
  return status.replace(/_/g, " ");
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const style = statusStyles[status] || statusStyles.inactive;
  const label = badgeLabel(status);
  const isCanonicalGoal = CUSTOMER_GOAL_OPTIONS.some((o) => o.value === status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        !isCanonicalGoal && "capitalize",
        style
      )}
    >
      {label}
    </span>
  );
};
