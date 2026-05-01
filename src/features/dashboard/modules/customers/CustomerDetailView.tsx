import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/DatePicker";
import { GlassCard } from "../../components/GlassCard";
import { SectionHeader } from "../../components/SectionHeader";
import { StatusBadge } from "../../components/StatusBadge";
import {
  useCustomer,
  useCustomerPayments,
  useUpdateCustomer,
  useDeleteCustomer,
  useAddPayment,
  useUpdatePayment,
  customerDisplayName,
} from "./hooks/useCustomerQueries";
import { AddProgressCard } from "./AddProgressCard";
import { ProgressHistoryCard } from "./ProgressHistoryCard";
import { CUSTOMER_GOAL_OPTIONS, formatCustomerGoalLabel } from "./goalConstants";
import { readCustomerWeight, readCustomerFatPct } from "./types";
import { computePaymentScheduleInfo } from "./utils/paymentSchedule";
import { useCustomerDetailFormState } from "./useCustomerDetailFormState";

const SUBSCRIPTION_OPTIONS = ["Monthly", "Quarterly", "HalfYearly", "Annually"] as const;

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "INR" }).format(n);

function formatScheduleDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export type CustomerDetailViewMode = "admin" | "training";

export type CustomerDetailViewProps = {
  customerId: string;
  mode: CustomerDetailViewMode;
  /** When true (e.g. training profile), skip large title row */
  compact?: boolean;
};

