import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GlassCard } from "../../components/GlassCard";
import { SectionHeader } from "../../components/SectionHeader";
import { StatusBadge } from "../../components/StatusBadge";
import {
  useCustomers,
  useCreateCustomer,
  usePaymentsForCustomerIds,
  customerDisplayName,
} from "./hooks/useCustomerQueries";
import { readCustomerWeight, readCustomerFatPct } from "./types";
import type { CustomerPayment } from "./types";
import { getPaymentStatus } from "./utils/paymentSchedule";

const ITEMS_PER_PAGE = 6;

function goalBadgeKey(goal: string | null | undefined): string {
  if (goal === "weight_loss" || goal === "weight_gain") return goal;
  return goal && goal.length > 0 ? goal : "planning";
}

function paymentOwnerId(p: CustomerPayment): string | undefined {
  if (typeof p.user === "string") return p.user;
  return p.user?.id;
}

export const CustomersModule = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
  const navigate = useNavigate();

  const { filtered: statusFiltered, total, activeCount, isLoading, isError, error, refetch } =
    useCustomers(statusFilter);
  const createMut = useCreateCustomer();

  const filtered = useMemo(() => {
    if (!search.trim()) return statusFiltered;
    const q = search.toLowerCase();
    return statusFiltered.filter((c) => {
      const name = customerDisplayName(c).toLowerCase();
      return name.includes(q) || (c.email ?? "").toLowerCase().includes(q);
    });
  }, [statusFiltered, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const pageIds = useMemo(() => paginated.map((c) => c.id), [paginated]);
  const { data: bulkPayments = [] } = usePaymentsForCustomerIds(pageIds);

  const paymentsByUser = useMemo(() => {
    const m = new Map<string, CustomerPayment[]>();
    for (const p of bulkPayments) {
      const uid = paymentOwnerId(p);
      if (!uid) continue;
      const list = m.get(uid) ?? [];
      list.push(p);
      m.set(uid, list);
    }
    return m;
  }, [bulkPayments]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      toast.error("Email and password are required.");
      return;
    }
    try {
      const row = await createMut.mutateAsync({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
      });
      toast.success("Customer created.");
      setCreateOpen(false);
      setForm({ email: "", password: "", first_name: "", last_name: "" });
      navigate(`/dashboard/admin/customers/${row.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create customer");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          title="Customers"
          description={`${total} training clients · ${activeCount} active`}
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <UserPlus className="h-4 w-4" />
              Add customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={submitCreate}>
              <DialogHeader>
                <DialogTitle>New training client</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Password</label>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">First name</label>
                    <input
                      value={form.first_name}
                      onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Last name</label>
                    <input
                      value={form.last_name}
                      onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isError && (
        <GlassCard className="p-4 border-destructive/30" hoverable={false}>
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load customers."}
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </GlassCard>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="h-10 w-full rounded-xl border border-border bg-secondary/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "inactive");
              setPage(0);
            }}
            className="h-10 appearance-none rounded-xl border border-border bg-secondary/50 pl-9 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </motion.div>

      <GlassCard className="overflow-hidden" hoverable={false} delay={0.15}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Age", "Goal", "Weight", "Fat %", "Status", "Billing"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Loading customers…
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No customers match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((c, i) => {
                  const rowW = readCustomerWeight(c);
                  const rowFat = readCustomerFatPct(c);
                  const rowPayments = paymentsByUser.get(c.id) ?? [];
                  const billingStatus = getPaymentStatus(c, rowPayments);
                  const billingPending = billingStatus === "pending";
                  return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/dashboard/admin/customers/${c.id}`)}
                    className={`border-b border-border/50 transition-colors hover:bg-surface-hover cursor-pointer ${
                      billingPending ? "bg-rose-500/[0.06] border-l-2 border-l-rose-500/50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {customerDisplayName(c)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground tabular-nums">
                      {c.age != null ? c.age : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={goalBadgeKey(typeof c.goal === "string" ? c.goal : null)} />
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground tabular-nums">
                      {rowW != null ? `${rowW} kg` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground tabular-nums">
                      {rowFat != null ? `${rowFat}%` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={(c.status as string) || "active"} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={billingStatus} />
                    </td>
                  </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {page * ITEMS_PER_PAGE + 1}–
              {Math.min((page + 1) * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPage(idx)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                    page === idx
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
