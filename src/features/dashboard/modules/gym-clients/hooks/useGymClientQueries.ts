import { useMemo } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GymProject } from "@/features/dashboard/types";
import { projectKeys, useProjectsList } from "@/features/dashboard/modules/gym-setup/hooks/useProjectQueries";
import type { CreateGymClientPayload, GymClient, GymClientRowStats, UpdateGymClientPayload } from "../types";
import {
  gymClientService,
  getFranchiseProjectPaymentsDirectory,
} from "../services/gymClientService";
import type { GymClientProjectPayment } from "../types";

export const gymClientKeys = {
  all: ["gym-clients"] as const,
  list: () => [...gymClientKeys.all, "list"] as const,
  detail: (id: string) => [...gymClientKeys.all, "detail", id] as const,
  projects: (clientId: string) => [...gymClientKeys.all, "projects", clientId] as const,
  payments: (clientId: string) => [...gymClientKeys.all, "payments", clientId] as const,
  directoryPayments: () => [...gymClientKeys.all, "directory-payments"] as const,
};

function buildStatsMap(
  clients: GymClient[],
  projects: GymProject[],
  payments: GymClientProjectPayment[]
): Map<string, GymClientRowStats> {
  const map = new Map<string, GymClientRowStats>();
  for (const c of clients) {
    map.set(c.id, { projectCount: 0, totalPaid: 0, totalPending: 0 });
  }
  for (const p of projects) {
    const st = map.get(p.clientId);
    if (!st) continue;
    st.projectCount += 1;
    st.totalPending += p.pendingAmount;
  }
  for (const pay of payments) {
    const st = map.get(pay.userId);
    if (!st) continue;
    if (pay.type === "paid") st.totalPaid += pay.amount;
  }
  return map;
}

export function useGymClients() {
  return useQuery({
    queryKey: gymClientKeys.list(),
    queryFn: () => gymClientService.getGymClients(),
  });
}

export function useGymClient(id: string | undefined) {
  return useQuery({
    queryKey: gymClientKeys.detail(id ?? ""),
    queryFn: () => gymClientService.getGymClientById(id!),
    enabled: !!id,
  });
}

/** Projects where `projects.client` = franchise user id. */
export function useGymClientProjects(clientId: string | undefined) {
  return useQuery({
    queryKey: gymClientKeys.projects(clientId ?? ""),
    queryFn: () => gymClientService.getClientProjects(clientId!),
    enabled: !!clientId,
  });
}

/** Project payments with `payment_context=project` and `user` = client id. */
export function useGymClientPayments(clientId: string | undefined) {
  return useQuery({
    queryKey: gymClientKeys.payments(clientId ?? ""),
    queryFn: () => gymClientService.getClientPayments(clientId!),
    enabled: !!clientId,
  });
}

export function useGymClientsDirectoryPayments() {
  return useQuery({
    queryKey: gymClientKeys.directoryPayments(),
    queryFn: () => getFranchiseProjectPaymentsDirectory(),
  });
}

/** List page: clients + per-row stats (projects, paid from user-scoped payments, pending from projects). */
export function useGymClientsWithStats() {
  const clientsQuery = useGymClients();
  const { data: projects = [], isLoading: projLoading } = useProjectsList();
  const dirPay = useGymClientsDirectoryPayments();

  const statsById = useMemo(() => {
    const list = clientsQuery.data ?? [];
    if (list.length === 0) return new Map<string, GymClientRowStats>();
    return buildStatsMap(list, projects, dirPay.data ?? []);
  }, [clientsQuery.data, projects, dirPay.data]);

  return {
    clients: clientsQuery.data ?? [],
    statsById,
    isLoading: clientsQuery.isLoading || projLoading || dirPay.isLoading,
    isError: clientsQuery.isError || dirPay.isError,
    error: clientsQuery.error ?? dirPay.error,
    refetch: () => {
      void clientsQuery.refetch();
      void dirPay.refetch();
    },
  };
}

function invalidateGymClients(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: gymClientKeys.all });
  void qc.invalidateQueries({ queryKey: projectKeys.franchiseUsers() });
}

export function useCreateGymClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGymClientPayload) => gymClientService.createGymClient(data),
    onSuccess: () => invalidateGymClients(qc),
  });
}

export function useUpdateGymClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGymClientPayload }) =>
      gymClientService.updateGymClient(id, data),
    onSuccess: (_u, { id }) => {
      invalidateGymClients(qc);
      void qc.invalidateQueries({ queryKey: gymClientKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: gymClientKeys.projects(id) });
      void qc.invalidateQueries({ queryKey: gymClientKeys.payments(id) });
    },
  });
}

export function useDeleteGymClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gymClientService.deleteGymClient(id),
    onSuccess: () => {
      invalidateGymClients(qc);
      void qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/** Spec names; import from this module only (differs from franchise `useProjects` naming). */
export const useClientProjects = useGymClientProjects;
export const useClientPayments = useGymClientPayments;
