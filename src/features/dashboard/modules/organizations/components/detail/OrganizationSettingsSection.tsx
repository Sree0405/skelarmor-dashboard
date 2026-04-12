import { FormEvent, useEffect, useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { OrganizationDetailContext } from "../../types";
import { useUpdateOrganization } from "../../hooks/useOrganizationQueries";

type OrgStatus = "active" | "inactive";

function prettyStatus(s: unknown): OrgStatus {
  return String(s ?? "active").toLowerCase() === "inactive" ? "inactive" : "active";
}

function readMaxUsersField(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

/** Editable organization fields (extend payload in service when Directus gains columns). */
export function OrganizationSettingsSection({ organizationId, organization }: OrganizationDetailContext) {
  const updateOrg = useUpdateOrganization();
  const [name, setName] = useState(organization.name);
  const [isMain, setIsMain] = useState(Boolean(organization.isMain));
  const [status, setStatus] = useState<OrgStatus>(prettyStatus(organization.status));
  const [canLogin, setCanLogin] = useState(organization.can_login !== false);
  const [maxUsersStr, setMaxUsersStr] = useState(() => {
    const m = organization.max_users;
    if (m == null || m === "") return "";
    const n = Number(m);
    return Number.isFinite(n) && n > 0 ? String(Math.floor(n)) : "";
  });

  useEffect(() => {
    setName(organization.name);
    setIsMain(Boolean(organization.isMain));
    setStatus(prettyStatus(organization.status));
    setCanLogin(organization.can_login !== false);
    const m = organization.max_users;
    if (m == null || m === "") setMaxUsersStr("");
    else {
      const n = Number(m);
      setMaxUsersStr(Number.isFinite(n) && n > 0 ? String(Math.floor(n)) : "");
    }
  }, [organization]);

  const dirty = useMemo(() => {
    const maxDraft = readMaxUsersField(maxUsersStr);
    const maxOrig =
      organization.max_users == null || organization.max_users === ""
        ? null
        : (() => {
            const n = Number(organization.max_users);
            return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
          })();
    return (
      name.trim() !== organization.name ||
      isMain !== Boolean(organization.isMain) ||
      status !== prettyStatus(organization.status) ||
      canLogin !== (organization.can_login !== false) ||
      maxDraft !== maxOrig
    );
  }, [organization, name, isMain, status, canLogin, maxUsersStr]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required.");
      return;
    }
    try {
      await updateOrg.mutateAsync({
        id: organizationId,
        payload: {
          name: trimmed,
          isMain,
          status,
          can_login: canLogin,
          max_users: readMaxUsersField(maxUsersStr),
        },
      });
      toast.success("Organization updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-white/50" />
        <h3 className="text-sm font-semibold text-foreground">Settings</h3>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="org-name" className="text-xs text-zinc-400">
            Name
          </Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-white/10 bg-black/20 text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <Switch checked={isMain} onCheckedChange={setIsMain} id="detail-is-main" />
            <label htmlFor="detail-is-main" className="text-sm text-white/80">
              Main organization
            </label>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <Switch checked={canLogin} onCheckedChange={setCanLogin} id="detail-can-login" />
            <label htmlFor="detail-can-login" className="text-sm text-white/80">
              Allow non-admin dashboard login
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-zinc-400">Lifecycle status</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatus((v) => (v === "active" ? "inactive" : "active"))}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                status === "active"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/20 text-rose-300"
              )}
            >
              {status}
            </button>
            <span className="text-xs text-zinc-500">Inactive blocks all members from signing in.</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-max-users" className="text-xs text-zinc-400">
            Max users (optional)
          </Label>
          <Input
            id="org-max-users"
            inputMode="numeric"
            placeholder="No limit"
            value={maxUsersStr}
            onChange={(e) => setMaxUsersStr(e.target.value.replace(/[^\d]/g, ""))}
            className="max-w-xs border-white/10 bg-black/20 text-white"
          />
          <p className="text-xs text-zinc-500">Leave empty for no cap. Applies when creating users for this org.</p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            type="submit"
            size="sm"
            disabled={!dirty || updateOrg.isPending}
            className="bg-primary/90 text-white hover:bg-primary"
          >
            {updateOrg.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </section>
  );
}
