import axios, { type AxiosError, type AxiosInstance } from "axios";
import { API_BASE_URL } from "@/config/env";
import { getAccessToken } from "@/lib/authToken";
import { getTenantContext } from "@/lib/tenantContext";

const jsonHeaders = { "Content-Type": "application/json" };

type ScopedAxiosConfig = {
  skipOrgScope?: boolean;
};

function splitUrl(url: string): { pathname: string; query: string } {
  const [pathname, query = ""] = url.split("?");
  return { pathname, query };
}

function isScopedEndpoint(url: string): boolean {
  const { pathname } = splitUrl(url);
  return (
    (pathname.startsWith("/items/") || pathname.startsWith("/users")) &&
    !pathname.startsWith("/users/me") &&
    !pathname.startsWith("/auth/")
  );
}

function isCollectionReadEndpoint(url: string): boolean {
  const { pathname } = splitUrl(url);
  return /^\/items\/[^/]+$/.test(pathname) || pathname === "/users";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function mergeOrgFilter(baseFilter: unknown, orgId: string): Record<string, unknown> {
  const orgClause = { organization: { _eq: orgId } };
  if (!isPlainObject(baseFilter)) return orgClause;
  return { _and: [baseFilter, orgClause] };
}

function parseFilterJSON(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ensureOrgQueryFilter(url: string, orgId: string): string {
  const { pathname: path, query: queryString } = splitUrl(url);
  const params = new URLSearchParams(queryString);
  const filterParam = params.get("filter");
  if (filterParam) {
    const parsed = parseFilterJSON(filterParam);
    if (parsed) {
      params.set("filter", JSON.stringify(mergeOrgFilter(parsed, orgId)));
      return `${path}?${params.toString()}`;
    }
  }
  params.set("filter[organization][_eq]", orgId);
  return `${path}?${params.toString()}`;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: jsonHeaders,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const url = String(config.url ?? "");
  const method = String(config.method ?? "get").toUpperCase();
  const scoped = isScopedEndpoint(url);
  const custom = config as typeof config & ScopedAxiosConfig;
  if (!scoped || custom.skipOrgScope) {
    return config;
  }

  const { organizationId, isSuperAdmin } = getTenantContext();
  if (!organizationId && !isSuperAdmin) {
    return Promise.reject(
      new Error("Organization context is required for scoped API requests.")
    );
  }
  if (!organizationId && isSuperAdmin) {
    return config;
  }
  if (!organizationId) {
    return config;
  }

  if (method === "GET" && isCollectionReadEndpoint(url)) {
    config.url = ensureOrgQueryFilter(url, organizationId);
    return config;
  }

  if (method === "POST" && isPlainObject(config.data) && !("organization" in config.data)) {
    config.data = { ...config.data, organization: organizationId };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? "");
    if (status !== 401 || url.includes("/auth/login")) {
      return Promise.reject(error);
    }
    const { useAuthStore } = await import("@/features/Login/store");
    await useAuthStore.getState().logout();
    return Promise.reject(error);
  }
);

export const authPublicApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: jsonHeaders,
});
