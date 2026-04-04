import { Users, UserCheck, Dumbbell, DollarSign } from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { SectionHeader } from "../components/SectionHeader";
import { useAdminKPIs } from "../hooks/useProjects";
import { ClientIntelligenceOverview } from "./ClientIntelligenceOverview";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const DashboardHome = () => {
  const kpis = useAdminKPIs();

  return (
    <div className="space-y-8 max-w-7xl">
      <SectionHeader
        title="Overview"
        description="Your fitness business at a glance"
      />

      <ClientIntelligenceOverview />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Customers"
          value={kpis.totalCustomers}
          subtitle={`${kpis.activeClients} currently active`}
          icon={Users}
          trend={{ value: 12.5, positive: true }}
          accentColor="blue"
          delay={0}
        />
        <DashboardCard
          title="Active Clients"
          value={kpis.activeClients}
          subtitle="Training this month"
          icon={UserCheck}
          trend={{ value: 8.3, positive: true }}
          accentColor="emerald"
          delay={0.08}
        />
        <DashboardCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          subtitle={`${kpis.ongoingProjects} active projects`}
          icon={DollarSign}
          accentColor="gold"
          delay={0.16}
        />
        <DashboardCard
          title="Gym Projects"
          value={kpis.totalProjects}
          subtitle={`${kpis.ongoingProjects} in progress`}
          icon={Dumbbell}
          accentColor="rose"
          delay={0.24}
        />
      </div>
    </div>
  );
};
