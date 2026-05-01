import {
  addMonths,
  startOfMonth,
  endOfDay,
  isWithinInterval,
  subMonths,
  isSameMonth,
  format,
} from "date-fns";
import type { ProgressEntry } from "../types";

export type ProgressChartRow = {
  id: string;
  label: string;
  weight: number | null;
  fatPercentage: number | null;
  checkInDate?: string;
};

/** Inclusive calendar window: current month plus the prior `monthSpan - 1` months. */
export function progressCalendarWindowBounds(monthSpan: number, now = new Date()) {
  const windowEnd = endOfDay(now);
  const windowStart = startOfMonth(subMonths(now, monthSpan - 1));
  return { windowStart, windowEnd };
}

/** Progress rows for `customerId` whose dates fall in the calendar month window. */
export function filterProgressInCalendarMonthWindow(
  progress: ProgressEntry[],
  customerId: string,
  monthSpan: number,
  now = new Date()
) {
  const { windowStart, windowEnd } = progressCalendarWindowBounds(monthSpan, now);
  return progress
    .filter((p) => {
      if (p.customerId !== customerId) return false;
      const d = new Date(p.date);
      if (Number.isNaN(d.getTime())) return false;
      return isWithinInterval(d, { start: windowStart, end: windowEnd });
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * One point per calendar month in the span. Multiple Progress in the same month use the latest
 * by date (removes duplicate month ticks that only showed "MMM yy").
 * Months with no log use null so the X-axis still lists every month in the range.
 */
export function buildMonthlyProgressChartData(
  entriesInWindow: ProgressEntry[],
  monthSpan: number,
  now = new Date()
): ProgressChartRow[] {
  const windowStart = startOfMonth(subMonths(now, monthSpan - 1));
  const lastMonthStart = startOfMonth(now);

  const months: Date[] = [];
  let cursor = windowStart;
  while (cursor <= lastMonthStart) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  const rows: ProgressChartRow[] = [];
  for (const monthStart of months) {
    const inMonth = entriesInWindow.filter((e) => {
      const d = new Date(e.date);
      return !Number.isNaN(d.getTime()) && isSameMonth(d, monthStart);
    });
    let pick: ProgressEntry | null = null;
    if (inMonth.length > 0) {
      pick = [...inMonth].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]!;
    }
    rows.push({
      id: `m-${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
      label: format(monthStart, "MMM yy"),
      weight: pick ? pick.weight : null,
      fatPercentage: pick ? pick.fatPercentage : null,
      checkInDate: pick?.date,
    });
  }
  return rows;
}
