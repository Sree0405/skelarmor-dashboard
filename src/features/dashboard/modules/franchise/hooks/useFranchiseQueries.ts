import { useQuery } from "@tanstack/react-query";
import { gymProjectService } from "@/features/dashboard/modules/gym-setup/services/projectService";
import {
  useProject,
  useProjectPayments,
  useProjectsByClient,
} from "@/features/dashboard/modules/gym-setup/hooks/useProjectQueries";

export const franchiseKeys = {
  all: ["franchise"] as const,
  userPayments: (userId: string) => [...franchiseKeys.all, "user-payments", userId] as const,
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

export function useFranchiseUserPayments(userId: string | undefined) {
  return useQuery({
    queryKey: franchiseKeys.userPayments(userId ?? ""),
    queryFn: () => gymProjectService.getPaymentsByUser(userId!),
    enabled: Boolean(userId),
  });
}
