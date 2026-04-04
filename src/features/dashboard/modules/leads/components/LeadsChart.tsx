// features/dashboard/modules/leads/components/LeadsChart.tsx

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import type { ServiceSlice } from "../utils/aggregateByService";

const PALETTE = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e", "#a78bfa"];

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, icon } = payload[0].payload as ServiceSlice;
  return (
    <div className="rounded-xl border border-border bg-background/90 px-4 py-3 shadow-lg backdrop-blur-md text-sm">
      <p className="font-semibold text-foreground">{icon} {name}</p>
      <p className="text-muted-foreground mt-0.5">
        {value} lead{value !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

// ─── Custom legend ────────────────────────────────────────────────────────────
const CustomLegend = ({ data }: { data: ServiceSlice[] }) => (
  <div className="flex flex-wrap justify-center gap-3 mt-4">
    {data.map((entry, i) => (
      <div key={entry.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
        />
        {entry.icon} {entry.name}
        <span className="font-semibold text-foreground">({entry.value})</span>
      </div>
    ))}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
type Props = { data: ServiceSlice[] };

export function LeadsChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={64}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <CustomLegend data={data} />
    </div>
  );
}
