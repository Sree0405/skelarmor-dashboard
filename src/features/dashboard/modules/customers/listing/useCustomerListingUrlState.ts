import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "./useDebouncedValue";

export const CUSTOMER_LIST_PAGE_SIZES = [10, 25, 50, 100] as const;

function clampPageSize(n: number): (typeof CUSTOMER_LIST_PAGE_SIZES)[number] {
  if (CUSTOMER_LIST_PAGE_SIZES.includes(n as (typeof CUSTOMER_LIST_PAGE_SIZES)[number])) {
    return n as (typeof CUSTOMER_LIST_PAGE_SIZES)[number];
  }
  return 25;
}

function parseFilters(raw: string | null): Record<string, string[]> {
  if (!raw) return {};
  try {
    const decoded = decodeURIComponent(raw);
    const o = JSON.parse(decoded) as unknown;
    if (!o || typeof o !== "object" || Array.isArray(o)) return {};
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (Array.isArray(v)) out[k] = v.map(String).filter(Boolean);
      else if (typeof v === "string" && v) out[k] = [v];
      else if (typeof v === "number" || typeof v === "boolean") out[k] = [String(v)];
    }
    return out;
  } catch {
    return {};
  }
}

function serializeFilters(f: Record<string, string[]>): string | null {
  const cleaned: Record<string, string[]> = {};
  for (const [k, arr] of Object.entries(f)) {
    if (arr.length > 0) cleaned[k] = arr;
  }
  if (Object.keys(cleaned).length === 0) return null;
  return encodeURIComponent(JSON.stringify(cleaned));
}

/**
 * Listing URL contract (shareable / refresh-safe):
 * - `page` — 1-based page index
 * - `ps` — page size (10 | 25 | 50 | 100)
 * - `q` — server search string (updated from debounced draft)
 * - `filters` — URL-encoded JSON map of `{ field: string[] }`
 */
export function useCustomerListingUrlState() {
  const [params, setParams] = useSearchParams();

  const page = Math.max(1, Number(params.get("page") || "1") || 1);
  const pageSize = clampPageSize(Number(params.get("ps") || "25") || 25);
  const qCommitted = params.get("q") ?? "";
  const filtersParam = params.get("filters");
  const facets = useMemo(() => parseFilters(filtersParam), [filtersParam]);

  const [searchDraft, setSearchDraft] = useState(qCommitted);
  const debouncedSearch = useDebouncedValue(searchDraft, 400);

  useEffect(() => {
    setSearchDraft(qCommitted);
  }, [qCommitted]);

  useEffect(() => {
    if (debouncedSearch === qCommitted) return;
    const next = new URLSearchParams(params);
    if (debouncedSearch.trim()) next.set("q", debouncedSearch.trim());
    else next.delete("q");
    next.set("page", "1");
    setParams(next, { replace: true });
  }, [debouncedSearch, qCommitted, params, setParams]);

  const setPage = useCallback(
    (p: number) => {
      const next = new URLSearchParams(params);
      next.set("page", String(Math.max(1, p)));
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const setPageSize = useCallback(
    (ps: (typeof CUSTOMER_LIST_PAGE_SIZES)[number]) => {
      const next = new URLSearchParams(params);
      next.set("ps", String(ps));
      next.set("page", "1");
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const setFacets = useCallback(
    (nextFacets: Record<string, string[]>) => {
      const next = new URLSearchParams(params);
      const s = serializeFilters(nextFacets);
      if (s) next.set("filters", s);
      else next.delete("filters");
      next.set("page", "1");
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const updateFacet = useCallback(
    (field: string, values: string[]) => {
      const nextFacets = { ...facets };
      if (values.length === 0) delete nextFacets[field];
      else nextFacets[field] = values;
      setFacets(nextFacets);
    },
    [facets, setFacets]
  );

  const clearAllFilters = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete("filters");
    next.delete("q");
    next.set("page", "1");
    setSearchDraft("");
    setParams(next, { replace: true });
  }, [params, setParams]);

  return {
    page,
    pageSize,
    pageSizes: CUSTOMER_LIST_PAGE_SIZES,
    qCommitted,
    searchDraft,
    setSearchDraft,
    facets,
    updateFacet,
    setPage,
    setPageSize,
    clearAllFilters,
  };
}

export type CustomerListingUrlState = ReturnType<typeof useCustomerListingUrlState>;
