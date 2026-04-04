import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/features/dashboard/components/GlassCard";
import { ProgressBar } from "@/features/dashboard/components/ProgressBar";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import { useAuth } from "@/features/Login/useAuth";
import { FinancialStackedBar } from "./components/FinancialStackedBar";
import {
  useFranchisePaymentsForProject,
  useFranchiseProjectDetail,
} from "./hooks/useFranchiseQueries";
import { dateRangeLabel, formatDisplayDate, formatInr } from "./utils/format";

export function FranchiseProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { data: project, isLoading, isError, error } = useFranchiseProjectDetail(projectId);
  const { data: payments = [], isLoading: payLoading } = useFranchisePaymentsForProject(projectId);

  if (!projectId) return <Navigate to="/dashboard/franchise/projects" replace />;

  if (isLoading && !project) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="h-10 w-40 rounded-lg bg-secondary/50 animate-pulse" />
        <div className="h-64 rounded-2xl bg-secondary/30 animate-pulse" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="max-w-4xl space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link to="/dashboard/franchise/projects">
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>
        </Button>
        <GlassCard className="p-6 border-destructive/30" hoverable={false}>
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Project not found or unavailable."}
          </p>
        </GlassCard>
      </div>
    );
  }

  if (user?.id && project.clientId !== user.id) {
    return <Navigate to="/dashboard/franchise/projects" replace />;
  }

  const total = Math.max(project.totalAmount, project.paidAmount + project.pendingAmount, 1);

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2" asChild>
            <Link to="/dashboard/franchise/projects">
              <ArrowLeft className="h-4 w-4" />
              Projects
            </Link>
          </Button>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            {project.projectName || "Project"}
          </motion.h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {project.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {dateRangeLabel(project.startDate, project.endDate)}
            </span>
            <StatusBadge status={project.status} />
          </div>
        </div>
      </div>

      <GlassCard className="p-6 sm:p-8" hoverable={false} delay={0.05}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</h2>
        <div className="mt-6 flex flex-col sm:flex-row sm:items-end gap-6">
          <div className="text-5xl font-semibold tabular-nums text-foreground">{project.progress}%</div>
          <div className="flex-1 min-w-0 space-y-3">
            <ProgressBar value={project.progress} className="[&>div:first-child]:h-3" />
            <p className="text-sm text-muted-foreground">Completion based on your project milestones.</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6" hoverable={false} delay={0.08}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project info</h2>
          {project.description ? (
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">{project.description}</p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No description provided.</p>
          )}
          <dl className="mt-6 grid gap-3 text-sm">
            <div className="flex justify-between gap-4 border-t border-border/50 pt-3">
              <dt className="text-muted-foreground">Timeline</dt>
              <dd className="font-medium text-right">{project.timeline}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Budget (reference)</dt>
              <dd className="font-medium tabular-nums text-right">{formatInr(project.budget)}</dd>
            </div>
          </dl>
        </GlassCard>

        <GlassCard className="p-6" hoverable={false} delay={0.1}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial overview</h2>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Total</p>
                <p className="mt-1 font-semibold tabular-nums">{formatInr(project.totalAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Paid</p>
                <p className="mt-1 font-semibold tabular-nums text-emerald-400">{formatInr(project.paidAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Pending</p>
                <p className="mt-1 font-semibold tabular-nums text-amber-400">{formatInr(project.pendingAmount)}</p>
              </div>
            </div>
            <FinancialStackedBar paid={project.paidAmount} pending={project.pendingAmount} total={total} />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6" hoverable={false} delay={0.12}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payments</h2>
        <p className="text-sm text-muted-foreground mt-1">Transactions recorded for this project.</p>
        <div className="mt-6 space-y-3">
          {payLoading ? (
            <p className="text-sm text-muted-foreground">Loading payments…</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            payments.map((pay, i) => (
              <motion.div
                key={pay.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col gap-2 rounded-xl border border-border/50 bg-secondary/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold tabular-nums text-foreground">{formatInr(pay.amount)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDisplayDate(pay.date)}</p>
                  {pay.notes ? <p className="text-xs text-muted-foreground mt-1">{pay.notes}</p> : null}
                </div>
                <StatusBadge status={pay.type} />
              </motion.div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
