type TooltipPayload = {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
};

type Datum = { checkInDate?: string };

type Props = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
};

export function ProgressChartTooltip({ active, payload, label }: Props) {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload as Datum | undefined;
  const checkIn =
    datum?.checkInDate && !Number.isNaN(new Date(datum.checkInDate).getTime())
      ? new Date(datum.checkInDate).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;
  return (
    <div className="rounded-xl border border-border/60 bg-background/95 backdrop-blur-md px-3 py-2.5 text-xs shadow-lg shadow-black/20 space-y-1">
      <p className="text-muted-foreground font-medium">{label}</p>
      {checkIn ? <p className="text-[10px] text-muted-foreground/90">Progress: {checkIn}</p> : null}
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="font-semibold tabular-nums" style={{ color: p.color }}>
          {p.name}: {p.value == null ? "—" : p.value}
          {p.dataKey === "fatPercentage" ? "%" : " kg"}
        </p>
      ))}
    </div>
  );
}
