import { DollarSign, Clock } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/DashboardCard";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

type Props = {
  totalBudget: number;
  totalPaid: number;
  totalPending: number;
};

export function ProjectFinancialSummary({ totalBudget, totalPaid, totalPending }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <DashboardCard title="Total Budget" value={formatCurrency(totalBudget)} icon={DollarSign} accentColor="blue" delay={0} />
      <DashboardCard title="Total Paid" value={formatCurrency(totalPaid)} icon={DollarSign} accentColor="emerald" delay={0.08} />
      <DashboardCard title="Pending" value={formatCurrency(totalPending)} icon={Clock} accentColor="gold" delay={0.16} />
    </div>
  );
}
