import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateDirectusProjectPayload, UpdateDirectusProjectPayload } from "../types";
import { gymProjectService } from "../services/projectService";

export const projectKeys = {
  all: ["gym-projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  byClient: (clientId: string) => [...projectKeys.all, "client", clientId] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
  payments: (projectId: string) => [...projectKeys.all, "payments", projectId] as const,
  allProjectPayments: () => [...projectKeys.all, "payments-all"] as const,
  franchiseUsers: () => [...projectKeys.all, "franchise-users"] as const,
};

function invalidateProjectQueries(qc: QueryClient, projectId?: string) {
  void qc.invalidateQueries({ queryKey: projectKeys.all });
  if (projectId) {
    void qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    void qc.invalidateQueries({ queryKey: projectKeys.payments(projectId) });
  }
}

/** All projects (admin list / KPIs). */
export function useProjectsList() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: () => gymProjectService.getProjects(),
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ""),
    queryFn: () => gymProjectService.getProjectById(projectId!),
    enabled: !!projectId,
  });
}

export function useProjectsByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.byClient(clientId ?? ""),
    queryFn: () => gymProjectService.getProjectsByClient(clientId!),
    enabled: !!clientId,
  });
}

export function useProjectPayments(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.payments(projectId ?? ""),
    queryFn: () => gymProjectService.getProjectPayments(projectId!),
    enabled: !!projectId,
  });
}

/** Every payment with `payment_context=project` (admin KPIs / aggregates). */
export function useAllProjectContextPayments() {
  return useQuery({
    queryKey: projectKeys.allProjectPayments(),
    queryFn: () => gymProjectService.getAllProjectContextPayments(),
  });
}

export function useFranchiseUsers() {
  return useQuery({
    queryKey: projectKeys.franchiseUsers(),
    queryFn: () => gymProjectService.getFranchiseUsers(),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDirectusProjectPayload) => gymProjectService.createProject(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDirectusProjectPayload }) =>
      gymProjectService.updateProjectApi(id, data),
    onSuccess: (_row, { id }) => invalidateProjectQueries(qc, id),
  });
}

export function useAddProjectPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      amount,
      date,
      type,
      notes,
    }: {
      projectId: string;
      amount: number;
      date?: string | null;
      type?: string | null;
      notes?: string | null;
    }) => gymProjectService.addProjectPayment(projectId, { amount, date, type, notes }),
    onSuccess: (_pay, vars) => {
      invalidateProjectQueries(qc, vars.projectId);
      void qc.invalidateQueries({ queryKey: ["franchise"] });
    },
  });
}

export type { CreateDirectusProjectPayload, UpdateDirectusProjectPayload };
