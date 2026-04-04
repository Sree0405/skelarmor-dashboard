import { motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { ProgressBar } from "@/features/dashboard/components/ProgressBar";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import type { GymProject } from "@/features/dashboard/types";
import { dateRangeLabel, formatInr } from "../utils/format";

type Props = {
  project: GymProject;
  index: number;
  onOpen: () => void;
};

export function FranchiseProjectCard({ project, index, onOpen }: Props) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      className="group w-full text-left rounded-2xl border border-border/60 bg-gradient-to-b from-secondary/40 to-secondary/10 p-5 shadow-sm ring-1 ring-white/[0.04] transition-shadow hover:shadow-lg hover:shadow-primary/5 hover:border-primary/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate pr-2 group-hover:text-primary transition-colors">
            {project.projectName || "Untitled project"}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {project.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {dateRangeLabel(project.startDate, project.endDate)}
            </span>
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary -translate-x-1 group-hover:translate-x-0" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-0.5 font-medium tabular-nums text-foreground">{formatInr(project.totalAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Paid</p>
          <p className="mt-0.5 font-medium tabular-nums text-emerald-400">{formatInr(project.paidAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pending</p>
          <p className="mt-0.5 font-medium tabular-nums text-amber-400">{formatInr(project.pendingAmount)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <ProgressBar value={project.progress} showLabel={false} />
        </div>
        <StatusBadge status={project.status} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground tabular-nums">{project.progress}% complete</p>
    </motion.button>
  );
}
