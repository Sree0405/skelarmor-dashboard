export const formatInr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function dateRangeLabel(start: string | null | undefined, end: string | null | undefined): string {
  if (start && end) return `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`;
  if (start) return `From ${formatDisplayDate(start)}`;
  if (end) return `Until ${formatDisplayDate(end)}`;
  return "—";
}
