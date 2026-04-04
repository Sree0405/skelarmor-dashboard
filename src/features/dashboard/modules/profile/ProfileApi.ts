// features/dashboard/modules/profile/profileApi.ts

import axios from "axios";
import { api } from "@/lib/apiClient";
import { getAccessToken } from "@/lib/authToken";

export class ProfileApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ProfileApiError";
  }
}

function ensureToken(): void {
  if (!getAccessToken()) throw new ProfileApiError("No access token found.", 401);
}

// ─── Update basic profile fields ──────────────────────────────────────────────

export type ProfileUpdatePayload = {
  first_name?:          string;
  last_name?:           string;
  email?:               string;
  location?:            string | null;
  title?:               string | null;
  description?:         string | null;
  email_notifications?: boolean;
  age?:                 number | null;
  goal?:                string | null;
  currentWeight?:       number | null;
  fatPercentage?:       number | null;
};

export async function updateProfile(
  userId: string,
  payload: ProfileUpdatePayload
): Promise<void> {
  ensureToken();
  try {
    await api.patch(`/users/${userId}`, payload);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as { errors?: { message?: string }[] } | undefined;
      const msg = body?.errors?.[0]?.message ?? `Update failed (HTTP ${e.response?.status})`;
      throw new ProfileApiError(msg, e.response?.status);
    }
    throw e;
  }
}

// ─── Update password ──────────────────────────────────────────────────────────

export async function updatePassword(newPassword: string): Promise<void> {
  ensureToken();
  try {
    await api.patch("/users/me", { password: newPassword });
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as { errors?: { message?: string }[] } | undefined;
      const msg = body?.errors?.[0]?.message ?? `Password update failed (HTTP ${e.response?.status})`;
      throw new ProfileApiError(msg, e.response?.status);
    }
    throw e;
  }
}