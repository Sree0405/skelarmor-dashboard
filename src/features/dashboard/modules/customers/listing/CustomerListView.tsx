import { useCallback, useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { RotateCcw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GlassCard } from "@/features/dashboard/components/GlassCard";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import { customerDisplayName, usePaymentsForCustomerIds } from "../hooks/useCustomerQueries";
import * as customerService from "../services/customerService";
import type { CustomerPagedResult } from "./types";
import type { CustomerPayment } from "../types";
import { customerGoalBadgeKey } from "../goalConstants";
import { readCustomerFatPct, readCustomerWeight } from "../types";
import { getPaymentStatus } from "../utils/paymentSchedule";
import { analyzeDatasetAttributes } from "./analyzeDatasetAttributes";
import { AsyncFilterDropdown } from "./AsyncFilterDropdown";
import { CustomerFilterBarSkeleton, CustomerListTableSkeleton } from "./CustomerListSkeleton";
import { CustomerListPagination } from "./CustomerListPagination";
import type { CustomerListingUrlState } from "./useCustomerListingUrlState";

function paymentOwnerId(p: CustomerPayment): string | undefined {
  if (typeof p.user === "string") return p.user;
  return p.user?.id;
}

export type CustomerListViewProps = {
  url: CustomerListingUrlState;
  listQuery: UseQueryResult<CustomerPagedResult>;
  facetSamples: CustomerPagedResult | undefined;
  facetSamplesPending: boolean;
};

export function CustomerListView({ url, listQuery, facetSamples, facetSamplesPending }: CustomerListViewProps) {
  const navigate = useNavigate();

  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const pageIds = useMemo(() => rows.map((c) => c.id), [rows]);
  const { data: bulkPayments = [] } = usePaymentsForCustomerIds(pageIds);

  const paymentsByUser = useMemo(() => {
    const m = new Map<string, CustomerPayment[]>();
    for (const p of bulkPayments) {
      const uid = paymentOwnerId(p);
      if (!uid) continue;
      const list = m.get(uid) ?? [];
      list.push(p);
      m.set(uid, list);
    }
    return m;
  }, [bulkPayments]);

  const discovered = useMemo(
    () => analyzeDatasetAttributes(facetSamples?.data ?? []),
    [facetSamples?.data]
  );

  const loadHints = useCallback((field: string) => {
    return (q: string) => customerService.getCustomerFieldValueHints(field, q);
  }, []);

  const showFilterSkeleton = facetSamplesPending && !facetSamples;
  const showTableSkeleton = listQuery.isPending && !listQuery.data;

  const hasFacetFilters = useMemo(
    () => Object.values(url.facets).some((arr) => arr.length > 0),
    [url.facets]
  );
  const hasActiveFilters =
    Boolean(url.qCommitted.trim()) || hasFacetFilters || url.billingFilter !== "all";

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {showFilterSkeleton ? (
          <CustomerFilterBarSkeleton count={4} />
        ) : (
          <div className="rounded-xl border border-border/60 bg-muted/10 p-3 sm:p-3.5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Name or email…"
                    value={url.searchDraft}
                    onChange={(e) => url.setSearchDraft(e.target.value)}
                    className="h-9 rounded-lg border-border bg-background/90 pl-9 pr-3 text-sm shadow-sm"
                  />
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-1.5 lg:items-end">
                <span className="text-xs font-medium text-muted-foreground lg:text-right">Refine</span>
                <div className="flex flex-wrap items-center gap-2">
                  {discovered.map((meta) => (
                    <AsyncFilterDropdown
                      key={meta.field}
                      label={meta.label}
                      mode={meta.mode}
                      selected={url.facets[meta.field] ?? []}
                      onChange={(next) => url.updateFacet(meta.field, next)}
                      staticOptions={meta.staticOptions}
                      loadOptions={meta.asyncOptions ? loadHints(meta.field) : undefined}
                    />
                  ))}
                  <AsyncFilterDropdown
                    label="Payment"
                    mode="single"
                    selected={url.billingFilter === "all" ? [] : [url.billingFilter]}
                    onChange={(next) => {
                      const v = next[0];
                      url.setBillingFilter(v === "paid" || v === "pending" ? v : "all");
                    }}
                    staticOptions={[
                      { value: "pending", label: "Pending" },
                      { value: "paid", label: "Paid" },
                    ]}
                  />
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => url.clearAllFilters()}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset all
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {listQuery.isError && (
        <GlassCard className="border-destructive/30 p-4" hoverable={false}>
          <p className="text-sm text-destructive">
            {listQuery.error instanceof Error ? listQuery.error.message : "Could not load customers."}
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void listQuery.refetch()}>
            Retry
          </Button>
        </GlassCard>
      )}

      <GlassCard className="overflow-hidden" hoverable={false} delay={0.12}>
        <div className="overflow-x-auto">
          {showTableSkeleton ? (
            <CustomerListTableSkeleton rows={Math.min(url.pageSize, 12)} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  {["Name", "Age", "Goal", "Weight", "Fat %", "Status", "Billing"].map((h) => (
                    <TableHead
                      key={h}
                      className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      No customers match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((c, i) => {
                    const rowW = readCustomerWeight(c);
                    const rowFat = readCustomerFatPct(c);
                    const rowPayments = paymentsByUser.get(c.id) ?? [];
                    const billingStatus = getPaymentStatus(c, rowPayments);
                    const billingPending = billingStatus === "pending";
                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.25) }}
                        onClick={() => navigate(`/dashboard/admin/customers/${c.id}`)}
                        className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/40 ${
                          billingPending ? "border-l-2 border-l-rose-500/50 bg-rose-500/[0.06]" : ""
                        }`}
                      >
                        <TableCell className="px-6 py-4 text-sm font-medium text-foreground">
                          {customerDisplayName(c)}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm tabular-nums text-muted-foreground">
                          {c.age != null ? c.age : "—"}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge
                            status={customerGoalBadgeKey(typeof c.goal === "string" ? c.goal : null)}
                          />
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm tabular-nums text-foreground">
                          {rowW != null ? `${rowW} kg` : "—"}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm tabular-nums text-foreground">
                          {rowFat != null ? `${rowFat}%` : "—"}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={(c.status as string) || "active"} />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={billingStatus} />
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
        <CustomerListPagination
          page={url.page}
          pageSize={url.pageSize}
          pageSizes={url.pageSizes}
          total={total}
          onPageChange={url.setPage}
          onPageSizeChange={url.setPageSize}
        />
      </GlassCard>
    </div>
  );
}
