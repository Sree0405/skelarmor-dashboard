import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ProgressTimeRange = "3m" | "6m" | "1y";

const OPTIONS: { id: ProgressTimeRange; label: string }[] = [
  { id: "3m", label: "3 mo" },
  { id: "6m", label: "6 mo" },
  { id: "1y", label: "1 yr" },
];

type Props = {
  value: ProgressTimeRange;
  onChange: (v: ProgressTimeRange) => void;
  layoutIdPrefix: string;
  className?: string;
};

export function ProgressRangeToggle({ value, onChange, layoutIdPrefix, className }: Props) {
  return (
    <div
      className={cn(
        "inline-flex rounded-2xl border border-border/70 bg-secondary/40 p-1 shadow-inner shadow-black/10",
        className
      )}
      role="tablist"
      aria-label="Time range"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "relative rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-colors",
            value === opt.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {value === opt.id && (
            <motion.span
              layoutId={`${layoutIdPrefix}-range-pill`}
              className="absolute inset-0 z-0 rounded-xl bg-primary shadow-md shadow-primary/25"
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
