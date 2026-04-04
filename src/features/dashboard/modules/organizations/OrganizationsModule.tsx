import { FormEvent, useMemo, useState } from "react";
import { Building2, Plus, RefreshCcw } from "lucide-react";
import { SectionHeader } from "@/features/dashboard/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  useCreateOrganization,
  useOrganizations,
  useUpdateOrganizationStatus,
} from "./hooks/useOrganizationQueries";

type OrgStatus = "active" | "inactive";

function prettyStatus(s: unknown): OrgStatus {
  return String(s ?? "active").toLowerCase() === "inactive" ? "inactive" : "active";
}

export function OrganizationsModule() {
  const [name, setName] = useState("");
  const [isMain, setIsMain] = useState(false);
  const [status, setStatus] = useState<OrgStatus>("active");
  const [creating, setCreating] = useState(false);

  const orgQuery = useOrganizations();
  const createOrg = useCreateOrganization();
  const statusMutation = useUpdateOrganizationStatus();

  const orgs = useMemo(() => orgQuery.data ?? [], [orgQuery.data]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextName = name.trim();
    if (!nextName) return;
    try {
      setCreating(true);
      await createOrg.mutateAsync({ name: nextName, isMain, status });
      setName("");
      setIsMain(false);
      setStatus("active");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-7xl space-y-8">
      <SectionHeader
        title="Organizations"
        description="Create and manage tenants. Super admin only."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void orgQuery.refetch()}
            className="border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Create Organization</h3>
        <form onSubmit={onCreate} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization name"
              className="border-white/10 bg-black/20 text-white placeholder:text-white/40"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
            <Switch checked={isMain} onCheckedChange={setIsMain} id="is-main-org" />
            <label htmlFor="is-main-org" className="text-xs text-white/75">
              Main org
            </label>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
            <button
              type="button"
              onClick={() => setStatus((v) => (v === "active" ? "inactive" : "active"))}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium",
                status === "active"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/20 text-rose-300"
              )}
            >
              {status}
            </button>
            <Button
              type="submit"
              size="sm"
              disabled={creating || createOrg.isPending || !name.trim()}
              className="bg-primary/90 text-white hover:bg-primary"
            >
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>
        </form>
        {createOrg.isError && (
          <p className="mt-2 text-xs text-rose-400">
            {(createOrg.error as Error)?.message ?? "Failed to create organization."}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">All Organizations</h3>
          <p className="text-xs text-zinc-400">Toggle status and review tenant configuration.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <table className="w-full">
            <thead className="bg-white/[0.03]">
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Main</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgQuery.isLoading && (
                <tr>
                  <td className="px-4 py-4 text-sm text-zinc-400" colSpan={4}>
                    Loading organizations...
                  </td>
                </tr>
              )}
              {!orgQuery.isLoading && orgs.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-sm text-zinc-400" colSpan={4}>
                    No organizations found.
                  </td>
                </tr>
              )}
              {orgs.map((org) => {
                const orgStatus = prettyStatus(org.status);
                return (
                  <tr key={org.id} className="border-t border-white/10 text-sm">
                    <td className="px-4 py-3 text-white/90">
                      <div className="inline-flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-white/45" />
                        <span>{org.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 text-xs font-medium",
                          org.isMain
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-zinc-500/20 text-zinc-300"
                        )}
                      >
                        {org.isMain ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 text-xs font-medium",
                          orgStatus === "active"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        )}
                      >
                        {orgStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={statusMutation.isPending}
                        className="border-white/15 bg-black/20 text-white/80 hover:bg-white/10"
                        onClick={() =>
                          void statusMutation.mutateAsync({
                            id: org.id,
                            status: orgStatus === "active" ? "inactive" : "active",
                          })
                        }
                      >
                        Set {orgStatus === "active" ? "Inactive" : "Active"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(orgQuery.isError || statusMutation.isError) && (
          <p className="text-xs text-rose-400">
            {(orgQuery.error as Error)?.message ||
              (statusMutation.error as Error)?.message ||
              "Could not update organization status."}
          </p>
        )}
      </section>
    </div>
  );
}
