import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Clock, DollarSign, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassCard } from "@/features/dashboard/components/GlassCard";
import { ProgressBar } from "@/features/dashboard/components/ProgressBar";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import { customerDisplayName } from "@/features/dashboard/modules/customers/hooks/useCustomerQueries";
import { DashboardCard } from "@/features/dashboard/components/DashboardCard";
import {
  useDeleteGymClient,
  useGymClient,
  useGymClientPayments,
  useGymClientProjects,
  useUpdateGymClient,
} from "./hooks/useGymClientQueries";
import type { GymClient, UpdateGymClientPayload } from "./types";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function formatPayDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function gymClientLocation(c: GymClient): string {
  const loc = c.location;
  if (typeof loc === "string" && loc.trim()) return loc.trim();
  return "—";
}

export function GymClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clientId = id ?? "";

  const { data: client, isLoading, isError, error, refetch } = useGymClient(clientId || undefined);
  const { data: projects = [], isLoading: projLoading } = useGymClientProjects(clientId || undefined);
  const { data: payments = [], isLoading: payLoading } = useGymClientPayments(clientId || undefined);

  const updateMut = useUpdateGymClient();
  const deleteMut = useDeleteGymClient();

  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState({
    email: "",
    first_name: "",
    last_name: "",
    location: "",
    password: "",
  });

  useEffect(() => {
    if (!client) return;
    setEdit({
      email: client.email ?? "",
      first_name: (client.first_name as string | null | undefined) ?? "",
      last_name: (client.last_name as string | null | undefined) ?? "",
      location: typeof client.location === "string" ? client.location : "",
      password: "",
    });
  }, [client]);

  const summary = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;
    for (const p of projects) {
      totalPending += p.pendingAmount;
    }
    for (const pay of payments) {
      if (pay.type === "paid") totalPaid += pay.amount;
    }
    return {
      projectCount: projects.length,
      totalPaid,
      totalPending,
    };
  }, [projects, payments]);

  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    try {
      const payload: UpdateGymClientPayload = {
        email: edit.email.trim() || undefined,
        first_name: edit.first_name.trim() || null,
        last_name: edit.last_name.trim() || null,
        location: edit.location.trim() || null,
      };
      if (edit.password.trim()) payload.password = edit.password.trim();
      await updateMut.mutateAsync({ id: clientId, data: payload });
      toast.success("Client updated.");
      setEditOpen(false);
      setEdit((s) => ({ ...s, password: "" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const removeClient = async () => {
    if (!clientId) return;
    if (!window.confirm("Delete this gym client? Linked projects may need manual cleanup in Directus.")) return;
    try {
      await deleteMut.mutateAsync(clientId);
      toast.success("Client removed.");
      navigate("/dashboard/admin/gym-clients");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (!clientId) {
    return (
      <div className="max-w-7xl">
        <p className="text-sm text-muted-foreground">Missing client id.</p>
      </div>
    );
  }

  if (isLoading && !client) {
    return (
      <div className="max-w-7xl space-y-4">
        <p className="text-sm text-muted-foreground">Loading client…</p>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="max-w-7xl space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link to="/dashboard/admin/gym-clients">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <GlassCard className="p-4 border-destructive/30" hoverable={false}>
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load this client."}
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2" asChild>
            <Link to="/dashboard/admin/gym-clients">
              <ArrowLeft className="h-4 w-4" />
              All gym clients
            </Link>
          </Button>
          <SectionHeader title={customerDisplayName(client)} description={client.email ?? ""} />
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            disabled={deleteMut.isPending}
            onClick={() => void removeClient()}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard
          title="Projects"
          value={String(summary.projectCount)}
          icon={Building2}
          accentColor="blue"
          delay={0}
        />
        <DashboardCard
          title="Paid (payments)"
          value={formatCurrency(summary.totalPaid)}
          icon={DollarSign}
          accentColor="emerald"
          delay={0.06}
        />
        <DashboardCard
          title="Pending (projects)"
          value={formatCurrency(summary.totalPending)}
          icon={Clock}
          accentColor="gold"
          delay={0.12}
        />
      </div>

      <GlassCard className="p-6" hoverable={false}>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Client info</h3>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium text-foreground mt-0.5">{customerDisplayName(client)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium text-foreground mt-0.5">{client.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Location</dt>
            <dd className="font-medium text-foreground mt-0.5">{gymClientLocation(client)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Account type</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">Franchise / gym client</dd>
          </div>
        </dl>
      </GlassCard>

      <GlassCard className="overflow-hidden" hoverable={false}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Projects</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Project", "Total", "Paid", "Pending", "Status", "Progress"].map((h) => (
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
              {projLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-sm text-muted-foreground">
                    Loading projects…
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-sm text-muted-foreground">
                    No projects yet.{" "}
                    <Link to="/dashboard/admin/gym-setup/new" className="text-primary hover:underline">
                      Create a project
                    </Link>
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-surface-hover/80">
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link to={`/dashboard/admin/gym-setup/${p.id}`} className="text-primary hover:underline">
                        {p.projectName || "—"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm tabular-nums">{formatCurrency(p.totalAmount)}</td>
                    <td className="px-6 py-4 text-sm tabular-nums text-emerald-400">{formatCurrency(p.paidAmount)}</td>
                    <td className="px-6 py-4 text-sm tabular-nums text-accent">{formatCurrency(p.pendingAmount)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4 w-44">
                      <ProgressBar value={p.progress} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden" hoverable={false}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Project payments (this client)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Amount", "Date", "Type", "Project"].map((h) => (
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
              {payLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-sm text-muted-foreground">
                    Loading payments…
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-sm text-muted-foreground">
                    No project payments recorded for this user yet.
                  </td>
                </tr>
              ) : (
                payments.map((pay) => (
                  <tr key={pay.id} className="border-b border-border/50 hover:bg-surface-hover/80">
                    <td className="px-6 py-4 text-sm tabular-nums font-medium">{formatCurrency(pay.amount)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatPayDate(pay.date)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={pay.type} />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {pay.projectId ? (
                        <Link
                          to={`/dashboard/admin/gym-setup/${pay.projectId}`}
                          className="text-primary hover:underline"
                        >
                          {pay.projectName}
                        </Link>
                      ) : (
                        pay.projectName
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={saveClient}>
            <DialogHeader>
              <DialogTitle>Edit client</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <input
                  required
                  type="email"
                  value={edit.email}
                  onChange={(e) => setEdit((s) => ({ ...s, email: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">First name</label>
                  <input
                    value={edit.first_name}
                    onChange={(e) => setEdit((s) => ({ ...s, first_name: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Last name</label>
                  <input
                    value={edit.last_name}
                    onChange={(e) => setEdit((s) => ({ ...s, last_name: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Location</label>
                <input
                  value={edit.location}
                  onChange={(e) => setEdit((s) => ({ ...s, location: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">New password (optional)</label>
                <input
                  type="password"
                  value={edit.password}
                  onChange={(e) => setEdit((s) => ({ ...s, password: e.target.value }))}
                  placeholder="Leave blank to keep current"
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMut.isPending}>
                {updateMut.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
