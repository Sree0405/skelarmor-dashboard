import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Hash, Percent, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ProgressInsightStats = {
  weightChange: number;
  fatChange: number;
  entries: number;
};

type Trend = "improved" | "watch";

function ringForTrend(trend: Trend): string {
  return trend === "improved"
    ? "from-emerald-500/18 to-emerald-500/5 border-emerald-500/25 shadow-[0_0_28px_-8px_rgba(34,197,94,0.35)]"
    : "from-rose-500/15 to-rose-500/5 border-rose-500/25 shadow-[0_0_28px_-8px_rgba(244,63,94,0.28)]";
}

function InsightCard({
  label,
  value,
  sublabel,
  icon: Icon,
  trend,
  delay,
  iconClass,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon: LucideIcon;
  trend: Trend;
  delay: number;
  iconClass: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${ringForTrend(trend)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</div>
          {sublabel ? <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p> : null}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-background/40 backdrop-blur-sm ${iconClass}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </motion.div>
  );
}

const countRing =
  "from-violet-500/15 to-violet-500/5 border-violet-500/25 shadow-[0_0_28px_-10px_rgba(139,92,246,0.35)]";

function CountCard({
  label,
  value,
  sublabel,
  delay,
}: {
  label: string;
  value: string;
  sublabel?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${countRing}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-primary tabular-nums">{value}</p>
          {sublabel ? <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p> : null}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-background/40 text-violet-400 backdrop-blur-sm">
          <Hash className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </motion.div>
  );
}

type Props = {
  stats: ProgressInsightStats;
  countLabel?: string;
  countSublabel?: string;
  delays?: [number, number, number];
};

export function ProgressInsightCards({
  stats,
  countLabel = "Progress",
  countSublabel = "In selected range",
  delays = [0.08, 0.12, 0.16],
}: Props) {
  const weightTrend: Trend = stats.weightChange <= 0 ? "improved" : "watch";
  const fatTrend: Trend = stats.fatChange <= 0 ? "improved" : "watch";
  const wSign = stats.weightChange > 0 ? "+" : "";
  const fSign = stats.fatChange > 0 ? "+" : "";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <InsightCard
        label="Weight change"
        value={
          <span className={weightTrend === "improved" ? "text-emerald-400" : "text-rose-400"}>
            {wSign}
            {stats.weightChange} kg
          </span>
        }
        sublabel={weightTrend === "improved" ? "Trend in selected window" : "Review with your coach"}
        icon={Scale}
        trend={weightTrend}
        delay={delays[0]}
        iconClass={weightTrend === "improved" ? "text-emerald-400" : "text-rose-400"}
      />
      <InsightCard
        label="Body fat change"
        value={
          <span className={fatTrend === "improved" ? "text-emerald-400" : "text-rose-400"}>
            {fSign}
            {stats.fatChange}%
          </span>
        }
        sublabel={fatTrend === "improved" ? "Trend in selected window" : "Review with your coach"}
        icon={Percent}
        trend={fatTrend}
        delay={delays[1]}
        iconClass={fatTrend === "improved" ? "text-emerald-400" : "text-rose-400"}
      />
      <CountCard label={countLabel} value={String(stats.entries)} sublabel={countSublabel} delay={delays[2]} />
    </div>
  );
}
