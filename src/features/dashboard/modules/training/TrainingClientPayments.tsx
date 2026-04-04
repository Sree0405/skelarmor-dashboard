import { useMemo } from "react";
import { GlassCard } from "../../components/GlassCard";
import { SectionHeader } from "../../components/SectionHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "@/features/Login/useAuth";
import { useCustomerPayments } from "../customers/hooks/useCustomerQueries";
import { totalAmountPaid } from "../customers/utils/paymentTotals";

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "INR" }).format(n);

export function TrainingClientPayments() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: payments = [], isLoading, isError, error, refetch } = useCustomerPayments(userId);

  const sorted = useMemo(
    () =>
      [...payments].sort(
        (a, b) => new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime()
      ),
    [payments]
  );

  const paidSum = useMemo(() => totalAmountPaid(payments), [payments]);

  if (!userId) {
    return (
      <div className="max-w-7xl space-y-4">
        <p className="text-sm text-muted-foreground">Sign in to view your payments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <SectionHeader
        title="Payments"
        description="Your payment history and total amount paid"
      />

      <GlassCard className="p-6" hoverable={false}>
        <p className="text-xs text-muted-foreground mb-1">Total amount paid</p>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{formatMoney(paidSum)}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Sum of all payments marked as paid. Pending amounts are listed below but not included here.
        </p>
      </GlassCard>

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load payments."}
        </p>
      )}

      <GlassCard className="overflow-hidden" hoverable={false}>
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Payment history</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Newest first · read-only</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {(["Date", "Amount", "Type", "Notes"] as const).map((h) => (
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
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-sm text-muted-foreground">
                    Loading payments…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-sm text-muted-foreground">
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                sorted.map((pay) => (
                  <tr key={pay.id} className="border-b border-border/50">
                    <td className="px-6 py-3 text-sm text-foreground">
                      {pay.date
                        ? new Date(pay.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium tabular-nums text-foreground">
                      {pay.amount != null && !Number.isNaN(Number(pay.amount))
                        ? formatMoney(Number(pay.amount))
                        : "—"}
                    </td>
                    <td className="px-6 py-3">
                      {pay.type ? (
                        <StatusBadge status={pay.type} />
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td
                      className="px-6 py-3 text-sm text-muted-foreground max-w-md align-top"
                      title={typeof pay.notes === "string" ? pay.notes : undefined}
                    >
                      <span className="line-clamp-3 break-words">
                        {pay.notes?.trim() ? pay.notes : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {isError && (
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      )}
    </div>
  );
}
