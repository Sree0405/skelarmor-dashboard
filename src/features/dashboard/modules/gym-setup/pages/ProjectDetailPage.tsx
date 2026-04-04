import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/features/dashboard/components/GlassCard";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { ProgressBar } from "@/features/dashboard/components/ProgressBar";
import { DatePicker } from "@/components/shared/DatePicker";
import { useProject, useProjectPayments, useUpdateProject, useFranchiseUsers } from "../hooks/useProjectQueries";
import { ProjectPaymentsTable } from "../components/ProjectPaymentsTable";
import { AddProjectPaymentForm } from "../components/AddProjectPaymentForm";
import type { Customer } from "@/features/dashboard/modules/customers/types";

function customerLabel(c: Customer): string {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return name || c.email || c.id;
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading, isError, error, refetch } = useProject(projectId);
  const { data: payments = [], isLoading: payLoading } = useProjectPayments(projectId);
  const { data: clients = [] } = useFranchiseUsers();
  const updateMut = useUpdateProject();

  const clientOptions = useMemo(() => {
    if (!project) return clients;
    if (clients.some((c) => c.id === project.clientId)) return clients;
    const fallback: Customer = {
      id: project.clientId,
      email: project.clientName !== "—" ? project.clientName : project.clientId,
      first_name: null,
      last_name: null,
    };
    return [fallback, ...clients];
  }, [clients, project]);

  const [project_name, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [location_city, setLocationCity] = useState("");
  const [location_country, setLocationCountry] = useState("");
  const [total_amount, setTotalAmount] = useState("");
  const [paid_amount, setPaidAmount] = useState("");
  const [pending_amount, setPendingAmount] = useState("");
  const [start_date, setStartDate] = useState("");
  const [end_date, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState("0");
  const [status, setStatus] = useState("ongoing");

  useEffect(() => {
    if (!project) return;
    setProjectName(project.projectName ?? "");
    setClient(project.clientId);
    const parts = project.location.split(",").map((s) => s.trim());
    setLocationCity(parts[0] ?? "");
    setLocationCountry(parts[1] ?? "");
    setTotalAmount(String(project.totalAmount));
    setPaidAmount(String(project.paidAmount));
    setPendingAmount(String(project.pendingAmount));
    setStartDate(project.startDate?.slice(0, 10) ?? "");
    setEndDate(project.endDate?.slice(0, 10) ?? "");
    setDescription(project.description ?? "");
    setProgress(String(project.progress));
    setStatus(project.status);
  }, [project]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    const total = Number(total_amount);
    const paid = Number(paid_amount);
    const pending = Number(pending_amount);
    const prog = Number(progress);
    if (Number.isNaN(prog) || prog < 0 || prog > 100) {
      toast.error("Progress must be 0–100.");
      return;
    }
    try {
      await updateMut.mutateAsync({
        id: projectId,
        data: {
          project_name: project_name.trim(),
          client,
          location_city: location_city.trim() || null,
          location_country: location_country.trim() || null,
          budget: Number.isNaN(total) ? undefined : total,
          total_amount: Number.isNaN(total) ? undefined : total,
          paid_amount: Number.isNaN(paid) ? undefined : paid,
          pending_amount: Number.isNaN(pending) ? undefined : pending,
          start_date: start_date || null,
          end_date: end_date || null,
          description: description.trim() || null,
          progress: prog,
          status,
        },
      });
      toast.success("Project updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  if (!projectId) {
    return <p className="text-sm text-muted-foreground">Missing project id.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading project…</p>;
  }

  if (isError || !project) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Not found"}</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/admin/gym-setup">Back to list</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-0.5">
            <Link to="/dashboard/admin/gym-setup" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <SectionHeader title={project.projectName || "Project"} description={project.clientName} />
        </div>
      </div>

      <GlassCard className="p-6" hoverable={false}>
        <p className="text-xs text-muted-foreground mb-2">Completion</p>
        <ProgressBar value={project.progress} />
      </GlassCard>

      <GlassCard className="p-6 max-w-2xl" hoverable={false}>
        <h3 className="text-sm font-semibold text-foreground mb-4">Edit project</h3>
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Project name</label>
            <input
              required
              value={project_name}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Client</label>
            <select
              required
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
            >
              {clientOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {customerLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">City</label>
              <input
                value={location_city}
                onChange={(e) => setLocationCity(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Country</label>
              <input
                value={location_country}
                onChange={(e) => setLocationCountry(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Total (INR)</label>
              <input
                value={total_amount}
                onChange={(e) => setTotalAmount(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Paid (INR)</label>
              <input
                value={paid_amount}
                onChange={(e) => setPaidAmount(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Pending (INR)</label>
              <input
                value={pending_amount}
                onChange={(e) => setPendingAmount(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pd-start" className="text-xs text-muted-foreground">
                Start date
              </label>
              <div className="mt-1">
                <DatePicker id="pd-start" value={start_date} onChange={setStartDate} placeholder="Start" />
              </div>
            </div>
            <div>
              <label htmlFor="pd-end" className="text-xs text-muted-foreground">
                End date
              </label>
              <div className="mt-1">
                <DatePicker id="pd-end" value={end_date} onChange={setEndDate} placeholder="End" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/40 resize-y min-h-[5rem]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Progress (0–100)</label>
              <input
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                inputMode="numeric"
                className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
              >
                <option value="planning">planning</option>
                <option value="ongoing">ongoing</option>
                <option value="completed">completed</option>
              </select>
            </div>
          </div>
          <Button type="submit" disabled={updateMut.isPending}>
            {updateMut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </GlassCard>

      <AddProjectPaymentForm projectId={projectId} />
      <ProjectPaymentsTable payments={payments} isLoading={payLoading} />
    </div>
  );
}
