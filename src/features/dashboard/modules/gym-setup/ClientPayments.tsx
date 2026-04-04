import { motion } from "framer-motion";
import { DollarSign, CheckCircle, Clock } from "lucide-react";
import { DashboardCard } from "../../components/DashboardCard";
import { GlassCard } from "../../components/GlassCard";
import { SectionHeader } from "../../components/SectionHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../../Login/useAuth";
import { useClientProjects } from "../../hooks/useProjects";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const ClientPayments = () => {
  const { user } = useAuth();
  const { projects: myProjects, payments: myPayments, financials } = useClientProjects(user?.id);

  return (
    <div className="space-y-6 max-w-7xl">
      <SectionHeader title="Payments" description="Track your payment history" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard
          title="Total Amount"
          value={formatCurrency(financials.totalBudget)}
          icon={DollarSign}
          accentColor="blue"
          delay={0}
        />
        <DashboardCard
          title="Total Paid"
          value={formatCurrency(financials.totalPaid)}
          icon={CheckCircle}
          accentColor="emerald"
          delay={0.08}
        />
        <DashboardCard
          title="Pending"
          value={formatCurrency(financials.totalPending)}
          icon={Clock}
          accentColor="gold"
          delay={0.16}
        />
      </div>

      {/* Payment History */}
      <GlassCard className="overflow-hidden" hoverable={false} delay={0.25}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Date", "Project", "Amount", "Status"].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myPayments.map((pay, i) => {
                const project = myProjects.find((p) => p.id === pay.projectId);
                return (
                  <motion.tr
                    key={pay.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 + i * 0.04 }}
                    className="border-b border-border/50 transition-colors hover:bg-surface-hover"
                  >
                    <td className="px-6 py-4 text-sm text-muted-foreground tabular-nums">
                      {new Date(pay.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {project?.projectName || project?.clientName || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground tabular-nums">
                      {formatCurrency(pay.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={pay.type} />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
