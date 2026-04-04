type Props = {
  paid: number;
  pending: number;
  total: number;
  className?: string;
};

export function FinancialStackedBar({ paid, pending, total, className = "" }: Props) {
  const capped = Math.max(total, paid + pending, 1);
  const paidPct = Math.min(100, (paid / capped) * 100);
  const pendingPct = Math.min(100 - paidPct, (pending / capped) * 100);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary/80 ring-1 ring-border/60">
        <motionSegment width={paidPct} className="bg-gradient-to-r from-emerald-500 to-emerald-400" />
        <motionSegment width={pendingPct} className="bg-gradient-to-r from-amber-500 to-amber-400/90" />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Paid
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Pending
        </span>
      </div>
    </div>
  );
}

function motionSegment({ width, className }: { width: number; className: string }) {
  if (width <= 0) return null;
  return (
    <div
      className={`h-full transition-all duration-500 ease-out ${className}`}
      style={{ width: `${width}%` }}
    />
  );
}
