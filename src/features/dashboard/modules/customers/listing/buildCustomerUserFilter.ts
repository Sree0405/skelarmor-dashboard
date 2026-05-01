import { TRAINING_CLIENT_ROLE } from "../types";

const NUMBER_FIELDS = new Set(["age", "currentWeight", "fatPercentage", "current_weight", "fat_percentage"]);

function toFilterPrimitive(field: string, raw: string): string | number | boolean {
  const t = raw.trim();
  if (t === "true" || t === "false") return t === "true";
  if (NUMBER_FIELDS.has(field)) {
    const n = Number(t);
    return Number.isFinite(n) ? n : t;
  }
  return raw;
}

/**
 * Builds a Directus-style `filter` object for `/users` (merged with org scope in `apiClient`).
 */
export function buildCustomerUserFilter(params: {
  q: string;
  facets: Record<string, string[]>;
}): Record<string, unknown> {
  const clauses: Record<string, unknown>[] = [{ dashboard_roles: { _eq: TRAINING_CLIENT_ROLE } }];

  const q = params.q.trim();
  if (q.length > 0) {
    clauses.push({
      _or: [
        { first_name: { _icontains: q } },
        { last_name: { _icontains: q } },
        { email: { _icontains: q } },
      ],
    });
  }

  for (const [field, values] of Object.entries(params.facets)) {
    const cleaned = values.map((v) => String(v).trim()).filter(Boolean);
    if (cleaned.length === 0) continue;
    if (cleaned.length === 1) {
      clauses.push({ [field]: { _eq: toFilterPrimitive(field, cleaned[0]!) } });
    } else {
      clauses.push({
        [field]: { _in: cleaned.map((v) => toFilterPrimitive(field, v)) },
      });
    }
  }

  if (clauses.length === 1) return clauses[0]!;
  return { _and: clauses };
}
