import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  IndianRupee,
  Trophy,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminClientIntelligence, type ClientIntelCardData } from "@/features/dashboard/hooks/useAdminClientIntelligence";

const iconById: Record<ClientIntelCardData["id"], LucideIcon> = {
  active: Activity,
  joins: UserPlus,
  risk: AlertTriangle,
  expiry: CalendarClock,
  top: Trophy,
  revenue: IndianRupee,
};

const accentClass: Record<ClientIntelCardData["accent"], string> = {
  good: "border-l-emerald-400/70 shadow-emerald-500/5 hover:shadow-emerald-500/15",
  warn: "border-l-amber-400/70 shadow-amber-500/5 hover:shadow-amber-500/15",
  risk: "border-l-rose-400/80 shadow-rose-500/5 hover:shadow-rose-500/15",
  neutral: "border-l-white/20 shadow-white/5 hover:shadow-white/10",
};

const trendColor: Record<NonNullable<ClientIntelCardData["trend"]>["direction"], string> = {
  up: "text-emerald-400",
  down: "text-rose-400",
  flat: "text-zinc-400",
};

function IntelCard({ card }: { card: ClientIntelCardData }) {
  const Icon = iconById[card.id];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 border-l-[3px] bg-white/5 px-3.5 py-3 backdrop-blur-xl",
        "transition duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_0_28px_-6px_rgba(255,255,255,0.14)]",
        accentClass[card.accent]
      )}
    >
      <Icon
        className="pointer-events-none absolute -right-1 -top-1 h-14 w-14 text-white/[0.06] transition duration-200 group-hover:text-white/[0.09]"
        aria-hidden
      />
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{card.title}</p>
      <p className="mt-1.5 truncate text-xl font-bold tabular-nums tracking-tight text-white sm:text-2xl">
        {card.metric}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <p className="text-xs text-zinc-400">{card.insight}</p>
        {card.trend && (
          <span className={cn("text-xs font-semibold tabular-nums", trendColor[card.trend.direction])}>
            {card.trend.label}
          </span>
        )}
      </div>
    </div>
  );
}

function IntelSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 backdrop-blur-xl">
      <div className="h-3 w-24 rounded bg-white/10" />
      <div className="mt-3 h-8 w-20 rounded bg-white/10" />
      <div className="mt-2 h-3 w-32 rounded bg-white/[0.07]" />
    </div>
  );
}

export function ClientIntelligenceOverview() {
  const { cards, isLoading, isError } = useAdminClientIntelligence();
console.log(isError);
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Client intelligence</h2>
          <p className="text-xs text-zinc-400">Who needs you · what&apos;s growing · what&apos;s at risk</p>
        </div>
      </div>

      {isError && (
        <p className="text-xs text-rose-400/90">Could not load live signals. Refresh or check your session.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => <IntelSkeleton key={i} />)
          : cards.map((card) => <IntelCard key={card.id} card={card} />)}
      </div>
    </section>
  );
}
