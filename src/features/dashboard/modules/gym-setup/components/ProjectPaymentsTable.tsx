import { GlassCard } from "@/features/dashboard/components/GlassCard";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import type { Payment } from "@/features/dashboard/types";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "INR" }).format(n);

type Props = {
  payments: Payment[];
  isLoading?: boolean;
};

export function ProjectPaymentsTable({ payments, isLoading }: Props) {
  return (
    <GlassCard className="overflow-hidden" hoverable={false}>
      <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <h3 className="text-sm font-semibold text-foreground">Project payments</h3>
        <p className="text-xs text-muted-foreground mt-0.5">payment_context = project</p>
      </div>
      <div className="overflow-x-auto -mx-0">
        <table className="w-full min-w-[320px]">
          <thead>
            <tr className="border-b border-border">
              {["Date", "Amount", "Type", "Notes"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-3 sm:px-6 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 sm:px-6 text-sm text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 sm:px-6 text-sm text-muted-foreground">
                  No payments yet.
                </td>
              </tr>
            ) : (
              payments.map((pay) => (
                <tr key={pay.id} className="border-b border-border/50">
                  <td className="px-3 py-3 sm:px-6 text-sm text-foreground whitespace-nowrap">
                    {pay.date
                      ? new Date(pay.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-3 sm:px-6 text-sm font-medium tabular-nums whitespace-nowrap">
                    {formatCurrency(pay.amount)}
                  </td>
                  <td className="px-3 py-3 sm:px-6">
                    <StatusBadge status={pay.type} />
                  </td>
                  <td className="px-3 py-3 sm:px-6 text-sm text-muted-foreground max-w-[min(12rem,40vw)] sm:max-w-xs">
                    <span className="line-clamp-2 break-words">{pay.notes?.trim() ? pay.notes : "—"}</span>
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
