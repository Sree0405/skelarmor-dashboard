import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrganization,
  createAdminUserForOrganization,
  deleteOrganization,
  getOrganizationById,
  getOrganizations,
  getOrganizationUserCount,
  updateOrganization,
  updateOrganizationStatus,
} from "../services/organizationService";

export const organizationKeys = {
  all: ["organizations"] as const,
  list: () => [...organizationKeys.all, "list"] as const,
  detail: (id: string) => [...organizationKeys.all, "detail", id] as const,
  userCount: (id: string) => [...organizationKeys.all, "userCount", id] as const,
};

function invalidateAllOrganizationQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: organizationKeys.all });
}

export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.list(),
    queryFn: getOrganizations,
  });
}

export function useOrganizationById(organizationId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.detail(organizationId ?? ""),
    queryFn: () => getOrganizationById(organizationId!),
    enabled: Boolean(organizationId),
  });
}

export function useOrganizationUserCount(organizationId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.userCount(organizationId ?? ""),
    queryFn: () => getOrganizationUserCount(organizationId!),
    enabled: Boolean(organizationId),
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => invalidateAllOrganizationQueries(qc),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateOrganization>[1] }) =>
      updateOrganization(id, payload),
    onSuccess: () => invalidateAllOrganizationQueries(qc),
  });
}

export function useUpdateOrganizationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) =>
      updateOrganizationStatus(id, status),
    onSuccess: () => invalidateAllOrganizationQueries(qc),
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: (_void, id) => {
      void qc.removeQueries({ queryKey: organizationKeys.detail(id) });
      void qc.removeQueries({ queryKey: organizationKeys.userCount(id) });
      invalidateAllOrganizationQueries(qc);
    },
  });
}

export function useCreateOrgAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminUserForOrganization,
    onSuccess: () => invalidateAllOrganizationQueries(qc),
  });
}
