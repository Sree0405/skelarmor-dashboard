import axios from "axios";
import { api } from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authToken";
import {
  assertBelongsToCurrentOrganization,
  withOrganization,
} from "@/lib/organizationScope";
import type { Customer } from "@/features/dashboard/modules/customers/types";
import type { GymProject, Payment } from "@/features/dashboard/types";
import type {
  CreateDirectusProjectPayload,
  DirectusProjectPaymentRow,
  DirectusProjectRow,
  UpdateDirectusProjectPayload,
} from "../types";
import { FRANCHISE_CLIENT_ROLE } from "../types";

export class ProjectApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ProjectApiError";
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
  if (!getAccessToken()) throw new ProjectApiError("Not authenticated", 401);

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
      throw new ProjectApiError(typeof msg === "string" ? msg : e.message, e.response?.status);
    }
    throw e;
  }
}

function unwrapData<T>(json: { data?: T }): T {
  if (json.data === undefined) throw new ProjectApiError("Invalid API response: missing data");
  return json.data;
}

const PROJECT_FIELDS = "fields=*,client.*";
const PAYMENT_CONTEXT_PROJECT = "project";

function idOfRel(v: string | { id: string } | null | undefined): string {
  if (v == null) return "";
  return typeof v === "string" ? v : v.id;
}

function clientDisplayName(client: unknown): string {
  if (client == null || typeof client !== "object") return "—";
  const c = client as Record<string, unknown>;
  const fn = c.first_name;
  const ln = c.last_name;
  const parts = [fn, ln].filter((x) => typeof x === "string" && x.trim());
  if (parts.length) return parts.join(" ");
  if (typeof c.email === "string" && c.email) return c.email;
  return "—";
}

function fmtShortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function normalizeStatus(raw: unknown): GymProject["status"] {
  const s = String(raw ?? "ongoing").toLowerCase();
  if (s === "planning" || s === "ongoing" || s === "completed") return s;
  if (s === "done" || s === "complete") return "completed";
  return "ongoing";
}

function normalizePayType(raw: unknown): Payment["type"] {
  const t = String(raw ?? "paid").toLowerCase();
  return t === "pending" ? "pending" : "paid";
}

export function normalizeProject(row: DirectusProjectRow): GymProject {
  const client = row.client;
  const clientId = idOfRel(client);
  const city = row.location_city != null ? String(row.location_city) : "";
  const country = row.location_country != null ? String(row.location_country) : "";
  const location = [city, country].filter(Boolean).join(", ") || "—";
  const total = Number(row.total_amount ?? row.budget ?? 0);
  const paid = Number(row.paid_amount ?? 0);
  const pending = Number(row.pending_amount ?? Math.max(0, total - paid));
  const start = row.start_date ? String(row.start_date) : null;
  const end = row.end_date ? String(row.end_date) : null;
  let timeline = "—";
  if (start && end) timeline = `${fmtShortDate(start)} – ${fmtShortDate(end)}`;
  else if (start) timeline = fmtShortDate(start);
  else if (end) timeline = fmtShortDate(end);

  return {
    id: String(row.id),
    clientId,
    clientName: typeof client === "object" && client != null ? clientDisplayName(client) : "—",
    projectName: row.project_name != null ? String(row.project_name) : "",
    location,
    budget: Number(row.budget ?? total),
    totalAmount: total,
    paidAmount: paid,
    pendingAmount: pending,
    timeline,
    status: normalizeStatus(row.status),
    progress: Math.min(100, Math.max(0, Number(row.progress ?? 0))),
    description: row.description != null ? String(row.description) : undefined,
    startDate: start,
    endDate: end,
  };
}

export function normalizeProjectPayment(row: DirectusProjectPaymentRow): Payment {
  return {
    id: String(row.id),
    projectId: idOfRel(row.project),
    amount: Number(row.amount ?? 0),
    date: row.date != null ? String(row.date) : "",
    type: normalizePayType(row.type),
    notes: row.notes != null ? String(row.notes) : undefined,
  };
}

export type PaymentWithProjectMeta = Payment & { projectName: string };

function normalizeUserPaymentRow(
  row: DirectusProjectPaymentRow & { project?: string | { id: string; project_name?: string | null } }
): PaymentWithProjectMeta {
  const base = normalizeProjectPayment(row);
  const proj = row.project;
  let projectName = "—";
  if (typeof proj === "object" && proj != null && "project_name" in proj) {
    projectName = proj.project_name != null ? String(proj.project_name) : "—";
  }
  return { ...base, projectName };
}

export async function getPaymentsByUser(userId: string): Promise<PaymentWithProjectMeta[]> {
  const u = encodeURIComponent(userId);
  const json = await apiJson<{ data: DirectusProjectPaymentRow[] }>(
    `/items/payments?filter[user][_eq]=${u}&sort=-date&limit=-1&fields=*,project.id,project.project_name`
  );
  const list = Array.isArray(json.data) ? json.data : [];
  return list.map(normalizeUserPaymentRow);
}

export async function getProjects(): Promise<GymProject[]> {
  const json = await apiJson<{ data: DirectusProjectRow[] }>(`/items/projects?${PROJECT_FIELDS}`);
  const data = json.data;
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeProject);
}

