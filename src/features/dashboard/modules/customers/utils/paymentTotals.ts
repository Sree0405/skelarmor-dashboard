/** Normalize payment rows for dashboard totals (paid vs pending). */
export function sumPaymentsByType(
  payments: ReadonlyArray<{ amount?: unknown; type?: string | null }>
): { totalPaid: number; totalPending: number } {
  let totalPaid = 0;
  let totalPending = 0;
  for (const p of payments) {
    const amt = Number(p.amount);
    if (Number.isNaN(amt)) continue;
    const t = String(p.type ?? "")
      .toLowerCase()
      .trim();
    if (t === "paid") totalPaid += amt;
    else if (t === "pending") totalPending += amt;
  }
  return { totalPaid, totalPending };
}

/** Total of amounts recorded as paid (for "total amount paid" KPIs). */
export function totalAmountPaid(
  payments: ReadonlyArray<{ amount?: unknown; type?: string | null }>
): number {
  return sumPaymentsByType(payments).totalPaid;
}
