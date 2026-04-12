import { api } from "@/lib/apiClient";
import { withOrganization } from "@/lib/organizationScope";
import { ensureOrganizationCanAddUser } from "@/lib/organizationPolicy";

export type Organization = {
  id: string;
  name: string;
  isMain?: boolean;
  status?: "active" | "inactive" | string | null;
  can_login?: boolean | null;
  max_users?: string | number | null;
  [key: string]: unknown;
};

export type OrganizationUpdatePayload = Partial<{
  name: string;
  isMain: boolean;
  status: "active" | "inactive";
  can_login: boolean;
  max_users: number | null;
}>;

export async function getOrganizations(): Promise<Organization[]> {
  const res = await api.get<{ data?: Organization[] }>("/items/organizations", {
    params: { limit: -1, sort: "name", fields: "*" },
    skipOrgScope: true,
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function getOrganizationById(id: string): Promise<Organization> {
  const res = await api.get<{ data: Organization }>(`/items/organizations/${id}`, {
    params: { fields: "*" },
    skipOrgScope: true,
  });
  return res.data.data;
}

/** Count of users assigned to this organization (all roles). */
export async function getOrganizationUserCount(organizationId: string): Promise<number> {
  const filter = `filter[organization][_eq]=${encodeURIComponent(organizationId)}`;
  const res = await api.get<{ data?: Array<{ id?: string }> }>(`/users?${filter}&fields=id&limit=-1`, {
    skipOrgScope: true,
  });
  const list = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.length;
}

export async function createOrganization(payload: {
  name: string;
  isMain?: boolean;
  status?: "active" | "inactive";
  can_login?: boolean;
  max_users?: number | null;
}): Promise<Organization> {
  const res = await api.post<{ data: Organization }>(
    "/items/organizations",
    payload,
    { skipOrgScope: true }
  );
  return res.data.data;
}

export async function updateOrganization(
  id: string,
  payload: OrganizationUpdatePayload
): Promise<Organization> {
  const res = await api.patch<{ data: Organization }>(`/items/organizations/${id}`, payload, {
    skipOrgScope: true,
  });
  return res.data.data;
}

export async function updateOrganizationStatus(
  id: string,
  status: "active" | "inactive"
): Promise<Organization> {
  return updateOrganization(id, { status });
}

export async function deleteOrganization(id: string): Promise<void> {
  await api.delete(`/items/organizations/${id}`, { skipOrgScope: true });
}

export async function createAdminUserForOrganization(payload: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  organizationId: string;
}): Promise<{ id: string; email: string }> {
  await ensureOrganizationCanAddUser(payload.organizationId, { skipOrgScope: true });
  const body = withOrganization(
    {
      email: payload.email,
      password: payload.password,
      first_name: payload.first_name,
      last_name: payload.last_name,
      dashboard_roles: "admin",
    },
    payload.organizationId
  );
  const res = await api.post<{ data: { id: string; email: string } }>("/users", body, {
    skipOrgScope: true,
  });
  return res.data.data;
}
