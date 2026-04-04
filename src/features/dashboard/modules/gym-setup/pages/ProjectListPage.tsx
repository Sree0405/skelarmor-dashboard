import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/features/dashboard/components/GlassCard";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import { ProgressBar } from "@/features/dashboard/components/ProgressBar";
import { useProjects } from "@/features/dashboard/hooks/useProjects";
import { ProjectFinancialSummary } from "../components/ProjectFinancialSummary";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const COLS = ["Project", "Client", "Budget / Total", "Paid", "Pending", "Status", "Progress", "Actions"] as const;

export function ProjectListPage() {
  const { projects, financials, isLoading, isError, error, refetch } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Gym setup projects"
          description={
            isLoading
              ? "Loading…"
              : `${projects.length} project(s) · ${projects.filter((p) => p.status === "ongoing").length} in progress`
          }
        />
        <Button asChild className="gap-2 shrink-0">
          <Link to="/dashboard/admin/gym-setup/new">
            <Plus className="h-4 w-4" />
            Create project
          </Link>
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load projects"}
        </p>
      )}

      <ProjectFinancialSummary
        totalBudget={financials.totalBudget}
        totalPaid={financials.totalPaid}
        totalPending={financials.totalPending}
      />

      <GlassCard className="overflow-hidden" hoverable={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {COLS.map((h) => (
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
                  <td colSpan={8} className="px-6 py-10 text-sm text-muted-foreground">
                    Loading projects…
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-sm text-muted-foreground">
                    No projects yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 transition-colors hover:bg-surface-hover">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      <Link to={`/dashboard/admin/gym-setup/${p.id}`} className="text-primary hover:underline">
                        {p.projectName || "—"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{p.clientName}</td>
                    <td className="px-6 py-4 text-sm tabular-nums text-foreground">{formatCurrency(p.totalAmount)}</td>
                    <td className="px-6 py-4 text-sm tabular-nums text-emerald-400">{formatCurrency(p.paidAmount)}</td>
                    <td className="px-6 py-4 text-sm tabular-nums text-accent">{formatCurrency(p.pendingAmount)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4 w-44">
                      <ProgressBar value={p.progress} />
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/admin/gym-setup/${p.id}`}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {isError && (
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      )}
    </div>
  );
}
