import axios from "axios";
import { authPublicApi, api } from "@/lib/apiClient";

export type DirectusUser = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  dashboard_roles?: string;
  [key: string]: unknown;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

export async function fetchCurrentUser(): Promise<DirectusUser> {
  try {
    const res = await api.get<{ data?: DirectusUser }>("/users/me");
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
      const body = err.response?.data as { errors?: { message?: string }[] } | undefined;
      const msg = body?.errors?.[0]?.message ?? "Invalid credentials.";
      throw new AuthApiError(msg, err.response?.status);
    }
    throw err;
  }
}

export async function logoutFromServer(refreshToken: string): Promise<void> {
  await authPublicApi.post("/auth/logout", { refresh_token: refreshToken }).catch(() => {
    /* ignore */
  });
}
