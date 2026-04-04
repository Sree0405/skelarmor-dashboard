import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/Login/useAuth";
import { api } from "@/lib/apiClient";
import { extractOrganizationId } from "@/lib/organizationScope";

export type OrganizationRecord = {
  id: string;
  name?: string | null;
  isMain?: boolean | null;
  [key: string]: unknown;
};

async function fetchOrganizationById(id: string): Promise<OrganizationRecord | null> {
  const res = await api.get<{ data?: OrganizationRecord }>(`/items/organizations/${id}`, {
    params: { fields: "*" },
  });
  return res.data?.data ?? null;
}

async function fetchOrganizationsForSuperAdmin(): Promise<OrganizationRecord[]> {
  const res = await api.get<{ data?: OrganizationRecord[] }>("/items/organizations", {
    params: { limit: -1, sort: "name", fields: "*" },
    skipOrgScope: true,
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export function useOrganization() {
  const { user } = useAuth();
  const orgId = extractOrganizationId(user?.organization);
  const isSuperAdmin = Boolean(user?.is_super_admin);

  const {
    data: orgData,
    isLoading: orgLoading,
    isError: orgError,
    error: orgFetchError,
  } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => fetchOrganizationById(orgId!),
    enabled: Boolean(orgId),
  });

  const {
    data: organizations = [],
    isLoading: orgListLoading,
    isError: orgListError,
    error: orgListFetchError,
  } = useQuery({
    queryKey: ["organizations", "super-admin"],
    queryFn: fetchOrganizationsForSuperAdmin,
    enabled: isSuperAdmin,
  });

  const isMain = Boolean(orgData?.isMain) || isSuperAdmin;

  return {
    orgId,
    orgData: orgData ?? null,
    organizations,
    isMain,
    isSuperAdmin,
    isLoading: orgLoading || orgListLoading,
    isError: orgError || orgListError,
    error: orgFetchError ?? orgListFetchError ?? null,
  };
}
