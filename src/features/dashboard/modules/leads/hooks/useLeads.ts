// features/dashboard/modules/leads/hooks/useLeads.ts

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/apiClient";
import { useOrganization } from "@/features/dashboard/hooks/useOrganization";
import { Lead, normalizeLead } from "../types/lead";

async function fetchLeads(): Promise<Lead[]> {
  try {
    const res = await api.get<{ data?: Record<string, unknown>[] }>("/items/contact_form", {
      params: { sort: "-date", limit: -1 },
    });
    const raw: Record<string, unknown>[] = res.data?.data ?? [];
    return raw
      .map(normalizeLead)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    if (axios.isAxiosError(e)) {
      throw new Error(`HTTP ${e.response?.status ?? "error"}`);
    }
    throw e;
  }
}

async function fetchLeadById(id: string): Promise<Lead> {
  try {
    const res = await api.get<{ data?: Record<string, unknown> }>(`/items/contact_form/${id}`);
    if (!res.data?.data) throw new Error("Lead not found");
    return normalizeLead(res.data.data);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      throw new Error(`HTTP ${e.response?.status ?? "error"}`);
    }
    throw e;
  }
}

export function useLeads() {
  const { orgId, isSuperAdmin } = useOrganization();
  return useQuery<Lead[], Error>({
    queryKey: ["leads", orgId ?? "super-admin"],
    queryFn: fetchLeads,
    enabled: Boolean(orgId || isSuperAdmin),
  });
}

export function useLeadById(id: string | undefined) {
  const { orgId, isSuperAdmin } = useOrganization();
  return useQuery<Lead, Error>({
    queryKey: ["leads", orgId ?? "super-admin", id],
    queryFn: () => fetchLeadById(id!),
    enabled: Boolean(id && (orgId || isSuperAdmin)),
  });
}