export function CustomerDetailView({ customerId, mode, compact }: CustomerDetailViewProps) {
  const isAdmin = mode === "admin";
  const navigate = useNavigate();
  const { data: customer, isLoading, isError, error, refetch } = useCustomer(customerId);
  const { data: payments = [], isLoading: paymentsLoading } = useCustomerPayments(customerId);

  const updateMut = useUpdateCustomer();
  const deleteMut = useDeleteCustomer();
  const addPaymentMut = useAddPayment();
  const updatePaymentMut = useUpdatePayment();

  const { edit, setEdit, paymentForm, setPaymentForm } = useCustomerDetailFormState(customer);

  const sortedPayments = useMemo(
    () =>
      [...payments].sort(
        (a, b) => new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime()
      ),
    [payments]
  );

  const paymentSchedule = useMemo(
    () => (customer ? computePaymentScheduleInfo(customer, payments) : null),
    [customer, payments]
  );

  const saveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMut.mutateAsync({
        id: customerId,
        data: {
          first_name: edit.first_name.trim() || undefined,
          last_name: edit.last_name.trim() || undefined,
          email: edit.email.trim() || undefined,
          status: edit.status || undefined,
          age: edit.age ? Number(edit.age) : undefined,
          goal: edit.goal.trim() || undefined,
          currentWeight: edit.currentWeight ? Number(edit.currentWeight) : undefined,
          fatPercentage: edit.fatPercentage ? Number(edit.fatPercentage) : undefined,
          subscription: edit.subscription.trim() || undefined,
        },
      });
      toast.success("Customer updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const removeCustomer = async () => {
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    try {
      await deleteMut.mutateAsync(customerId);
      toast.success("Customer removed.");
      navigate("/dashboard/admin/customers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid payment amount.");
      return;
    }
    try {
      await addPaymentMut.mutateAsync({
        user: customerId,
        amount,
        date: paymentForm.date || undefined,
        type: paymentForm.type || undefined,
        notes: paymentForm.notes.trim() || null,
      });
      toast.success("Payment recorded.");
      setPaymentForm((p) => ({ ...p, amount: "", notes: "" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add payment");
    }
  };

  const markPaymentPaid = async (paymentId: string) => {
    try {
      await updatePaymentMut.mutateAsync({
        id: paymentId,
        userId: customerId,
        data: { type: "paid" },
      });
      toast.success("Payment marked as paid.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update payment");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl space-y-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="max-w-7xl space-y-4">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Unable to load profile."}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
        {isAdmin && (
          <Link
            to="/dashboard/admin/customers"
            className="block text-sm text-primary hover:underline"
          >
            Back to list
          </Link>
        )}
        {mode === "training" && (
          <Link to="/dashboard/training" className="block text-sm text-primary hover:underline">
            Back to overview
          </Link>
        )}
      </div>
    );
  }

  const profileReadOnly = (
    <dl className="grid gap-3 sm:grid-cols-2 text-sm">
      <div>
        <dt className="text-xs text-muted-foreground">Name</dt>
        <dd className="font-medium text-foreground mt-0.5">{customerDisplayName(customer)}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Email</dt>
        <dd className="font-medium text-foreground mt-0.5">{customer.email ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Status</dt>
        <dd className="mt-0.5">
          {customer.status ? <StatusBadge status={customer.status} /> : <span className="text-muted-foreground">—</span>}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Age</dt>
        <dd className="font-medium text-foreground mt-0.5">
          {customer.age != null ? String(customer.age) : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Goal</dt>
        <dd className="mt-0.5 font-medium text-foreground">
          {typeof customer.goal === "string" && customer.goal ? (
            CUSTOMER_GOAL_OPTIONS.some((o) => o.value === customer.goal) ? (
              <StatusBadge status={customer.goal} />
            ) : (
              <span>{formatCustomerGoalLabel(customer.goal)}</span>
            )
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Subscription</dt>
        <dd className="font-medium text-foreground mt-0.5">
          {customer.subscription?.trim() ? customer.subscription : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Current weight</dt>
        <dd className="font-medium text-foreground mt-0.5 tabular-nums">
          {readCustomerWeight(customer) != null ? `${readCustomerWeight(customer)} kg` : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Body fat</dt>
        <dd className="font-medium text-foreground mt-0.5 tabular-nums">
          {readCustomerFatPct(customer) != null ? `${readCustomerFatPct(customer)}%` : "—"}
        </dd>
      </div>
    </dl>
  );

  return (
    <div className="space-y-8 max-w-7xl">
      {!compact && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link
                to={isAdmin ? "/dashboard/admin/customers" : "/dashboard/training"}
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <SectionHeader
              title={customerDisplayName(customer)}
              description={customer.email ?? ""}
            />
          </div>
          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 shrink-0"
              onClick={() => void removeCustomer()}
              disabled={deleteMut.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      )}

      {compact && mode === "training" && (
        <SectionHeader
          title="Your billing & history"
          description="Read-only view of your plan, progress, and payments"
        />
      )}

      <GlassCard className="p-6" hoverable={false}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Subscription billing</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Plan</p>
            <p className="text-sm font-medium text-foreground">
              {customer.subscription?.trim() ? customer.subscription : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last payment (paid)</p>
            <p className="text-sm font-medium text-foreground tabular-nums">
              {formatScheduleDate(paymentSchedule?.lastPaymentDate ?? null)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Next due</p>
            <p className="text-sm font-medium text-foreground tabular-nums">
              {formatScheduleDate(paymentSchedule?.nextDueDate ?? null)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Coverage status</p>
            {paymentSchedule ? (
              <StatusBadge status={paymentSchedule.status} />
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </GlassCard>

      {mode === "training" ? (
        <>
          <GlassCard className="p-6" hoverable={false}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Your details</h3>
            {profileReadOnly}
          </GlassCard>
          <AddProgressCard
            userId={customerId}
            title="Log your Progress"
            description="Choose a date and enter your weight and body fat %."
            datePickerId="training-detail-progress-date"
          />
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6" hoverable={false}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Edit profile</h3>
            <form onSubmit={saveCustomer} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">First name</label>
                  <input
                    value={edit.first_name}
                    onChange={(e) => setEdit((s) => ({ ...s, first_name: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Last name</label>
                  <input
                    value={edit.last_name}
                    onChange={(e) => setEdit((s) => ({ ...s, last_name: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={edit.email}
                  onChange={(e) => setEdit((s) => ({ ...s, email: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <select
                    value={edit.status}
                    onChange={(e) => setEdit((s) => ({ ...s, status: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Age</label>
                  <input
                    value={edit.age}
                    onChange={(e) => setEdit((s) => ({ ...s, age: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Goal</label>
                <select
                  value={edit.goal}
                  onChange={(e) => setEdit((s) => ({ ...s, goal: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
                >
                  <option value="">Not set</option>
                  {CUSTOMER_GOAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                  {edit.goal.trim() &&
                    !CUSTOMER_GOAL_OPTIONS.some((o) => o.value === edit.goal) && (
                      <option value={edit.goal}>
                        {formatCustomerGoalLabel(edit.goal)} (saved)
                      </option>
                    )}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Subscription</label>
                <select
                  value={edit.subscription}
                  onChange={(e) => setEdit((s) => ({ ...s, subscription: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
                >
                  <option value="">Not set</option>
                  {SUBSCRIPTION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Current weight (kg)</label>
                  <input
                    value={edit.currentWeight}
                    onChange={(e) => setEdit((s) => ({ ...s, currentWeight: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Body fat %</label>
                  <input
                    value={edit.fatPercentage}
                    onChange={(e) => setEdit((s) => ({ ...s, fatPercentage: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
                    inputMode="decimal"
                  />
                </div>
              </div>
              <Button type="submit" disabled={updateMut.isPending}>
                {updateMut.isPending ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </GlassCard>

          <AddProgressCard userId={customerId} datePickerId="admin-customer-progress-date" />
        </div>
      )}

      <ProgressHistoryCard userId={customerId} />

      {isAdmin && (
        <GlassCard className="p-6" hoverable={false}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Record payment</h3>
          <form onSubmit={submitPayment} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="payment-date" className="text-xs text-muted-foreground">
                  Date
                </label>
                <div className="mt-1">
                  <DatePicker
                    id="payment-date"
                    value={paymentForm.date}
                    onChange={(date) => setPaymentForm((p) => ({ ...p, date }))}
                    placeholder="Payment date"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Amount (INR)</label>
                <input
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <select
                value={paymentForm.type}
                onChange={(e) => setPaymentForm((p) => ({ ...p, type: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
              >
                <option value="paid">paid</option>
                <option value="pending">pending</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notes</label>
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/40 resize-y min-h-[4.5rem]"
                placeholder="Optional"
              />
            </div>
            <Button type="submit" disabled={addPaymentMut.isPending}>
              {addPaymentMut.isPending ? "Saving…" : "Add payment"}
            </Button>
          </form>
        </GlassCard>
      )}

      <GlassCard className="overflow-hidden" hoverable={false}>
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Payment history</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Newest first</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {(isAdmin
                  ? (["Date", "Amount", "Type", "Notes", "Actions"] as const)
                  : (["Date", "Amount", "Type", "Notes"] as const)
                ).map((h) => (
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
              {paymentsLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-sm text-muted-foreground">
                    Loading payments…
                  </td>
                </tr>
              ) : sortedPayments.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-sm text-muted-foreground">
                    No payments yet.
                  </td>
                </tr>
              ) : (
                sortedPayments.map((pay) => {
                  const isPending =
                    String(pay.type ?? "")
                      .toLowerCase()
                      .trim() === "pending";
                  return (
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
                        className="px-6 py-3 text-sm text-muted-foreground max-w-xs align-top"
                        title={typeof pay.notes === "string" ? pay.notes : undefined}
                      >
                        <span className="line-clamp-2 break-words">
                          {pay.notes?.trim() ? pay.notes : "—"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-3 whitespace-nowrap">
                          {isPending ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              disabled={updatePaymentMut.isPending}
                              onClick={() => void markPaymentPaid(pay.id)}
                            >
                              Mark paid
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
