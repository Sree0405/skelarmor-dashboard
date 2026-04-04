import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export const ProgressBar = ({ value, className = "", showLabel = true }: ProgressBarProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const color =
    clampedValue === 100
      ? "bg-emerald-500"
      : clampedValue >= 50
      ? "bg-primary"
      : "bg-accent";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground tabular-nums w-8 text-right">
          {clampedValue}%
        </span>
      )}
    </div>
  );
};
