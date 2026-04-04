import { addMonths, isBefore, startOfDay } from "date-fns";
import type { Customer, CustomerPayment } from "../types";

export type SubscriptionPaymentStatus = "paid" | "pending";

export type PaymentScheduleInfo = {
  status: SubscriptionPaymentStatus;
  /** Latest **paid** payment (subscription anchor), if any */
  lastPaymentDate: Date | null;
  /** First day subscription is considered due / overdue */
  nextDueDate: Date | null;
};

const SUBSCRIPTION_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  halfyearly: 6,
  annually: 12,
};

function normalizeSubscriptionKey(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const k = raw.replace(/\s+/g, "").replace(/_/g, "").toLowerCase();
  if (k === "halfyearly") return "halfyearly";
  if (k === "monthly") return "monthly";
  if (k === "quarterly") return "quarterly";
  if (k === "annually" || k === "annual" || k === "yearly") return "annually";
  return null;
}

/** Months to add after a paid payment for the given subscription plan. */
export function subscriptionPeriodMonths(subscription: string | null | undefined): number | null {
  const key = normalizeSubscriptionKey(subscription);
  if (!key) return null;
  return SUBSCRIPTION_MONTHS[key] ?? null;
}

function parseDate(value: string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isPaidPayment(p: CustomerPayment): boolean {
  return String(p.type ?? "")
    .toLowerCase()
    .trim() === "paid";
}

/** Most recent paid payment by `date`. */
export function getLatestPaidPayment(payments: CustomerPayment[]): CustomerPayment | null {
  const paid = payments.filter(isPaidPayment);
  if (paid.length === 0) return null;
  return [...paid].sort((a, b) => {
    const ta = parseDate(a.date)?.getTime() ?? 0;
    const tb = parseDate(b.date)?.getTime() ?? 0;
    return tb - ta;
  })[0];
}

/**
 * Subscription coverage from latest **paid** payment + user `subscription` cadence.
 * `paid` while today is strictly before `nextDueDate`; otherwise `pending`.
 */
export function computePaymentScheduleInfo(
  user: Pick<Customer, "subscription">,
  payments: CustomerPayment[]
): PaymentScheduleInfo {
  const months = subscriptionPeriodMonths(
    typeof user.subscription === "string" ? user.subscription : undefined
  );
  const latestPaid = getLatestPaidPayment(payments);
  const lastPaymentDate = latestPaid ? parseDate(latestPaid.date) : null;

  if (months == null || lastPaymentDate == null) {
    return {
      status: "pending",
      lastPaymentDate,
      nextDueDate: null,
    };
  }

  const anchor = startOfDay(lastPaymentDate);
  const nextDueDate = startOfDay(addMonths(anchor, months));
  const today = startOfDay(new Date());
  const status: SubscriptionPaymentStatus = isBefore(today, nextDueDate) ? "paid" : "pending";

  return { status, lastPaymentDate, nextDueDate };
}

/** @see computePaymentScheduleInfo */
export function getPaymentStatus(
  user: Pick<Customer, "subscription">,
  payments: CustomerPayment[]
): SubscriptionPaymentStatus {
  return computePaymentScheduleInfo(user, payments).status;
}
