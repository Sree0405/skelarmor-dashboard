import { getTenantContext } from "@/lib/tenantContext";

export class OrganizationScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationScopeError";
  }
}

export function extractOrganizationId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" && id.trim()) return id;
    if (typeof id === "number" && Number.isFinite(id)) return String(id);
    return null;
  }
  return null;
}

export function requireOrganizationId(): string {
  const { organizationId, isSuperAdmin } = getTenantContext();
  if (isSuperAdmin && !organizationId) {
    throw new OrganizationScopeError(
      "Super admin must provide organization context or an explicit bypass."
    );
  }
  if (!organizationId) {
    throw new OrganizationScopeError("Organization context is required.");
  }
  return organizationId;
}

export function withOrganization<T extends Record<string, unknown>>(
  payload: T,
  organizationId?: string
): T & { organization: string } {
  const orgId = organizationId ?? requireOrganizationId();
  return { ...payload, organization: orgId };
}

export function assertBelongsToCurrentOrganization(recordOrganization: unknown): void {
  const { organizationId, isSuperAdmin } = getTenantContext();
  if (isSuperAdmin) return;
  const recordOrg = extractOrganizationId(recordOrganization);
  if (!organizationId || !recordOrg || recordOrg !== organizationId) {
    throw new OrganizationScopeError("Cross-organization operation is blocked.");
  }
}
