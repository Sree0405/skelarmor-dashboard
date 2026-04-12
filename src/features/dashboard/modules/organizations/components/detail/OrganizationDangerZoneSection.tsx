import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { OrganizationDetailContext } from "../../types";
import { useDeleteOrganization } from "../../hooks/useOrganizationQueries";

export function OrganizationDangerZoneSection({ organizationId, organization }: OrganizationDetailContext) {
  const navigate = useNavigate();
  const deleteOrg = useDeleteOrganization();
  const [open, setOpen] = useState(false);
  const isMain = Boolean(organization.isMain);

  async function onConfirmDelete() {
    try {
      await deleteOrg.mutateAsync(organizationId);
      toast.success("Organization deleted.");
      setOpen(false);
      navigate("/dashboard/admin/organizations", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <section className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.06] p-5 backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2">
        <Trash2 className="h-4 w-4 text-rose-400/90" />
        <h3 className="text-sm font-semibold text-rose-200">Danger zone</h3>
      </div>
      <p className="mb-4 text-xs text-rose-200/70">
        Deleting removes the organization record from Directus. Ensure no critical data depends on this tenant.
      </p>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isMain || deleteOrg.isPending}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            Delete organization
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-md border-white/10 bg-[#0c0c14] text-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete &quot;{organization.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              This cannot be undone. Users may lose access if the backend allows orphaned users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={(e) => {
                e.preventDefault();
                void onConfirmDelete();
              }}
            >
              {deleteOrg.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isMain && (
        <p className="mt-3 text-xs text-zinc-400">Main organization cannot be deleted from the dashboard.</p>
      )}
    </section>
  );
}
