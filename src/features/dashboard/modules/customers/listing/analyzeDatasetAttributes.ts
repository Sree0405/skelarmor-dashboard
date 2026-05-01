import { formatCustomerGoalLabel } from "../goalConstants";
import type { Customer } from "../types";
import type { DiscoveredFilterField, FilterOption } from "./types";

/**
 * Only these columns get filter UI — keeps the toolbar small and predictable.
 * (Numeric / provider / access fields are intentionally excluded.)
 */
const CUSTOMER_FILTER_FIELDS = ["status", "goal", "subscription"] as const;

const MAX_INLINE_UNIQUES = 24;

function isPrimitiveFilterable(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const t = typeof value;
  return t === "string" || t === "number" || t === "boolean";
}

function humanizeField(field: string): string {
  if (field === "goal") return "Goal";
  if (field === "status") return "Status";
  if (field === "subscription") return "Plan";
  return field
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Builds a fixed, small set of facet controls (status · goal · subscription) with
 * option hints from a recent sample when available.
 */
export function analyzeDatasetAttributes(samples: Customer[]): DiscoveredFilterField[] {
  const merged = new Map<string, Set<string>>();
  for (const field of CUSTOMER_FILTER_FIELDS) {
    merged.set(field, new Set());
  }

  for (const row of samples) {
    const rec = row as unknown as Record<string, unknown>;
    for (const field of CUSTOMER_FILTER_FIELDS) {
      const raw = rec[field];
      if (!isPrimitiveFilterable(raw)) continue;
      const str = String(raw);
      if (str.length > 80) continue;
      merged.get(field)!.add(str);
    }
  }

  return CUSTOMER_FILTER_FIELDS.map((field) => {
    const uniq = merged.get(field) ?? new Set();
    const options: FilterOption[] = [...uniq]
      .sort((a, b) => a.localeCompare(b))
      .slice(0, MAX_INLINE_UNIQUES)
      .map((value) => ({
        value,
        label:
          field === "goal"
            ? formatCustomerGoalLabel(value)
            : value || "—",
      }));
    const asyncOptions = uniq.size > MAX_INLINE_UNIQUES || uniq.size === 0;
    return {
      field,
      label: humanizeField(field),
      mode: "multi" as const,
      staticOptions: options,
      asyncOptions,
    };
  });
}
