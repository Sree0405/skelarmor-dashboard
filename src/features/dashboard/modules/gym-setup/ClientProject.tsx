import { useMemo } from "react";
import { MapPin, Clock } from "lucide-react";
import { GlassCard } from "../../components/GlassCard";
import { SectionHeader } from "../../components/SectionHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { ProgressBar } from "../../components/ProgressBar";
import { useAuth } from "../../../Login/useAuth";
import { useClientProjects } from "../../hooks/useProjects";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const ClientProject = () => {
  const { user } = useAuth();
  const { projects: myProjects } = useClientProjects(user?.id);

  return (
    <div className="space-y-6 max-w-7xl">
      <SectionHeader
        title="My Projects"
        description={`${myProjects.length} project${myProjects.length !== 1 ? "s" : ""}`}
      />

      {myProjects.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-muted-foreground">No projects assigned yet</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {myProjects.map((project, i) => (
            <GlassCard key={project.id} className="p-6" delay={i * 0.1}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {project.projectName || project.clientName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {project.location}
                  </div>
                </div>
                <StatusBadge status={project.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Budget</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(project.budget)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Paid</p>
                  <p className="text-sm font-semibold text-emerald-400 tabular-nums">{formatCurrency(project.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pending</p>
                  <p className="text-sm font-semibold text-accent tabular-nums">{formatCurrency(project.pendingAmount)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm text-muted-foreground">{project.timeline}</span>
                </div>
              </div>

              <ProgressBar value={project.progress} />
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
