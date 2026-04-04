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
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  pending: "bg-accent/15 text-accent border-accent/20",
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const style = statusStyles[status] || statusStyles.inactive;
  const label = status.replace("_", " ");

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {label}
    </span>
  );
};
