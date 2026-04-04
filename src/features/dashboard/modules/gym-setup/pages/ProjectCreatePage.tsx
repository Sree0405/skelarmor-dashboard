import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/features/dashboard/components/GlassCard";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { DatePicker } from "@/components/shared/DatePicker";
import { useCreateProject, useFranchiseUsers } from "../hooks/useProjectQueries";
import type { Customer } from "@/features/dashboard/modules/customers/types";

function customerLabel(c: Customer): string {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return name || c.email || c.id;
}

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const createMut = useCreateProject();
  const { data: clients = [], isLoading: clientsLoading } = useFranchiseUsers();

  const [project_name, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [location_city, setLocationCity] = useState("");
  const [location_country, setLocationCountry] = useState("");
  const [total_amount, setTotalAmount] = useState("");
  const [start_date, setStartDate] = useState("");
  const [end_date, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState("0");
  const [status, setStatus] = useState("planning");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(total_amount);
    const prog = Number(progress);
    if (!project_name.trim()) {
      toast.error("Project name is required.");
      return;
    }
    if (!client) {
      toast.error("Select a client.");
      return;
    }
    if (Number.isNaN(total) || total <= 0) {
      toast.error("Enter a valid total / budget amount.");
      return;
    }
    if (Number.isNaN(prog) || prog < 0 || prog > 100) {
      toast.error("Progress must be between 0 and 100.");
      return;
    }
    try {
      const row = await createMut.mutateAsync({
        project_name: project_name.trim(),
        client,
        location_city: location_city.trim() || null,
        location_country: location_country.trim() || null,
        budget: total,
        total_amount: total,
        paid_amount: 0,
        pending_amount: total,
        start_date: start_date || null,
        end_date: end_date || null,
        description: description.trim() || null,
        progress: prog,
        status,
      });
      toast.success("Project created.");
      navigate(`/dashboard/admin/gym-setup/${row.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/admin/gym-setup" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <SectionHeader title="Create project" description="New gym setup project in Directus" />
      </div>

      <GlassCard className="p-6 max-w-2xl" hoverable={false}>
        <form onSubmit={onSubmit} className="space-y-4">
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
            <label className="text-xs text-muted-foreground">Client (user)</label>
            <select
              required
              value={client}
              onChange={(e) => setClient(e.target.value)}
              disabled={clientsLoading}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
            >
              <option value="">{clientsLoading ? "Loading…" : "Select client"}</option>
              {clients.map((c) => (
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
          <div>
            <label className="text-xs text-muted-foreground">Budget / total amount (INR)</label>
            <input
              required
              value={total_amount}
              onChange={(e) => setTotalAmount(e.target.value)}
              inputMode="decimal"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="p-start" className="text-xs text-muted-foreground">
                Start date
              </label>
              <div className="mt-1">
                <DatePicker id="p-start" value={start_date} onChange={setStartDate} placeholder="Start" />
              </div>
            </div>
            <div>
              <label htmlFor="p-end" className="text-xs text-muted-foreground">
                End date
              </label>
              <div className="mt-1">
                <DatePicker id="p-end" value={end_date} onChange={setEndDate} placeholder="End" />
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
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? "Creating…" : "Create project"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/dashboard/admin/gym-setup">Cancel</Link>
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
