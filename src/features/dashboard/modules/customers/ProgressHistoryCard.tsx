import { useMemo } from "react";
import { GlassCard } from "../../components/GlassCard";
import { useCustomerProgress } from "./hooks/useCustomerQueries";

export type ProgressHistoryCardProps = {
  userId: string | undefined;
  /** Subtitle under the title (default: "Newest first") */
  subtitle?: string;
  motionDelay?: number;
};

export function ProgressHistoryCard({
  userId,
  subtitle = "Newest first",
  motionDelay = 0,
}: ProgressHistoryCardProps) {
  const { data: progress = [], isLoading: progressLoading } = useCustomerProgress(userId);

  const sortedProgress = useMemo(
    () =>
      [...progress].sort(
        (a, b) => new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime()
      ),
    [progress]
  );

  return (
    <GlassCard className="overflow-hidden" hoverable={false} delay={motionDelay}>
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground">Progress history</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Date", "Weight", "Fat %"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!userId ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-sm text-muted-foreground">
                  Sign in to view progress history.
                </td>
              </tr>
            ) : progressLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-sm text-muted-foreground">
                  Loading progress…
                </td>
              </tr>
            ) : sortedProgress.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-sm text-muted-foreground">
                  No progress entries yet.
                </td>
              </tr>
            ) : (
              sortedProgress.map((p) => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="px-6 py-3 text-sm text-foreground">
                    {p.date
                      ? new Date(p.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-6 py-3 text-sm tabular-nums">{p.weight ?? "—"} kg</td>
                  <td className="px-6 py-3 text-sm tabular-nums">
                    {p.fat_percentage != null || p.fatPercentage != null
                      ? `${p.fat_percentage ?? p.fatPercentage}%`
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
