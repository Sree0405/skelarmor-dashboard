import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { gymProjectService } from "@/features/dashboard/modules/gym-setup/services/projectService";
import {
  useProject,
  useProjectPayments,
  useProjectsByClient,
} from "@/features/dashboard/modules/gym-setup/hooks/useProjectQueries";

export const franchiseKeys = {
  all: ["franchise"] as const,
  clientProjectPayments: (clientId: string, projectIdsKey: string) =>
    [...franchiseKeys.all, "client-project-payments", clientId, projectIdsKey] as const,
};

export function useFranchiseProjectsList(clientId: string | undefined) {
  return useProjectsByClient(clientId);
}

export function useFranchiseProjectDetail(projectId: string | undefined) {
  return useProject(projectId);
}

export function useFranchisePaymentsForProject(projectId: string | undefined) {
  return useProjectPayments(projectId);
}

/**
 * Payments for the franchise client's projects (paid + pending).
 * Project-scoped rows are keyed by `project`, not `user`, so this loads by project id instead of `getPaymentsByUser`.
 */
export function useFranchiseUserPayments(clientId: string | undefined) {
  const projectsQuery = useProjectsByClient(clientId);
  const projectIds = useMemo(() => (projectsQuery.data ?? []).map((p) => p.id), [projectsQuery.data]);
  const projectIdsKey = useMemo(() => [...projectIds].sort().join(","), [projectIds]);

  const paymentsQuery = useQuery({
    queryKey: franchiseKeys.clientProjectPayments(clientId ?? "", projectIdsKey),
    queryFn: () => gymProjectService.getPaymentsForProjectIds(projectIds),
    enabled: Boolean(clientId) && projectIds.length > 0,
  });

  const isLoading = projectsQuery.isLoading || paymentsQuery.isLoading;

  const data = projectIds.length === 0 ? [] : (paymentsQuery.data ?? []);

  return {
    data,
    isLoading,
    isError: projectsQuery.isError || paymentsQuery.isError,
    error: projectsQuery.error ?? paymentsQuery.error,
    refetch: () =>
      Promise.all([projectsQuery.refetch(), paymentsQuery.refetch()]).then(() => undefined),
  };
}
