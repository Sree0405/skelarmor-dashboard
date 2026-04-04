import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export type PremiumStatAccent = "blue" | "emerald" | "amber" | "violet" | "rose";

type Props = {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  accent: PremiumStatAccent;
  delay?: number;
};

const ring: Record<PremiumStatAccent, string> = {
  blue: "from-primary/20 to-primary/5 border-primary/15 shadow-[0_0_32px_-8px_rgba(255,100,50,0.35)]",
  emerald: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 shadow-[0_0_28px_-8px_rgba(34,197,94,0.35)]",
  amber: "from-amber-500/15 to-amber-500/5 border-amber-500/20 shadow-[0_0_28px_-8px_rgba(245,158,11,0.25)]",
  violet: "from-violet-500/15 to-violet-500/5 border-violet-500/20 shadow-[0_0_28px_-10px_rgba(139,92,246,0.35)]",
  rose: "from-rose-500/15 to-rose-500/5 border-rose-500/25 shadow-[0_0_28px_-8px_rgba(244,63,94,0.28)]",
};

const iconTint: Record<PremiumStatAccent, string> = {
  blue: "text-primary",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  violet: "text-violet-400",
  rose: "text-rose-400",
};

export function PremiumStatCard({ label, value, sublabel, icon: Icon, accent, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${ring[accent]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
          {sublabel ? <p className="mt-1 text-xs text-muted-foreground leading-snug">{sublabel}</p> : null}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background/40 backdrop-blur-sm border border-white/5 ${iconTint[accent]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </motion.div>
  );
}
