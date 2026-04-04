export type TenantContext = {
  organizationId: string | null;
  isSuperAdmin: boolean;
};

type TenantContextGetter = () => TenantContext;

let tenantContextGetter: TenantContextGetter = () => ({
  organizationId: null,
  isSuperAdmin: false,
});

export function registerTenantContextGetter(getter: TenantContextGetter): void {
  tenantContextGetter = getter;
}

export function getTenantContext(): TenantContext {
  return tenantContextGetter();
}
