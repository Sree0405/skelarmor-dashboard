import axios from "axios";
import { api } from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authToken";
import {
  TRAINING_CLIENT_ROLE,
  type CreateCustomerPayload,
  type CreatePaymentPayload,
  type CreateProgressPayload,
  type UpdatePaymentPayload,
  type Customer,
  type CustomerPayment,
  type FitnessProgress,
  type UpdateCustomerPayload,
  type UpdateProgressPayload,
} from "../types";

export class CustomerApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "CustomerApiError";
  }
}

function parseJsonBody(body: BodyInit | null | undefined): unknown {
  if (body == null || body === "") return undefined;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!getAccessToken()) {
    throw new CustomerApiError("Not authenticated", 401);
  }

  const method = (init?.method ?? "GET").toUpperCase();
  try {
    const res = await api.request<T>({
      url: path,
      method,
      data: method !== "GET" && method !== "HEAD" ? parseJsonBody(init?.body ?? undefined) : undefined,
    });

    if (res.status === 204) {
      return undefined as T;
    }

    return res.data as T;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const msg = (e.response?.data as { errors?: { message?: string }[] })?.errors?.[0]?.message;
      throw new CustomerApiError(typeof msg === "string" ? msg : e.message, e.response?.status);
    }
    throw e;
  }
}

function unwrapData<T>(json: { data?: T }): T {
  if (json.data === undefined) {
    throw new CustomerApiError("Invalid API response: missing data");
  }
  return json.data;
}

const USERS_FILTER = `filter[dashboard_roles][_eq]=${encodeURIComponent(TRAINING_CLIENT_ROLE)}`;

export async function getCustomers(): Promise<Customer[]> {
  const json = await apiJson<{ data: Customer[] }>(
    `/users?${USERS_FILTER}&fields=*`
  );
  const data = json.data;
  const list = Array.isArray(data) ? data : [];
  return list.filter((u) => u.dashboard_roles === TRAINING_CLIENT_ROLE);
}

export async function getCustomerById(id: string): Promise<Customer> {
  const json = await apiJson<{ data: Customer }>(`/users/${id}?fields=*`);
  return unwrapData(json);
}

export async function createCustomer(data: CreateCustomerPayload): Promise<Customer> {
  const body = {
    ...data,
    dashboard_roles: data.dashboard_roles ?? TRAINING_CLIENT_ROLE,
  };
  const json = await apiJson<{ data: Customer }>("/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return unwrapData(json);
}

export async function updateCustomer(id: string, data: UpdateCustomerPayload): Promise<Customer> {
  const json = await apiJson<{ data: Customer }>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return unwrapData(json);
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiJson<undefined>(`/users/${id}`, { method: "DELETE" });
}

export async function getCustomerProgress(userId: string): Promise<FitnessProgress[]> {
  const filter = `filter[user][_eq]=${encodeURIComponent(userId)}`;
  const json = await apiJson<{ data: FitnessProgress[] }>(
    `/items/fitness_progress?${filter}&sort=date`
  );
  const data = json.data;
  return Array.isArray(data) ? data : [];
}

/** All progress rows for the given training client user ids (batched filter). */
export async function getFitnessProgressForUsers(userIds: string[]): Promise<FitnessProgress[]> {
  if (userIds.length === 0) return [];
  const filter = encodeURIComponent(JSON.stringify({ user: { _in: userIds } }));
  const json = await apiJson<{ data: FitnessProgress[] }>(
    `/items/fitness_progress?filter=${filter}&limit=-1&sort=date`
  );
  const data = json.data;
  return Array.isArray(data) ? data : [];
}

export async function addProgress(data: CreateProgressPayload): Promise<FitnessProgress> {
  const json = await apiJson<{ data: FitnessProgress }>("/items/fitness_progress", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return unwrapData(json);
}

export async function getCustomerPayments(userId: string): Promise<CustomerPayment[]> {
  const filter = `filter[user][_eq]=${encodeURIComponent(userId)}`;
  const json = await apiJson<{ data: CustomerPayment[] }>(
    `/items/payments?${filter}&sort=-date`
  );
  const data = json.data;
  return Array.isArray(data) ? data : [];
}

/** Payments for many users (e.g. customer list). Empty `userIds` returns []. */
export async function getPaymentsForUsers(userIds: string[]): Promise<CustomerPayment[]> {
  if (userIds.length === 0) return [];
  const filter = encodeURIComponent(JSON.stringify({ user: { _in: userIds } }));
  const json = await apiJson<{ data: CustomerPayment[] }>(
    `/items/payments?filter=${filter}&limit=-1&sort=-date`
  );
  const data = json.data;
  return Array.isArray(data) ? data : [];
}

export async function addPayment(data: CreatePaymentPayload): Promise<CustomerPayment> {
  const json = await apiJson<{ data: CustomerPayment }>("/items/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return unwrapData(json);
}

export async function updatePayment(
  id: string,
  data: UpdatePaymentPayload
): Promise<CustomerPayment> {
  const json = await apiJson<{ data: CustomerPayment }>(`/items/payments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return unwrapData(json);
}

export async function updateProgress(
  id: string,
  data: UpdateProgressPayload
): Promise<FitnessProgress> {
  const json = await apiJson<{ data: FitnessProgress }>(`/items/fitness_progress/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return unwrapData(json);
}

function progressSortKey(p: FitnessProgress): number {
  const t = new Date(p.date ?? "").getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Sets `currentWeight` and `fatPercentage` on `directus_users` from the progress row
 * with the latest `date` (ties broken by id). Uses camelCase — same as profile PATCH.
 */
export async function syncCustomerProfileFromLatestProgress(userId: string): Promise<void> {
  const all = await getCustomerProgress(userId);
  if (all.length === 0) return;

  const latest = [...all].sort((a, b) => {
    const diff = progressSortKey(b) - progressSortKey(a);
    if (diff !== 0) return diff;
    return String(b.id).localeCompare(String(a.id));
  })[0];

  if (latest == null) return;

  const w = Number(latest.weight);
  const fatRaw = latest.fat_percentage ?? latest.fatPercentage;
  const f = Number(fatRaw);
  if (Number.isNaN(w) || Number.isNaN(f)) return;

  await updateCustomer(userId, {
    currentWeight: w,
    fatPercentage: f,
  });
}

export const customerService = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerProgress,
  getFitnessProgressForUsers,
  addProgress,
  updateProgress,
  syncCustomerProfileFromLatestProgress,
  getCustomerPayments,
  getPaymentsForUsers,
  addPayment,
  updatePayment,
};
