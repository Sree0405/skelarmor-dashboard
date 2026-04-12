import axios, { type AxiosError } from "axios";
import { authPublicApi, api } from "@/lib/apiClient";
import { extractOrganizationId } from "@/lib/organizationScope";
import { ensureOrganizationAllowsLogin } from "@/lib/organizationPolicy";

const TRAINING_CLIENT_ROLE = "training_client";

/** Shown when a training client is inactive/suspended or when the auth API signals the same. */
export const INACTIVE_CUSTOMER_LOGIN_MESSAGE = "Inactive customer don't have access";

export const AUTH_ERROR_INACTIVE_CUSTOMER_ACCESS = "INACTIVE_CUSTOMER_ACCESS" as const;

type DirectusOrganizationRef = {
  id: string | number;
  name?: string;
  status?: string;
  max_users?: string | number | null;
  can_login?: boolean;
};

export type DirectusUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  /** App / Directus user lifecycle (e.g. active | inactive for training clients). */
  status?: string | null;
  dashboard_roles?: string;
  organization?: string | number | DirectusOrganizationRef | null;
  organization_id?: string | number | null;
  organizationId?: string | number | null;
  is_super_admin?: boolean;
  [key: string]: unknown;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

type DirectusErrorsBody = {
  errors?: Array<{ message?: string; extensions?: Record<string, unknown> }>;
};

function readFirstAuthError(err: AxiosError<unknown>): { message: string; code: string; reason: string } {
  const body = (err.response?.data ?? undefined) as DirectusErrorsBody | undefined;
  const first = body?.errors?.[0];
  const msg = typeof first?.message === "string" ? first.message : "Invalid credentials.";
  const ext = first?.extensions;
  const code = typeof ext?.["code"] === "string" ? ext["code"] : "";
  const reason = typeof ext?.["reason"] === "string" ? ext["reason"] : "";
  return { message: msg, code, reason };
}

/**
 * When Directus (or a Flow) returns a distinct inactive/suspended signal, map it to the
 * customer-facing copy. Generic "Invalid user credentials" is unchanged so wrong passwords
 * are not mislabeled.
 */
function loginErrorIndicatesInactiveCustomer(message: string, code: string, reason: string): boolean {
  const inactiveCodes = new Set([
    "INACTIVE_TRAINING_CLIENT",
    "USER_INACTIVE",
    "USER_SUSPENDED",
    "USER_ARCHIVED",
  ]);
  if (inactiveCodes.has(code) || inactiveCodes.has(reason)) return true;
  const low = message.toLowerCase();
  const stateHints = ["inactive", "suspended", "archived", "deactivated"];
  if (!stateHints.some((h) => low.includes(h))) return false;
  const contextHints = ["customer", "client", "account", "user", "login", "access"];
  return contextHints.some((h) => low.includes(h));
}

export async function fetchCurrentUser(): Promise<DirectusUser> {
  try {
    const res = await api.get<{ data?: DirectusUser }>("/users/me", {
      params: {
        fields: [
          "id",
          "email",
          "first_name",
          "last_name",
          "avatar",
          "status",
          "dashboard_roles",
          "organization",
          "organization.id",
          "organization.name",
          "organization.can_login",
          "is_super_admin",
          "organization_id",
          "organizationId",
        ].join(","),
      },
    });
    const user = res.data?.data;
    if (!user?.id) {
      throw new AuthApiError("Invalid user payload received from server.");
    }
    return user;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      throw new AuthApiError("Session expired. Please sign in again.", 401);
    }
    if (err instanceof AuthApiError) throw err;
    if (axios.isAxiosError(err)) {
      const msg = (err.response?.data as { errors?: { message?: string }[] })?.errors?.[0]?.message;
      throw new AuthApiError(typeof msg === "string" ? msg : err.message, err.response?.status);
    }
    throw err;
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ access_token: string; refresh_token: string; dashboard_roles: string }> {
  try {
    const res = await authPublicApi.post<{ data: { access_token: string; refresh_token: string; dashboard_roles: string } }>(
      "/auth/login",
      { email, password }
    );
    return res.data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const { message, code, reason } = readFirstAuthError(err);
      if (loginErrorIndicatesInactiveCustomer(message, code, reason)) {
        throw new AuthApiError(
          INACTIVE_CUSTOMER_LOGIN_MESSAGE,
          err.response?.status,
          AUTH_ERROR_INACTIVE_CUSTOMER_ACCESS
        );
      }
      throw new AuthApiError(message, err.response?.status);
    }
    throw err;
  }
}

/** Blocks inactive / suspended training clients after a successful token exchange. */
export function enforceTrainingClientAccessPolicy(user: DirectusUser): void {
  if (user.dashboard_roles !== TRAINING_CLIENT_ROLE) return;
  const st = String(user.status ?? "active").toLowerCase();
  if (st === "inactive" || st === "suspended" || st === "archived") {
    throw new AuthApiError(
      INACTIVE_CUSTOMER_LOGIN_MESSAGE,
      undefined,
      AUTH_ERROR_INACTIVE_CUSTOMER_ACCESS
    );
  }
}

export async function enforceLoginOrganizationPolicy(user: DirectusUser): Promise<void> {
  if (user.is_super_admin) return;
  const orgId = extractOrganizationId(
    user.organization ?? user.organization_id ?? user.organizationId ?? null
  );
  if (!orgId) return;
  await ensureOrganizationAllowsLogin(orgId, user.dashboard_roles);
}

/** Runs all post-auth checks (customer access, then organization rules). */
export async function enforceLoginAccessPolicies(user: DirectusUser): Promise<void> {
  enforceTrainingClientAccessPolicy(user);
  await enforceLoginOrganizationPolicy(user);
}

export async function logoutFromServer(refreshToken: string): Promise<void> {
  await authPublicApi.post("/auth/logout", { refresh_token: refreshToken }).catch(() => {
    /* ignore */
  });
}
