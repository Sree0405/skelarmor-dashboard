/** Franchise users that can own gym setup projects */
export const FRANCHISE_CLIENT_ROLE = "Franchise_setup_client";

export type ProjectStatus = "planning" | "ongoing" | "completed";

/** Raw row from Directus `projects` (snake_case fields). */
export type DirectusProjectRow = {
  id: string;
  project_name?: string | null;
  client?: string | { id: string; first_name?: string | null; last_name?: string | null; email?: string | null };
  location_city?: string | null;
  location_country?: string | null;
  budget?: number | null;
  total_amount?: number | null;
  paid_amount?: number | null;
  pending_amount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  progress?: number | null;
  status?: string | null;
  [key: string]: unknown;
};

export type CreateDirectusProjectPayload = {
  project_name: string;
  client: string;
  location_city?: string | null;
  location_country?: string | null;
  budget?: number;
  total_amount?: number;
  paid_amount?: number;
  pending_amount?: number;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  progress?: number;
  status?: string;
};

export type UpdateDirectusProjectPayload = Partial<CreateDirectusProjectPayload>;

export type DirectusProjectPaymentRow = {
  id: string;
  project?: string | { id: string };
  amount?: number | null;
  date?: string | null;
  type?: string | null;
  notes?: string | null;
  payment_context?: string | null;
  [key: string]: unknown;
};

export type CreateProjectPaymentPayload = {
  amount: number;
  date?: string | null;
  type?: string | null;
  notes?: string | null;
};
