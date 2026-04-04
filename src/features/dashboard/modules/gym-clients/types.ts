import type { Customer } from "@/features/dashboard/modules/customers/types";

/** Must match Directus `dashboard_roles` for franchise / gym clients */
export const GYM_FRANCHISE_ROLE = "Franchise_setup_client";

export type GymClient = Customer;

/** Project payment row scoped to franchise user (`payments.user`). */
export type GymClientProjectPayment = {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  amount: number;
  date: string;
  type: "paid" | "pending";
  notes?: string;
};

export type CreateGymClientPayload = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  location?: string | null;
};

export type UpdateGymClientPayload = Partial<{
  email: string;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
  password: string;
}>;

export type GymClientRowStats = {
  projectCount: number;
  totalPaid: number;
  totalPending: number;
};
