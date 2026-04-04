import { api } from "@/lib/apiClient";

type OrgStatus = "active" | "inactive";

export class OrganizationPolicyError extends Error {
  constructor(
    message: string,
    public readonly code: "ORG_INACTIVE" | "ORG_USER_LIMIT_REACHED"
  ) {
    super(message);
    this.name = "OrganizationPolicyError";
  }
}

type OrganizationPolicyInfo = {
  id: string;
  name: string;
  status: OrgStatus;
  maxUsers: number | null;
};

function normalizeStatus(raw: unknown): OrgStatus {
  return String(raw ?? "active").toLowerCase() === "inactive" ? "inactive" : "active";
}

function normalizeMaxUsers(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

async function getOrganizationPolicyInfo(
  organizationId: string,
  skipOrgScope: boolean
): Promise<OrganizationPolicyInfo> {
  const res = await api.get<{ data?: Record<string, unknown> }>(
    `/items/organizations/${organizationId}`,
    {
      params: { fields: "id,name,status,max_users" },
      skipOrgScope,
    }
  );

  const row = res.data?.data;
  if (!row) {
    throw new Error("Organization not found.");
  }

  const id = String(row.id ?? organizationId);
  const name = String(row.name ?? "Organization");
  const status = normalizeStatus(row.status);
  const maxUsers = normalizeMaxUsers(row.max_users);

  return { id, name, status, maxUsers };
}

async function getOrganizationUserCount(
  organizationId: string,
  skipOrgScope: boolean
): Promise<number> {
  const filter = `filter[organization][_eq]=${encodeURIComponent(organizationId)}`;
  const res = await api.get<{ data?: Array<{ id?: string }> }>(`/users?${filter}&fields=id&limit=-1`, {
    skipOrgScope,
  });
  const list = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.length;
}

export async function ensureOrganizationIsActive(
  organizationId: string,
  options?: { skipOrgScope?: boolean }
): Promise<void> {
  const info = await getOrganizationPolicyInfo(organizationId, Boolean(options?.skipOrgScope));
  if (info.status === "inactive") {
    throw new OrganizationPolicyError(
      `Organization "${info.name}" is inactive. Contact your administrator.`,
      "ORG_INACTIVE"
    );
  }
}

export async function ensureOrganizationCanAddUser(
  organizationId: string,
  options?: { skipOrgScope?: boolean }
): Promise<void> {
  const skipOrgScope = Boolean(options?.skipOrgScope);
  const info = await getOrganizationPolicyInfo(organizationId, skipOrgScope);

  if (info.status === "inactive") {
    throw new OrganizationPolicyError(
      `Organization "${info.name}" is inactive. Activate it before creating users.`,
      "ORG_INACTIVE"
    );
  }

  if (info.maxUsers == null) return;

  const userCount = await getOrganizationUserCount(organizationId, skipOrgScope);
  if (userCount >= info.maxUsers) {
    throw new OrganizationPolicyError(
      `User limit reached for "${info.name}" (${info.maxUsers} max users).`,
      "ORG_USER_LIMIT_REACHED"
    );
  }
}
