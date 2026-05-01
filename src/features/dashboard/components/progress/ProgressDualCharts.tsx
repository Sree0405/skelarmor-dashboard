import type { ReactNode } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { ProgressChartRow } from "../../utils/progressChartSeries";
import { GlassCard } from "../GlassCard";
import { ProgressChartTooltip } from "./ProgressChartTooltip";

function yExtent(
  values: (number | null | undefined)[],
  pad: number,
  fallback: [number, number]
): [number, number] {
  const finite = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (finite.length === 0) return fallback;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) return [min - pad, max + pad];
  return [min - pad, max + pad];
}

type Props = {
  chartData: ProgressChartRow[];
  leftDelay?: number;
  rightDelay?: number;
  /** "client" shortens copy slightly */
  variant?: "admin" | "client";
};

function PremiumChartCard({
  title,
  description,
  delay,
  children,
  accentClass,
}: {
  title: string;
  description: string;
  delay: number;
  children: ReactNode;
  accentClass: string;
}) {
  return (
    <GlassCard className="p-0 overflow-hidden border-border/60" hoverable={false} delay={delay}>
      <div
        className={`border-b border-border/50 bg-gradient-to-r px-5 py-4 ${accentClass}`}
      >
        <motion.h3
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.05 }}
          className="text-sm font-semibold text-foreground"
        >
          {title}
        </motion.h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </GlassCard>
  );
}

export function ProgressDualCharts({ chartData, leftDelay = 0.22, rightDelay = 0.28, variant = "admin" }: Props) {
  const weightDesc =
    variant === "client" ? "Your weight trend (kg)" : "Body weight trend for the selected client (kg)";
  const fatDesc = variant === "client" ? "Body fat % trend" : "Body fat % trend for the selected client";

  const weightDomain = useMemo(
    () => yExtent(
      chartData.map((r) => r.weight),
      2,
      [65, 95]
    ),
    [chartData]
  );
  const fatDomain = useMemo(
    () => yExtent(
      chartData.map((r) => r.fatPercentage),
      2,
      [12, 28]
    ),
    [chartData]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PremiumChartCard
        title="Weight"
        description={weightDesc}
        delay={leftDelay}
        accentClass="from-primary/[0.08] to-transparent"
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 16% / 0.65)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(215 12% 52%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                domain={weightDomain}
                tick={{ fill: "hsl(215 12% 52%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ProgressChartTooltip />} cursor={{ stroke: "hsl(215 90% 58% / 0.25)", strokeWidth: 1 }} />
              <Line
                type="linear"
                dataKey="weight"
                name="Weight"
                stroke="hsl(215 90% 58%)"
                strokeWidth={2.5}
                connectNulls={false}
                dot={{ fill: "hsl(215 90% 58%)", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PremiumChartCard>

      <PremiumChartCard
        title="Body fat"
        description={fatDesc}
        delay={rightDelay}
        accentClass="from-amber-500/[0.07] to-transparent"
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 16% / 0.65)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(215 12% 52%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                domain={fatDomain}
                tick={{ fill: "hsl(215 12% 52%)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ProgressChartTooltip />} cursor={{ stroke: "hsl(43 85% 55% / 0.25)", strokeWidth: 1 }} />
              <Line
                type="linear"
                dataKey="fatPercentage"
                name="Fat %"
                stroke="hsl(43 85% 55%)"
                strokeWidth={2.5}
                connectNulls={false}
                dot={{ fill: "hsl(43 85% 55%)", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PremiumChartCard>
    </div>
  );
}
