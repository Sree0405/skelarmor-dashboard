import { type FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SectionHeader } from "../../components/SectionHeader";
import { useCreateCustomer, useCustomerFacetSamples, useCustomersPaged } from "./hooks/useCustomerQueries";
import type { CustomerPagedRequest } from "./listing/types";
import { CustomerListView } from "./listing/CustomerListView";
import { useCustomerListingUrlState } from "./listing/useCustomerListingUrlState";

export const CustomersModule = () => {
  const navigate = useNavigate();
  const url = useCustomerListingUrlState();
  const facetSamples = useCustomerFacetSamples();

  const pagedRequest = useMemo(
    (): CustomerPagedRequest => ({
      page: url.page,
      pageSize: url.pageSize,
      q: url.qCommitted,
      facets: url.facets,
    }),
    [url.page, url.pageSize, url.qCommitted, url.facets]
  );

  const listQuery = useCustomersPaged(pagedRequest);
  const createMut = useCreateCustomer();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });

  const total = listQuery.data?.total ?? 0;
  const activeInSample = useMemo(() => {
    const rows = facetSamples.data?.data ?? [];
    return rows.filter((c) => (c.status ?? "active") === "active").length;
  }, [facetSamples.data?.data]);

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      toast.error("Email and password are required.");
      return;
    }
    try {
      const row = await createMut.mutateAsync({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
      });
      toast.success("Customer created.");
      setCreateOpen(false);
      setForm({ email: "", password: "", first_name: "", last_name: "" });
      navigate(`/dashboard/admin/customers/${row.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create customer");
    }
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          title="Customers"
          description={`${total} match${total === 1 ? "" : "es"} (server total) · ${activeInSample} active in profile sample`}
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <UserPlus className="h-4 w-4" />
              Add customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={submitCreate}>
              <DialogHeader>
                <DialogTitle>New training client</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Password</label>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">First name</label>
                    <input
                      value={form.first_name}
                      onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Last name</label>
                    <input
                      value={form.last_name}
                      onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <CustomerListView
          url={url}
          listQuery={listQuery}
          facetSamples={facetSamples.data}
          facetSamplesPending={facetSamples.isPending}
        />
      </motion.div>
    </div>
  );
};
