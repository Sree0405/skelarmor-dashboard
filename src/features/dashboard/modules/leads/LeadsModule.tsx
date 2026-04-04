// features/dashboard/modules/leads/LeadsModule.tsx
// Mount at: /dashboard/admin/leads

import { SectionHeader } from "../../components/SectionHeader";
import { LeadsAnalyticsCard } from "./components/LeadsAnalyticsCard";
import { LeadsList }          from "./components/LeadsList";

export function LeadsModule() {
  return (
    <div className="space-y-8 max-w-7xl">
      <SectionHeader
        title="Leads"
        description="Inbound enquiries from the contact form"
      />

      {/* Analytics — top */}
      <LeadsAnalyticsCard />

      {/* Leads list — bottom */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">All Leads</h2>
          <p className="text-xs text-muted-foreground">Click any card to view full details</p>
        </div>
        <LeadsList />
      </section>
    </div>
  );
}
