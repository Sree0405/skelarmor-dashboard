import { Users, Gauge } from "lucide-react";
import type { OrganizationDetailContext } from "../../types";
import { cn } from "@/lib/utils";

function readMaxUsers(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

/**
 * Read-only snapshot: user totals and limit usage. Add more metrics here as the product grows.
 */
export function OrganizationMetricsSection({
  organization,
  userCount,
  isUserCountPending,
}: OrganizationDetailContext) {
  const cap = readMaxUsers(organization.max_users);
  const ratio =
    isUserCountPending || cap == null || cap <= 0 ? null : Math.min(1, userCount / cap);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="h-4 w-4 text-white/50" />
        <h3 className="text-sm font-semibold text-foreground">Usage</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
            <Users className="h-3.5 w-3.5" />
            Users in organization
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-white/90">
            {isUserCountPending ? "…" : userCount}
          </p>
          {cap != null && !isUserCountPending && (
            <p className="mt-1 text-xs text-zinc-400">
              of {cap} allowed{userCount >= cap ? " (at limit)" : ""}
            </p>
          )}
        </div>
        {cap != null && !isUserCountPending && (
          <div className="flex flex-col justify-center rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-zinc-400">Capacity</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  ratio != null && ratio >= 1 ? "bg-rose-500/80" : "bg-primary/80"
                )}
                style={{ width: `${(ratio ?? 0) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {cap - userCount > 0 ? `${cap - userCount} seats remaining` : "No seats remaining"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
