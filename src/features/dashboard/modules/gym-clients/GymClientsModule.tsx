import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus } from "lucide-react";
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
import { GlassCard } from "@/features/dashboard/components/GlassCard";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { customerDisplayName } from "@/features/dashboard/modules/customers/hooks/useCustomerQueries";
import type { GymClient } from "./types";
import { GymClientsKpiRow } from "./components/GymClientsKpiRow";
import { useCreateGymClient, useGymClientsWithStats } from "./hooks/useGymClientQueries";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function gymClientLocation(c: GymClient): string {
  const loc = c.location;
  if (typeof loc === "string" && loc.trim()) return loc.trim();
  return "—";
}

export function GymClientsModule() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    location: "",
  });
  const navigate = useNavigate();

  const { clients, statsById, isLoading, isError, error, refetch } = useGymClientsWithStats();
  const createMut = useCreateGymClient();

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => {
      const name = customerDisplayName(c).toLowerCase();
      return (
        name.includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        gymClientLocation(c).toLowerCase().includes(q)
      );
    });
  }, [clients, search]);

  const kpis = useMemo(() => {
    let paid = 0;
    let pending = 0;
    for (const c of clients) {
      const s = statsById.get(c.id);
      if (!s) continue;
      paid += s.totalPaid;
      pending += s.totalPending;
    }
    return { paid, pending };
  }, [clients, statsById]);

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
        location: form.location.trim() || null,
      });
      toast.success("Gym client created.");
      setCreateOpen(false);
      setForm({ email: "", password: "", first_name: "", last_name: "", location: "" });
      navigate(`/dashboard/admin/gym-clients/${row.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create client");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          title="Gym clients"
          description={
            isLoading ? "Loading…" : `${clients.length} franchise account(s) · projects and project payments`
          }
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <UserPlus className="h-4 w-4" />
              Add client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={submitCreate}>
              <DialogHeader>
                <DialogTitle>New gym / franchise client</DialogTitle>
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
                <div>
                  <label className="text-xs text-muted-foreground">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="City, region…"
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
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
            {error instanceof Error ? error.message : "Could not load gym clients."}
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </GlassCard>
      )}

      <GymClientsKpiRow clientCount={clients.length} totalPaid={kpis.paid} totalPending={kpis.pending} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-sm"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search name, email, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-secondary/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
        />
      </motion.div>

      <GlassCard className="overflow-hidden" hoverable={false} delay={0.12}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Email", "Location", "Projects", "Paid", "Pending"].map((h) => (
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
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Loading gym clients…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No franchise clients match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => {
                  const st = statsById.get(c.id) ?? { projectCount: 0, totalPaid: 0, totalPending: 0 };
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/dashboard/admin/gym-clients/${c.id}`)}
                      className="border-b border-border/50 transition-colors hover:bg-surface-hover cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{customerDisplayName(c)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{c.email ?? "—"}</td>
                      <td
                        className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate"
                        title={gymClientLocation(c)}
                      >
                        {gymClientLocation(c)}
                      </td>
                      <td className="px-6 py-4 text-sm tabular-nums text-foreground">{st.projectCount}</td>
                      <td className="px-6 py-4 text-sm tabular-nums text-emerald-400">{formatCurrency(st.totalPaid)}</td>
                      <td className="px-6 py-4 text-sm tabular-nums text-accent">{formatCurrency(st.totalPending)}</td>
                    </motion.tr>
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
