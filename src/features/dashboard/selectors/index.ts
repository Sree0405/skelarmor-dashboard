import type { ProgressEntry, GymProject, Payment } from "../types";
import type { Customer } from "../modules/customers/types";

// ── Customer Selectors ──

export const selectCustomersByStatus = (
  customers: Customer[],
  status: "active" | "inactive" | "all"
) =>
  status === "all"
    ? customers
    : customers.filter((c) => (c.status ?? "active") === status);

export const selectCustomerById = (customers: Customer[], id: string) =>
  customers.find((c) => c.id === id);

export const selectCustomersByClientId = (customers: Customer[], clientId: string) =>
  customers.filter((c) => c.id === clientId);

export const selectActiveCustomerByClientId = (customers: Customer[], clientId: string) =>
  customers.find((c) => c.id === clientId && (c.status ?? "active") === "active");

// ── Progress Selectors ──

export const selectProgressByCustomer = (progress: ProgressEntry[], customerId: string) =>
  progress
    .filter((p) => p.customerId === customerId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const selectProgressInRange = (
  progress: ProgressEntry[],
  customerId: string,
  months: number
) => {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return progress
    .filter((p) => p.customerId === customerId && new Date(p.date) >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const selectLatestProgress = (progress: ProgressEntry[], customerId: string) => {
  const sorted = selectProgressByCustomer(progress, customerId);
  return sorted[sorted.length - 1] ?? null;
};

export const computeProgressStats = (entries: ProgressEntry[]) => {
  if (entries.length < 2) return null;
  const first = entries[0];
  const last = entries[entries.length - 1];
  const weightChange = last.weight - first.weight;
  const fatChange = last.fatPercentage - first.fatPercentage;
  return {
    weightChange: Number(weightChange.toFixed(1)),
    fatChange: Number(fatChange.toFixed(1)),
    progressTrend: weightChange < 0 ? ("decreasing" as const) : ("increasing" as const),
    entries: entries.length,
  };
};

// ── Project Selectors ──

export const selectProjectsByClient = (projects: GymProject[], clientId: string) =>
  projects.filter((p) => p.clientId === clientId);

export const selectProjectById = (projects: GymProject[], id: string) =>
  projects.find((p) => p.id === id);

export const computeFinancialSummary = (projects: GymProject[], payments: Payment[]) => {
  const totalBudget = projects.reduce((s, p) => s + p.totalAmount, 0);
  const totalPaid = payments.filter((p) => p.type === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.type === "pending").reduce((s, p) => s + p.amount, 0);
  const paymentPercentage = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;
  return { totalBudget, totalPaid, totalPending, paymentPercentage };
};

/** Uses project `paid_amount` / `pending_amount` fields (Directus source of truth). */
export const computeFinancialSummaryFromProjects = (projects: GymProject[]) => {
  const totalBudget = projects.reduce((s, p) => s + p.totalAmount, 0);
  const totalPaid = projects.reduce((s, p) => s + p.paidAmount, 0);
  const totalPending = projects.reduce((s, p) => s + p.pendingAmount, 0);
  const paymentPercentage = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;
  return { totalBudget, totalPaid, totalPending, paymentPercentage };
};

export const selectPaymentsByProjects = (payments: Payment[], projectIds: string[]) =>
  payments
    .filter((p) => projectIds.includes(p.projectId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// ── Dashboard KPI Selectors ──

export const computeAdminKPIs = (
  customers: Customer[],
  projects: GymProject[],
  payments: Payment[]
) => ({
  totalCustomers: customers.length,
  activeClients: customers.filter((c) => c.status === "active").length,
  totalProjects: projects.length,
  ongoingProjects: projects.filter((p) => p.status === "ongoing").length,
  totalRevenue: projects.reduce((s, p) => s + p.paidAmount, 0),
});

export const computeClientKPIs = (projects: GymProject[], _payments: Payment[]) => {
  const { totalPaid, totalPending } = computeFinancialSummaryFromProjects(projects);
  return {
    totalPaid,
    totalPending,
    activeProjects: projects.filter((p) => p.status !== "completed").length,
    projectProgress: projects.find((p) => p.status === "ongoing")?.progress ?? 0,
  };
};
