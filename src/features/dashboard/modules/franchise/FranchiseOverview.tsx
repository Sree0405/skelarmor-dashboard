import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, IndianRupee, Landmark, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { useAuth } from "@/features/Login/useAuth";
import { computeFinancialSummaryFromProjects } from "@/features/dashboard/selectors";
import { FranchiseStatCard } from "./components/FranchiseStatCard";
import { FranchiseProjectCard } from "./components/FranchiseProjectCard";
import { useFranchiseProjectsList } from "./hooks/useFranchiseQueries";
import { formatInr } from "./utils/format";

export function FranchiseOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projects = [], isLoading, isError, error, refetch } = useFranchiseProjectsList(user?.id);

  const financials = useMemo(() => computeFinancialSummaryFromProjects(projects), [projects]);

  const previewProjects = useMemo(
    () => [...projects].sort((a, b) => (b.status === "ongoing" ? 1 : 0) - (a.status === "ongoing" ? 1 : 0)).slice(0, 4),
    [projects]
  );

  return (
    <div className="space-y-10 max-w-7xl">
      <SectionHeader
        title={`Welcome back, ${user?.first_name || user?.email?.split("@")[0] || "there"}`}
        description="Your franchise workspace — budgets, projects, and payments in one place."
      />

      {isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error instanceof Error ? error.message : "Could not load projects."}
          <Button variant="outline" size="sm" className="ml-3 h-8" onClick={() => void refetch()}>
            Retry
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FranchiseStatCard
          label="Total budget allocated"
          value={isLoading ? "…" : formatInr(financials.totalBudget)}
          sublabel="Across all projects"
          icon={Landmark}
          accent="blue"
          delay={0}
        />
        <FranchiseStatCard
          label="Total paid"
          value={isLoading ? "…" : formatInr(financials.totalPaid)}
          sublabel={financials.totalBudget > 0 ? `${financials.paymentPercentage}% of budget` : "—"}
          icon={IndianRupee}
          accent="emerald"
          delay={0.06}
        />
        <FranchiseStatCard
          label="Total pending"
          value={isLoading ? "…" : formatInr(financials.totalPending)}
          sublabel="Outstanding on projects"
          icon={Wallet}
          accent="amber"
          delay={0.12}
        />
        <FranchiseStatCard
          label="Projects"
          value={isLoading ? "…" : String(projects.length)}
          sublabel={`${projects.filter((p) => p.status === "ongoing").length} in progress`}
          icon={Briefcase}
          accent="violet"
          delay={0.18}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Your projects</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track progress and open any project for full detail.</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link to="/dashboard/franchise/projects">View all projects</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 rounded-2xl border border-border/50 bg-secondary/20 animate-pulse"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/10 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">No projects are assigned to your account yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {previewProjects.map((p, i) => (
            <FranchiseProjectCard
              key={p.id}
              project={p}
              index={i}
              onOpen={() => navigate(`/dashboard/franchise/projects/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
