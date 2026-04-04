import { useMemo } from "react";
import {
  startOfDay,
  subDays,
  differenceInCalendarDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
} from "date-fns";
import {
  customerDisplayName,
  progressUserId,
  useCustomers,
  useFitnessProgressForUsers,
  usePaymentsForCustomerIds,
} from "@/features/dashboard/modules/customers/hooks/useCustomerQueries";
import type { Customer, CustomerPayment, FitnessProgress } from "@/features/dashboard/modules/customers/types";
import { computePaymentScheduleInfo } from "@/features/dashboard/modules/customers/utils/paymentSchedule";

export type ClientIntelTrend = { direction: "up" | "down" | "flat"; label: string };

export type ClientIntelAccent = "good" | "warn" | "risk" | "neutral";

export type ClientIntelCardData = {
  id: "active" | "joins" | "risk" | "expiry" | "top" | "revenue";
  title: string;
  metric: string;
  insight: string;
  trend?: ClientIntelTrend;
  accent: ClientIntelAccent;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function parseIsoDate(value: string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function readUserTimestamp(c: Customer, key: string): Date | null {
  const v = c[key];
  if (typeof v !== "string") return null;
  return parseIsoDate(v);
}

function isActiveStatus(c: Customer): boolean {
  return (c.status ?? "active") === "active";
}

function paymentUid(p: CustomerPayment): string | undefined {
  if (typeof p.user === "string") return p.user;
  return p.user?.id;
}

function isPaidRow(p: CustomerPayment): boolean {
  return String(p.type ?? "")
    .toLowerCase()
    .trim() === "paid";
}

function computeCards(
  customers: Customer[],
  progressRows: FitnessProgress[],
  payments: CustomerPayment[]
): ClientIntelCardData[] {
  const today = startOfDay(new Date());
  const weekStart = startOfDay(subDays(today, 6));
  const idSet = new Set(customers.map((c) => c.id));

  const byUserPayments = new Map<string, CustomerPayment[]>();
  for (const p of payments) {
    const uid = paymentUid(p);
    if (!uid || !idSet.has(uid)) continue;
    const arr = byUserPayments.get(uid) ?? [];
    arr.push(p);
    byUserPayments.set(uid, arr);
  }

  const lastProgressByUser = new Map<string, Date>();
  const sessionsThisWeekByUser = new Map<string, number>();

  for (const row of progressRows) {
    const uid = progressUserId(row, "");
    if (!uid || !idSet.has(uid)) continue;
    const d = parseIsoDate(row.date ?? undefined);
    if (!d) continue;
    const day = startOfDay(d);
    const prev = lastProgressByUser.get(uid);
    if (!prev || day > prev) lastProgressByUser.set(uid, day);
    if (isWithinInterval(day, { start: weekStart, end: today })) {
      sessionsThisWeekByUser.set(uid, (sessionsThisWeekByUser.get(uid) ?? 0) + 1);
    }
  }

  const activeList = customers.filter(isActiveStatus);
  const inactiveList = customers.filter((c) => !isActiveStatus(c));

  let inactiveSignalWeek = 0;
  for (const c of inactiveList) {
    const u = readUserTimestamp(c, "date_updated");
    if (!u) continue;
    const ud = startOfDay(u);
    if (isWithinInterval(ud, { start: weekStart, end: today })) inactiveSignalWeek++;
  }

  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const prevMonthStart = startOfMonth(subMonths(today, 1));
  const prevMonthEnd = endOfMonth(subMonths(today, 1));
  let joinsThisMonth = 0;
  let joinsLastMonth = 0;
  for (const c of customers) {
    const created = readUserTimestamp(c, "date_created");
    if (!created) continue;
    const cd = startOfDay(created);
    if (isWithinInterval(cd, { start: monthStart, end: monthEnd })) joinsThisMonth++;
    if (isWithinInterval(cd, { start: prevMonthStart, end: prevMonthEnd })) joinsLastMonth++;
  }

  let atRisk = 0;
  for (const c of activeList) {
    const last = lastProgressByUser.get(c.id);
    if (last == null) {
      atRisk++;
      continue;
    }
    if (differenceInCalendarDays(today, last) >= 5) atRisk++;
  }

  type Soon = { customer: Customer; days: number };
  const expiringSoon: Soon[] = [];
  for (const c of activeList) {
    if (c.subscription == null || String(c.subscription).trim() === "") continue;
    const pays = byUserPayments.get(c.id) ?? [];
    const { nextDueDate } = computePaymentScheduleInfo(c, pays);
    if (!nextDueDate) continue;
    const due = startOfDay(nextDueDate);
    const d = differenceInCalendarDays(due, today);
    if (d >= 0 && d <= 3) expiringSoon.push({ customer: c, days: d });
  }
  expiringSoon.sort((a, b) => a.days - b.days);

  const sortedActive = [...activeList].sort((a, b) =>
    customerDisplayName(a).localeCompare(customerDisplayName(b))
  );
  let bestId: string | null = null;
  let bestCount = -1;
  for (const c of sortedActive) {
    const n = sessionsThisWeekByUser.get(c.id) ?? 0;
    if (n > bestCount) {
      bestCount = n;
      bestId = c.id;
    }
  }

  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  let revThis = 0;
  let revPrev = 0;
  for (const p of payments) {
    if (!isPaidRow(p)) continue;
    const d = parseIsoDate(p.date ?? undefined);
    if (!d) continue;
    const day = startOfDay(d);
    const amt = Number(p.amount);
    if (Number.isNaN(amt)) continue;
    if (isWithinInterval(day, { start: thisMonthStart, end: thisMonthEnd })) revThis += amt;
    if (isWithinInterval(day, { start: prevMonthStart, end: prevMonthEnd })) revPrev += amt;
  }

  let revenueTrend: ClientIntelTrend | undefined;
  if (revPrev > 0) {
    const pct = Math.round(((revThis - revPrev) / revPrev) * 100);
    const direction: ClientIntelTrend["direction"] =
      pct > 0 ? "up" : pct < 0 ? "down" : "flat";
    revenueTrend = {
      direction,
      label: `${pct > 0 ? "↑" : pct < 0 ? "↓" : "→"} ${Math.abs(pct)}%`,
    };
  } else if (revThis > 0) {
    revenueTrend = { direction: "up", label: "New" };
  }

  const inactive = inactiveList.length;
  const activeCard: ClientIntelCardData = {
    id: "active",
    title: "Active roster",
    metric: `${activeList.length} Active`,
    insight:
      inactive === 0
        ? "Everyone on your active list"
        : inactiveSignalWeek > 0
          ? `${inactive} inactive · ${inactiveSignalWeek} moved this week`
          : `${inactive} inactive on file`,
    accent: inactive === 0 ? "good" : inactiveSignalWeek > 0 ? "warn" : "neutral",
  };

  const joinsInsight =
    joinsLastMonth > 0
      ? joinsThisMonth >= joinsLastMonth
        ? "Outpacing last month"
        : "Cooling vs prior month"
      : "This month";

  const joinsCard: ClientIntelCardData = {
    id: "joins",
    title: "New joins",
    metric: `+${joinsThisMonth}`,
    insight: joinsInsight,
    accent: joinsThisMonth > 0 ? "good" : "neutral",
  };

  const riskCard: ClientIntelCardData = {
    id: "risk",
    title: "At-risk",
    metric: `${atRisk}`,
    insight: atRisk === 0 ? "No silent clients" : "No log in 5+ days",
    accent: atRisk === 0 ? "good" : "risk",
  };

  const expiryCard: ClientIntelCardData = {
    id: "expiry",
    title: "Plan expiry",
    metric: `${expiringSoon.length}`,
    insight:
      expiringSoon.length === 0
        ? "No renewals in 3d window"
        : expiringSoon.length === 1
          ? `In ${expiringSoon[0].days}d · ${customerDisplayName(expiringSoon[0].customer)}`
          : `Nearest ${expiringSoon[0].days}d · ${expiringSoon.length} total`,
    accent: expiringSoon.length === 0 ? "good" : "warn",
  };

  const topCust = bestId ? customers.find((c) => c.id === bestId) : null;
  const topCard: ClientIntelCardData = {
    id: "top",
    title: "Top performer",
    metric: topCust && bestCount > 0 ? customerDisplayName(topCust) : "—",
    insight:
      bestCount > 0
        ? `${bestCount} check-in${bestCount === 1 ? "" : "s"} · rolling 7d`
        : "Log activity to rank",
    accent: bestCount > 0 ? "good" : "neutral",
  };

  const revCard: ClientIntelCardData = {
    id: "revenue",
    title: "Revenue pulse",
    metric: formatCurrency(revThis),
    insight: revPrev > 0 ? `vs ${formatCurrency(revPrev)} last month` : "Paid training · MTD",
    trend: revenueTrend,
    accent:
      revenueTrend?.direction === "up"
        ? "good"
        : revenueTrend?.direction === "down"
          ? "warn"
          : "neutral",
  };

  return [activeCard, joinsCard, riskCard, expiryCard, topCard, revCard];
}

export function useAdminClientIntelligence() {
  const { customers, isLoading: loadingCustomers, isError: errCustomers, error: customersError } =
    useCustomers("all");

  const ids = useMemo(() => customers.map((c) => c.id), [customers]);

  const {
    data: progressRows = [],
    isLoading: loadingProgress,
    isError: errProgress,
    error: progressError,
  } = useFitnessProgressForUsers(ids);

  const {
    data: payments = [],
    isLoading: loadingPayments,
    isError: errPayments,
    error: paymentsError,
  } = usePaymentsForCustomerIds(ids);

  const cards = useMemo(
    () => computeCards(customers, progressRows, payments),
    [customers, progressRows, payments]
  );

  const isLoading =
    loadingCustomers || (ids.length > 0 && (loadingProgress || loadingPayments));
  const isError = errCustomers || errProgress || errPayments;
  const error = customersError ?? progressError ?? paymentsError;

  return { cards, isLoading, isError, error };
}
