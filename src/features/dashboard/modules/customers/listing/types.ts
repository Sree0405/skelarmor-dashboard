import type { Customer } from "../types";

/** Derived from subscription + payments; not a Directus `users` field. */
export type BillingFilter = "all" | "paid" | "pending";

/** Server-driven list request (URL + toolbar state maps here). */
export type CustomerPagedRequest = {
  page: number;
  pageSize: number;
  /** Debounced search across name + email (server-side `_icontains`). */
  q: string;
  /**
   * Facet filters: field key → selected raw values (strings).
   * Built into Directus `_in` / `_eq` clauses — no hardcoded field list in the UI layer.
   */
  facets: Record<string, string[]>;
  /**
   * When not `all`, loads all rows matching `q` + `facets`, merges payments, filters by
   * `getPaymentStatus`, then paginates in-app (billing is not expressible in `/users` filter).
   */
  billingFilter: BillingFilter;
};

export type CustomerPagedResult = {
  data: Customer[];
  /** Total rows matching filter (Directus `meta.filter_count` when available). */
  total: number;
};

export type FilterOption = { value: string; label: string };

/** Describes one discoverable facet for the adaptive filter bar. */
export type DiscoveredFilterField = {
  field: string;
  label: string;
  mode: "single" | "multi";
  /** Options known from recent samples (may be partial). */
  staticOptions: FilterOption[];
  /** When true, dropdown also loads options asynchronously (large cardinality). */
  asyncOptions: boolean;
};
