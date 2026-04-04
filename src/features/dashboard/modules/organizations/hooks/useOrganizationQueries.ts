import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrganization,
  getOrganizations,
  updateOrganization,
  updateOrganizationStatus,
} from "../services/organizationService";

export const organizationKeys = {
  all: ["organizations"] as const,
  list: () => [...organizationKeys.all, "list"] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.list(),
    queryFn: getOrganizations,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateOrganization>[1];
    }) => updateOrganization(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}

export function useUpdateOrganizationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "inactive";
    }) => updateOrganizationStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}
