import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useOrganizationById,
  useOrganizationUserCount,
} from "../hooks/useOrganizationQueries";
import { OrganizationDetailSections } from "../detail/OrganizationDetailSections";

function prettyStatus(s: unknown): string {
  return String(s ?? "active").toLowerCase() === "inactive" ? "inactive" : "active";
}

export function OrganizationDetailPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const id = organizationId?.trim() ?? "";

  const orgQuery = useOrganizationById(id || undefined);
  const countQuery = useOrganizationUserCount(id || undefined);

  if (!id) {
    return <Navigate to="/dashboard/admin/organizations" replace />;
  }

  if (orgQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (orgQuery.isError || !orgQuery.data) {
    return <Navigate to="/dashboard/admin/organizations" replace />;
  }

  const org = orgQuery.data;
  const userCount = countQuery.data ?? 0;
  const ctx = {
    organizationId: id,
    organization: org,
    userCount,
    isUserCountPending: !countQuery.isFetched && countQuery.isFetching,
  };

  return (
    <div className="space-y-8">
      <Link
        to="/dashboard/admin/organizations"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All organizations
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-3"
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{org.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tenant configuration, usage limits, and dashboard access.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-zinc-500">id: {org.id}</span>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              prettyStatus(org.status) === "active"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-rose-500/15 text-rose-300"
            )}
          >
            {prettyStatus(org.status)}
          </span>
          {org.isMain ? (
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-200">
              Main org
            </span>
          ) : null}
          {org.can_login === false ? (
            <span className="rounded-md bg-zinc-500/20 px-2 py-0.5 text-xs text-zinc-300">Non-admin login off</span>
          ) : null}
        </div>
      </motion.div>

      <OrganizationDetailSections {...ctx} />
    </div>
  );
}
