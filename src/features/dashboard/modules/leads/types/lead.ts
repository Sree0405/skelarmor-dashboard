// features/dashboard/modules/leads/types/lead.ts

export type Lead = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  service: string;
  timeSlot: string;
  date: string;
};

export type ServiceConfig = {
  id: string;
  label: string;
  icon: string;
};

export const services: ServiceConfig[] = [
  { id: "personal-training",      label: "Personal Training",      icon: "🏋️" },
  { id: "business-collaboration", label: "Business Collaboration", icon: "🤝" },
  { id: "gym-setup",              label: "Gym Setup",              icon: "🏗️" },
  { id: "franchise",              label: "Franchise",              icon: "🌐" },
];

/** Normalise a raw Directus contact_form record into a Lead */
export function normalizeLead(raw: Record<string, unknown>): Lead {
  return {
    id:       Number(raw.id),
    fullName: String(raw.fullName  ?? ""),
    email:    String(raw.email     ?? ""),
    phone:    String(raw.phone     ?? ""),
    message:  String(raw.message   ?? ""),
    service:  String(raw.service   ?? ""),
    timeSlot: String(raw.timeSlot  ?? ""),
    date:     String(raw.date      ?? ""),
  };
}

/** Resolve a service id → ServiceConfig (falls back gracefully for unknowns) */
export function getService(id: string): ServiceConfig {
  return services.find((s) => s.id === id) ?? { id, label: id, icon: "📋" };
}
