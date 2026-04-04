/** Directus `dashboard_roles` value for personal-training clients */
export const TRAINING_CLIENT_ROLE = "training_client";

/**
 * Directus `directus_users` row for a training client.
 * Weight / body-fat use camelCase — same keys as `ProfileApi` PATCH to `/users/:id`.
 */
export interface Customer {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar?: string | null;
  dashboard_roles?: string | null;
  status?: string | null;
  age?: number | null;
  goal?: string | null;
  currentWeight?: number | null;
  fatPercentage?: number | null;
  /** Billing cadence: Monthly | Quarterly | HalfYearly | Annually */
  subscription?: string | null;
  [key: string]: unknown;
}

/** Read weight from user payload (camelCase or legacy snake_case from older responses). */
export function readCustomerWeight(c: Customer): number | null {
  const v = c.currentWeight;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const legacy = c["current_weight"];
  if (typeof legacy === "number" && !Number.isNaN(legacy)) return legacy;
  return null;
}

/** Read body fat % from user payload (camelCase or legacy snake_case). */
export function readCustomerFatPct(c: Customer): number | null {
  const v = c.fatPercentage;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const legacy = c["fat_percentage"];
  if (typeof legacy === "number" && !Number.isNaN(legacy)) return legacy;
  return null;
}

/**
 * Directus `fitness_progress` item (`user` is the Directus user id).
 */
export interface FitnessProgress {
  id: string;
  user: string | { id: string };
  date?: string | null;
  weight?: number | null;
  fat_percentage?: number | null;
  fatPercentage?: number | null;
  [key: string]: unknown;
}

export type CreateCustomerPayload = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  /** Defaults to `training_client` if omitted */
  dashboard_roles?: string;
  status?: string;
  age?: number;
  goal?: string;
  currentWeight?: number;
  fatPercentage?: number;
  subscription?: string;
};

export type UpdateCustomerPayload = Partial<
  Omit<CreateCustomerPayload, "password" | "email">
> & {
  email?: string;
  password?: string;
};

export type CreateProgressPayload = {
  user: string;
  date?: string;
  weight?: number;
  fat_percentage?: number;
};

export type UpdateProgressPayload = Partial<CreateProgressPayload>;

/**
 * Directus `payments` item (`user` is the Directus user id).
 */
export interface CustomerPayment {
  id: string;
  user: string | { id: string };
  amount?: number | null;
  date?: string | null;
  type?: string | null;
  notes?: string | null;
  [key: string]: unknown;
}

export type CreatePaymentPayload = {
  user: string;
  amount: number;
  date?: string;
  type?: string;
  notes?: string | null;
};

export type UpdatePaymentPayload = Partial<
  Pick<CreatePaymentPayload, "amount" | "date" | "type" | "notes">
>;
