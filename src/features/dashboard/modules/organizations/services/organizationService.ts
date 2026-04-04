import { api } from "@/lib/apiClient";
import { withOrganization } from "@/lib/organizationScope";
import { ensureOrganizationCanAddUser } from "@/lib/organizationPolicy";

export type Organization = {
  id: string;
  name: string;
  isMain?: boolean;
  status?: "active" | "inactive" | string | null;
  [key: string]: unknown;
};

export async function getOrganizations(): Promise<Organization[]> {
  const res = await api.get<{ data?: Organization[] }>("/items/organizations", {
    params: { limit: -1, sort: "name", fields: "*" },
    skipOrgScope: true,
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function createOrganization(payload: {
  name: string;
  isMain?: boolean;
  status?: "active" | "inactive";
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
  payload: Partial<Pick<Organization, "name" | "isMain" | "status">>
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