export async function getProjectsByClient(clientId: string): Promise<GymProject[]> {
  const q = `filter[client][_eq]=${encodeURIComponent(clientId)}`;
  const json = await apiJson<{ data: DirectusProjectRow[] }>(
    `/items/projects?${q}&${PROJECT_FIELDS}`
  );
  const data = json.data;
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeProject);
}

export async function getProjectById(id: string): Promise<GymProject> {
  const json = await apiJson<{ data: DirectusProjectRow }>(`/items/projects/${id}?${PROJECT_FIELDS}`);
  const row = unwrapData(json);
  assertBelongsToCurrentOrganization((row as { organization?: unknown }).organization);
  return normalizeProject(row);
}

export async function createProject(body: CreateDirectusProjectPayload): Promise<GymProject> {
  const json = await apiJson<{ data: DirectusProjectRow }>("/items/projects", {
    method: "POST",
    body: JSON.stringify(withOrganization(body)),
  });
  return normalizeProject(unwrapData(json));
}

export async function updateProjectApi(id: string, body: UpdateDirectusProjectPayload): Promise<GymProject> {
  await getProjectById(id);
  const json = await apiJson<{ data: DirectusProjectRow }>(`/items/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return normalizeProject(unwrapData(json));
}

/** Raw row for financial patch (snake_case amounts). */
async function getProjectRaw(id: string): Promise<DirectusProjectRow> {
  const json = await apiJson<{ data: DirectusProjectRow }>(`/items/projects/${id}?fields=*`);
  const row = unwrapData(json);
  assertBelongsToCurrentOrganization((row as { organization?: unknown }).organization);
  return row;
}

export async function getProjectPayments(projectId: string): Promise<Payment[]> {
  const ctx = encodeURIComponent(PAYMENT_CONTEXT_PROJECT);
  const json = await apiJson<{ data: DirectusProjectPaymentRow[] }>(
    `/items/payments?filter[payment_context][_eq]=${ctx}&filter[project][_eq]=${encodeURIComponent(projectId)}&sort=-date`
  );
  const data = json.data;
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeProjectPayment);
}

export async function getPaymentsForProjectIds(projectIds: string[]): Promise<PaymentWithProjectMeta[]> {
  if (projectIds.length === 0) return [];
  const f = encodeURIComponent(
    JSON.stringify({
      _and: [{ payment_context: { _eq: PAYMENT_CONTEXT_PROJECT } }, { project: { _in: projectIds } }],
    })
  );
  const fields = encodeURIComponent("*,project.id,project.project_name");
  const json = await apiJson<{ data: DirectusProjectPaymentRow[] }>(
    `/items/payments?filter=${f}&limit=-1&sort=-date&fields=${fields}`
  );
  const data = json.data;
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeUserPaymentRow);
}

/** All project-scoped payments (admin aggregates). */
export async function getAllProjectContextPayments(): Promise<Payment[]> {
  const ctx = encodeURIComponent(PAYMENT_CONTEXT_PROJECT);
  const json = await apiJson<{ data: DirectusProjectPaymentRow[] }>(
    `/items/payments?filter[payment_context][_eq]=${ctx}&limit=-1&sort=-date`
  );
  const data = json.data;
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeProjectPayment);
}

export async function getFranchiseUsers(): Promise<Customer[]> {
  const role = encodeURIComponent(FRANCHISE_CLIENT_ROLE);
  const json = await apiJson<{ data: Customer[] }>(`/users?filter[dashboard_roles][_eq]=${role}&fields=*`);
  const data = json.data;
  return Array.isArray(data) ? data : [];
}

export async function addProjectPayment(
  projectId: string,
  payload: { amount: number; date?: string | null; type?: string | null; notes?: string | null }
): Promise<Payment> {
  const body = {
    payment_context: PAYMENT_CONTEXT_PROJECT,
    project: projectId,
    amount: payload.amount,
    date: payload.date ?? undefined,
    type: payload.type ?? "paid",
    notes: payload.notes ?? null,
  };
  await getProjectById(projectId);
  const json = await apiJson<{ data: DirectusProjectPaymentRow }>("/items/payments", {
    method: "POST",
    body: JSON.stringify(withOrganization(body)),
  });
  const created = normalizeProjectPayment(unwrapData(json));

  const amt = Number(payload.amount);
  const isPaid = String(payload.type ?? "paid").toLowerCase().trim() === "paid";
  if (isPaid && !Number.isNaN(amt) && amt > 0) {
    const raw = await getProjectRaw(projectId);
    const paid = Number(raw.paid_amount ?? 0) + amt;
    const pending = Math.max(0, Number(raw.pending_amount ?? 0) - amt);
    await apiJson(`/items/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ paid_amount: paid, pending_amount: pending }),
    });
  }

  return created;
}

export const gymProjectService = {
  getProjects,
  getProjectsByClient,
  getProjectById,
  createProject,
  updateProjectApi,
  getProjectPayments,
  getPaymentsByUser,
  getPaymentsForProjectIds,
  getAllProjectContextPayments,
  getFranchiseUsers,
  addProjectPayment,
};
