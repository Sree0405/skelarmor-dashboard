// features/dashboard/modules/leads/components/LeadsAnalyticsCard.tsx

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";
import { useLeads } from "../hooks/useLeads";
import { LeadsChart } from "./LeadsChart";
import { aggregateByService } from "../utils/aggregateByService";
import { services } from "../types/lead";

export function LeadsAnalyticsCard() {
  const { data = [], isLoading } = useLeads();

  const chartData = useMemo(() => aggregateByService(data), [data]);

  const total = data.length;
  const today = new Date().toDateString();
  const todayCount = data.filter(
    (l) => new Date(l.date).toDateString() === today
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <BarChart2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Leads by Service</h3>
          <p className="text-xs text-muted-foreground">Distribution overview</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Leads", value: isLoading ? "—" : total },
          { label: "Today",       value: isLoading ? "—" : todayCount },
          { label: "Services",    value: services.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5 text-center"
          >
            <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart / spinner */}
      {isLoading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="h-32 w-32 rounded-full border-4 border-border border-t-primary animate-spin" />
        </div>
      ) : (
        <LeadsChart data={chartData} />
      )}
    </motion.div>
  );
}
