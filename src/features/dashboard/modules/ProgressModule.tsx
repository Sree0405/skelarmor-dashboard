import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { SectionHeader } from "../components/SectionHeader";
import { ProgressDualCharts } from "../components/progress/ProgressDualCharts";
import { ProgressInsightCards } from "../components/progress/ProgressInsightCards";
import { ProgressRangeToggle, type ProgressTimeRange } from "../components/progress/ProgressRangeToggle";
import {
  useCustomers,
  useProgress,
  customerDisplayName,
} from "./customers/hooks/useCustomerQueries";

const filterMonths: Record<ProgressTimeRange, number> = { "3m": 3, "6m": 6, "1y": 12 };

export const ProgressModule = () => {
  const { filtered: activeCustomers } = useCustomers("active");
  const [selectedId, setSelectedId] = useState("");
  const [timeFilter, setTimeFilter] = useState<ProgressTimeRange>("6m");

  const { entries, stats } = useProgress(selectedId, filterMonths[timeFilter]);

  useEffect(() => {
    if (activeCustomers.length === 0) {
      setSelectedId("");
      return;
    }
    if (!selectedId || !activeCustomers.some((c) => c.id === selectedId)) {
      setSelectedId(activeCustomers[0].id);
    }
  }, [activeCustomers, selectedId]);

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
      >
        <SectionHeader
          title="Progress tracking"
          description="Premium view of client weight and body fat trends — pick a profile and range to analyse."
        />
      </motion.div>

      <GlassCard className="p-4 sm:p-5" hoverable={false} delay={0.06}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Users className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active client</p>
              <label htmlFor="progress-client-select" className="sr-only">
                Select client
              </label>
              <select
                id="progress-client-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={activeCustomers.length === 0}
                className="mt-2 h-11 min-w-[220px] appearance-none rounded-xl border border-border/80 bg-secondary/50 bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat px-4 pr-10 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20 disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='hsl(215 12% 52%)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                }}
              >
                {activeCustomers.length === 0 ? (
                  <option value="">No active clients</option>
                ) : (
                  activeCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {customerDisplayName(c)}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          <ProgressRangeToggle value={timeFilter} onChange={setTimeFilter} layoutIdPrefix="admin-progress" />
        </div>
      </GlassCard>

      {activeCustomers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/10 px-6 py-16 text-center text-sm text-muted-foreground">
          No active training clients to display. Activate a customer to see progress analytics.
        </div>
      ) : (
        <>
          {stats && <ProgressInsightCards stats={stats} countLabel="Data points" countSublabel="In this range" />}
          <ProgressDualCharts chartData={chartData} variant="admin" />
        </>
      )}
    </div>
  );
};
