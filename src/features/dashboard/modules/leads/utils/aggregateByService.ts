// features/dashboard/modules/leads/utils/aggregateByService.ts

import { Lead, services, getService } from "../types/lead";

export type ServiceSlice = {
  id: string;
  name: string;
  icon: string;
  value: number;
};

/**
 * Counts leads per service and returns an array ready for Recharts PieChart.
 * Unknown service ids are included under their raw id.
 * Zero-count known services are omitted.
 */
export function aggregateByService(leads: Lead[]): ServiceSlice[] {
  const countMap = new Map<string, number>();

  for (const lead of leads) {
    countMap.set(lead.service, (countMap.get(lead.service) ?? 0) + 1);
  }

  // Seed known services so they appear even if count is 0 (filtered below)
  for (const s of services) {
    if (!countMap.has(s.id)) countMap.set(s.id, 0);
  }

  return Array.from(countMap.entries())
    .filter(([, v]) => v > 0)
    .map(([id, value]) => {
      const cfg = getService(id);
      return { id, name: cfg.label, icon: cfg.icon, value };
    })
    .sort((a, b) => b.value - a.value);
}
