import type { ComponentType } from "react";
import type { OrganizationDetailContext } from "../types";
import { OrganizationMetricsSection } from "../components/detail/OrganizationMetricsSection";
import { OrganizationSettingsSection } from "../components/detail/OrganizationSettingsSection";
import { OrganizationAdminInviteSection } from "../components/detail/OrganizationAdminInviteSection";
import { OrganizationDangerZoneSection } from "../components/detail/OrganizationDangerZoneSection";

const SECTIONS: ReadonlyArray<{
  id: string;
  Component: ComponentType<OrganizationDetailContext>;
}> = [
  { id: "metrics", Component: OrganizationMetricsSection },
  { id: "settings", Component: OrganizationSettingsSection },
  { id: "admin-invite", Component: OrganizationAdminInviteSection },
  { id: "danger", Component: OrganizationDangerZoneSection },
];

/**
 * Single composition point for the organization detail page.
 * Add `{ id, Component }` entries here to mount new blocks without touching the page shell.
 */
export function OrganizationDetailSections(ctx: OrganizationDetailContext) {
  return (
    <div className="space-y-6">
      {SECTIONS.map(({ id, Component }) => (
        <Component key={id} {...ctx} />
      ))}
    </div>
  );
}
