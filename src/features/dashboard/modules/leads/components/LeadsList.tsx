// features/dashboard/modules/leads/components/LeadsList.tsx

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, RefreshCw, AlertCircle, Inbox } from "lucide-react";
import { useLeads } from "../hooks/useLeads";
import { LeadCard } from "./LeadCard";
import { services } from "../types/lead";

const ITEMS_PER_PAGE = 6;

export function LeadsList() {
  const { data = [], isLoading, isError, error, refetch } = useLeads();

  const [search,        setSearch]        = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [page,          setPage]          = useState(0);

  const filtered = useMemo(() => {
    let result = data;
    if (serviceFilter !== "all") {
      result = result.filter((l) => l.service === serviceFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.fullName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, serviceFilter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const resetPage = () => setPage(0);

  // ── Loading skeleton ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-card/40" />
        ))}
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {error?.message ?? "Failed to load leads"}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5
                     text-xs font-medium text-primary-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Filters ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email or message…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="h-10 w-full rounded-xl border border-border bg-secondary/50 pl-9 pr-3 text-sm
                       text-foreground placeholder:text-muted-foreground outline-none
                       transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Service filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={serviceFilter}
            onChange={(e) => { setServiceFilter(e.target.value); resetPage(); }}
            className="h-10 appearance-none rounded-xl border border-border bg-secondary/50
                       pl-9 pr-8 text-sm text-foreground outline-none cursor-pointer
                       transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          >
            <option value="all">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
            ))}
          </select>
        </div>

        {/* Refresh */}
        <button
          onClick={() => refetch()}
          title="Refresh"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border
                     bg-secondary/50 text-muted-foreground transition-colors
                     hover:bg-surface-hover hover:text-foreground active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <p className="ml-auto text-xs text-muted-foreground">
          {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* ── Grid ─────────────────────────────────────────────── */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No leads found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((lead, i) => (
            <LeadCard key={lead.id} lead={lead} index={i} />
          ))}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Showing {page * ITEMS_PER_PAGE + 1}–
            {Math.min((page + 1) * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`h-8 w-8 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  page === i
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
