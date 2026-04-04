import axios from "axios";
import { api } from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authToken";
import type { GymProject } from "@/features/dashboard/types";
import { gymProjectService } from "@/features/dashboard/modules/gym-setup/services/projectService";
import type {
  CreateGymClientPayload,
  GymClient,
  GymClientProjectPayment,
  UpdateGymClientPayload,
} from "../types";
import { GYM_FRANCHISE_ROLE } from "../types";

export class GymClientApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "GymClientApiError";
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
  if (!getAccessToken()) throw new GymClientApiError("Not authenticated", 401);

  const method = (init?.method ?? "GET").toUpperCase();
  try {
    const res = await api.request<T>({
      url: path,
      method,
      data: method !== "GET" && method !== "HEAD" ? parseJsonBody(init?.body ?? undefined) : undefined,
    });
    if (res.status === 204) return undefined as T;
    return res.data as T;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const msg = (e.response?.data as { errors?: { message?: string }[] })?.errors?.[0]?.message;
      throw new GymClientApiError(typeof msg === "string" ? msg : e.message, e.response?.status);
    }
    throw e;
  }
}

function unwrapData<T>(json: { data?: T }): T {
  if (json.data === undefined) throw new GymClientApiError("Invalid API response: missing data");
  return json.data;
}

function idOfRel(v: string | { id: string } | null | undefined): string {
  if (v == null) return "";
  return typeof v === "string" ? v : v.id;
}

function payType(raw: unknown): "paid" | "pending" {
  return String(raw ?? "paid").toLowerCase().trim() === "pending" ? "pending" : "paid";
}

type RawPaymentRow = {
  id: string;
  user?: string | { id: string };
  project?: string | { id: string; project_name?: string | null };
  amount?: number | null;
  date?: string | null;
  type?: string | null;
  notes?: string | null;
};

function normalizeGymPayment(row: RawPaymentRow): GymClientProjectPayment | null {
  const userId = idOfRel(row.user);
  if (!userId) return null;
  const proj = row.project;
  const projectId = idOfRel(proj);
  let projectName = "—";
  if (typeof proj === "object" && proj != null) {
    projectName = proj.project_name != null ? String(proj.project_name) : projectName;
  }
  return {
    id: String(row.id),
    userId,
    projectId,
    projectName,
    amount: Number(row.amount ?? 0),
    date: row.date != null ? String(row.date) : "",
    type: payType(row.type),
    notes: row.notes != null ? String(row.notes) : undefined,
  };
}

const ROLE_FILTER = `filter[dashboard_roles][_eq]=${encodeURIComponent(GYM_FRANCHISE_ROLE)}`;

export async function getGymClients(): Promise<GymClient[]> {
  const json = await apiJson<{ data: GymClient[] }>(`/users?${ROLE_FILTER}&fields=*`);
  const data = json.data;
  const list = Array.isArray(data) ? data : [];
  return list.filter((u) => u.dashboard_roles === GYM_FRANCHISE_ROLE);
}

export async function getGymClientById(id: string): Promise<GymClient> {
  const json = await apiJson<{ data: GymClient }>(`/users/${id}?fields=*`);
  const u = unwrapData(json);
  if (u.dashboard_roles !== GYM_FRANCHISE_ROLE) {
    throw new GymClientApiError("Not a gym / franchise client", 403);
  }
  return u;
}

export async function getClientProjects(clientId: string): Promise<GymProject[]> {
  return gymProjectService.getProjectsByClient(clientId);
}

/** Payments: `payment_context=project` and `user` = franchise client id. */
export async function getClientPayments(clientId: string): Promise<GymClientProjectPayment[]> {
  const ctx = encodeURIComponent("project");
  const json = await apiJson<{ data: RawPaymentRow[] }>(
    `/items/payments?filter[payment_context][_eq]=${ctx}&filter[user][_eq]=${encodeURIComponent(
      clientId
    )}&sort=-date&fields=*,project.id,project.project_name`
  );
  const data = json.data;
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeGymPayment).filter((p): p is GymClientProjectPayment => p != null);
}

/** All project payments with user + project (for list aggregates). */
export async function getFranchiseProjectPaymentsDirectory(): Promise<GymClientProjectPayment[]> {
  const ctx = encodeURIComponent("project");
  const json = await apiJson<{ data: RawPaymentRow[] }>(
    `/items/payments?filter[payment_context][_eq]=${ctx}&limit=-1&sort=-date&fields=*,project.id,project.project_name`
  );
  const data = json.data;
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeGymPayment).filter((p): p is GymClientProjectPayment => p != null);
}

export async function createGymClient(payload: CreateGymClientPayload): Promise<GymClient> {
  const body = {
    email: payload.email.trim(),
    password: payload.password,
    first_name: payload.first_name?.trim() || undefined,
    last_name: payload.last_name?.trim() || undefined,
    location: payload.location?.trim() || null,
    dashboard_roles: GYM_FRANCHISE_ROLE,
  };
  const json = await apiJson<{ data: GymClient }>("/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return unwrapData(json);
}

export async function updateGymClient(id: string, data: UpdateGymClientPayload): Promise<GymClient> {
  const json = await apiJson<{ data: GymClient }>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return unwrapData(json);
}

export async function deleteGymClient(id: string): Promise<void> {
  await apiJson<undefined>(`/users/${id}`, { method: "DELETE" });
}

export const gymClientService = {
  getGymClients,
  getGymClientById,
  getClientProjects,
  getClientPayments,
  getFranchiseProjectPaymentsDirectory,
  createGymClient,
  updateGymClient,
  deleteGymClient,
};
