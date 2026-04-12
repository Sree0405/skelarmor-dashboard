import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrganizationDetailContext } from "../../types";
import { useCreateOrgAdminUser } from "../../hooks/useOrganizationQueries";

/** Creates another org-scoped admin user (same flow as super-admin org provisioning). */
export function OrganizationAdminInviteSection({ organizationId, organization }: OrganizationDetailContext) {
  const createAdmin = useCreateOrgAdminUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email and password are required.");
      return;
    }
    try {
      await createAdmin.mutateAsync({
        organizationId,
        email: email.trim(),
        password,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
      });
      toast.success(`Admin created for ${organization.name}.`);
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create admin.");
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-white/50" />
        <h3 className="text-sm font-semibold text-foreground">Add organization admin</h3>
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        Creates a user with the <code className="text-zinc-400">admin</code> dashboard role scoped to this tenant.
      </p>
      <form onSubmit={onSubmit} className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs text-zinc-400">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-white/10 bg-black/20 text-white"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs text-zinc-400">Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-white/10 bg-black/20 text-white"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">First name</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border-white/10 bg-black/20 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-zinc-400">Last name</Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border-white/10 bg-black/20 text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <Button
            type="submit"
            size="sm"
            disabled={createAdmin.isPending}
            variant="secondary"
            className="border border-white/10 bg-white/10 text-white hover:bg-white/15"
          >
            {createAdmin.isPending ? "Creating…" : "Create admin user"}
          </Button>
        </div>
      </form>
    </section>
  );
}
