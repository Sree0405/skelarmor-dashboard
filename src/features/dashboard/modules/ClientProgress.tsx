import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { SectionHeader } from "../components/SectionHeader";
import { ProgressDualCharts } from "../components/progress/ProgressDualCharts";
import { ProgressInsightCards } from "../components/progress/ProgressInsightCards";
import { ProgressRangeToggle, type ProgressTimeRange } from "../components/progress/ProgressRangeToggle";
import { useAuth } from "../../Login/useAuth";
import { useProgress } from "./customers/hooks/useCustomerQueries";
import { AddProgressCard } from "./customers/AddProgressCard";
import { ProgressHistoryCard } from "./customers/ProgressHistoryCard";

const filterMonths: Record<ProgressTimeRange, number> = { "3m": 3, "6m": 6, "1y": 12 };

export const ClientProgress = () => {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState<ProgressTimeRange>("6m");
  const { entries, stats } = useProgress(user?.id, filterMonths[timeFilter]);

  const chartData = useMemo(
    () =>
      entries.map((p) => ({
        ...p,
        label: new Date(p.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      })),
    [entries]
  );

  return (
    <div className="space-y-10 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <SectionHeader
          title="My progress"
          description="Track weight and body fat over time. Log check-ins to keep your charts meaningful."
        />
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          <LineChart className="h-4 w-4 text-primary shrink-0" />
          Trends update when you add entries below.
        </div>
      </motion.div>

      <AddProgressCard
        userId={user?.id}
        title="Log a check-in"
        description="Add weight and body fat % for any date — your charts refresh automatically."
        datePickerId="client-progress-checkin-date"
      />

      <GlassCard className="p-4 sm:p-5" hoverable={false} delay={0.08}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-foreground">Chart window</p>
          <ProgressRangeToggle value={timeFilter} onChange={setTimeFilter} layoutIdPrefix="client-progress" />
        </div>
      </GlassCard>

      {stats && (
        <ProgressInsightCards
          stats={stats}
          countLabel="Check-ins"
          countSublabel="In selected window"
          delays={[0.1, 0.14, 0.18]}
        />
      )}

      <ProgressDualCharts chartData={chartData} variant="client" />

      <ProgressHistoryCard userId={user?.id} subtitle="Full history, newest first" motionDelay={0.32} />
    </div>
  );
};
