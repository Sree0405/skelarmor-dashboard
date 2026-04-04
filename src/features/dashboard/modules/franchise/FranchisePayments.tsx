import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Clock3, Landmark } from "lucide-react";
import { GlassCard } from "@/features/dashboard/components/GlassCard";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import { useAuth } from "@/features/Login/useAuth";
import { FranchiseStatCard } from "./components/FranchiseStatCard";
import { useFranchiseProjectsList, useFranchiseUserPayments } from "./hooks/useFranchiseQueries";
import { computeFinancialSummaryFromProjects } from "@/features/dashboard/selectors";
import type { FranchisePayment } from "./types";
import { formatDisplayDate, formatInr } from "./utils/format";

function groupPaymentsByProject(payments: FranchisePayment[]): Map<string, FranchisePayment[]> {
  const m = new Map<string, FranchisePayment[]>();
  for (const p of payments) {
    const key = p.projectId || "unknown";
    const list = m.get(key) ?? [];
    list.push(p);
    m.set(key, list);
  }
  return m;
}

export function FranchisePayments() {
  const { user } = useAuth();
  const { data: projects = [] } = useFranchiseProjectsList(user?.id);
  const { data: payments = [], isLoading, isError, error, refetch } = useFranchiseUserPayments(user?.id);

  const projectFinancials = useMemo(() => computeFinancialSummaryFromProjects(projects), [projects]);

  const paidFromRows = useMemo(
    () => payments.filter((p) => p.type === "paid").reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  const grouped = useMemo(() => groupPaymentsByProject(payments), [payments]);

  const projectNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const pr of projects) m.set(pr.id, pr.projectName || "Project");
    return m;
  }, [projects]);

  const sections = useMemo(() => {
    const entries = Array.from(grouped.entries()).map(([projectId, rows]) => ({
      projectId,
      name: projectNameById.get(projectId) ?? rows[0]?.projectName ?? "Project",
      rows: [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }));
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }, [grouped, projectNameById]);

  return (
    <div className="space-y-10 max-w-7xl">
      <SectionHeader title="Payments" description="All transactions tied to your franchise account." />

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load payments."}{" "}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Retry
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FranchiseStatCard
          label="Total budget (projects)"
          value={formatInr(projectFinancials.totalBudget)}
          icon={Landmark}
          accent="blue"
          delay={0}
        />
        <FranchiseStatCard
          label="Total paid (ledger)"
          value={isLoading ? "…" : formatInr(paidFromRows)}
          sublabel="Sum of paid transactions below"
          icon={CheckCircle2}
          accent="emerald"
          delay={0.06}
        />
        <FranchiseStatCard
          label="Pending (projects)"
          value={formatInr(projectFinancials.totalPending)}
          sublabel="From project balances"
          icon={Clock3}
          accent="amber"
          delay={0.12}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <GlassCard className="p-12 text-center text-sm text-muted-foreground" hoverable={false}>
          No payment transactions yet.
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {sections.map((section, si) => (
            <motion.div
              key={section.projectId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05 }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{section.name}</h3>
                {section.projectId !== "unknown" && (
                  <Link
                    to={`/dashboard/franchise/projects/${section.projectId}`}
                    className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                  >
                    Project
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              <div className="space-y-2">
                {section.rows.map((pay, i) => (
                  <motion.div
                    key={pay.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col gap-3 rounded-2xl border border-border/55 bg-gradient-to-br from-secondary/35 to-secondary/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-lg font-semibold tabular-nums text-foreground">{formatInr(pay.amount)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDisplayDate(pay.date)}</p>
                      {pay.notes ? <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{pay.notes}</p> : null}
                    </div>
                    <StatusBadge status={pay.type} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
