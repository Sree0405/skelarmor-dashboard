type TooltipPayload = {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
};

type Props = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
};

export function ProgressChartTooltip({ active, payload, label }: Props) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-background/95 backdrop-blur-md px-3 py-2.5 text-xs shadow-lg shadow-black/20 space-y-1">
      <p className="text-muted-foreground font-medium">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="font-semibold tabular-nums" style={{ color: p.color }}>
          {p.name}: {p.value}
          {p.dataKey === "fatPercentage" ? "%" : " kg"}
        </p>
      ))}
    </div>
  );
}
