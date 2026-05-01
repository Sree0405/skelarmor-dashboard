import { useMemo } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProgressEntry } from "@/features/dashboard/types";
import {
  selectLatestProgress,
  selectProgressByCustomer,
  selectProgressInRange,
  selectCustomersByStatus,
  computeProgressStats,
} from "@/features/dashboard/selectors";
import * as customerService from "../services/customerService";
import type { CustomerPagedRequest } from "../listing/types";
import type {
  CreateCustomerPayload,
  CreatePaymentPayload,
  CreateProgressPayload,
  UpdatePaymentPayload,
  Customer,
  FitnessProgress,
  UpdateCustomerPayload,
  UpdateProgressPayload,
} from "../types";

export const customerKeys = {
  all: ["customers"] as const,
  list: () => [...customerKeys.all, "list"] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
  progress: (userId: string) => [...customerKeys.all, "progress", userId] as const,
  payments: (userId: string) => [...customerKeys.all, "payments", userId] as const,
};

function stableFacetKey(facets: Record<string, string[]>) {
  return JSON.stringify(
    Object.keys(facets)
      .sort()
      .reduce<Record<string, string[]>>((acc, k) => {
        acc[k] = [...(facets[k] ?? [])].sort();
        return acc;
      }, {})
  );
}

export function customerPagedQueryKey(args: CustomerPagedRequest) {
  return [
    ...customerKeys.all,
    "paged",
    args.page,
    args.pageSize,
    args.q,
    stableFacetKey(args.facets),
    args.billingFilter,
  ] as const;
}

export function progressUserId(p: FitnessProgress, fallback: string): string {
  if (typeof p.user === "string") return p.user;
  return p.user?.id ?? fallback;
}

export function fitnessToProgressEntry(p: FitnessProgress, fallbackUserId: string): ProgressEntry {
  return {
    id: p.id,
    customerId: progressUserId(p, fallbackUserId),
    date: p.date ?? "",
    weight: Number(p.weight ?? 0),
    fatPercentage: Number(p.fat_percentage ?? p.fatPercentage ?? 0),
  };
}

export function useCustomersPaged(args: CustomerPagedRequest) {
  return useQuery({
    queryKey: customerPagedQueryKey(args),
    queryFn: () => customerService.getCustomersPaged(args),
    placeholderData: (previousData) => previousData,
  });
}

/** Sample slice for adaptive filter discovery (cached; invalidated with `customerKeys.all`). */
export function useCustomerFacetSamples() {
  return useQuery({
    queryKey: [...customerKeys.all, "facet-samples"] as const,
    queryFn: () =>
      customerService.getCustomersPaged({ page: 1, pageSize: 200, q: "", facets: {}, billingFilter: "all" }),
    staleTime: 5 * 60_000,
  });
}

export function useCustomers(statusFilter: "all" | "active" | "inactive" = "all") {
  const query = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => customerService.getCustomers(),
  });

  const customers = query.data ?? [];
  const filtered = useMemo(
    () => selectCustomersByStatus(customers, statusFilter),
    [customers, statusFilter]
  );
  const activeCount = useMemo(
    () => customers.filter((c) => (c.status ?? "active") === "active").length,
    [customers]
  );

  return {
    ...query,
    customers,
    filtered,
    total: customers.length,
    activeCount,
  };
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ""),
    queryFn: () => customerService.getCustomerById(id!),
    enabled: !!id,
  });
}

export function useCustomerProgress(userId: string | undefined) {
  return useQuery({
    queryKey: customerKeys.progress(userId ?? ""),
    queryFn: () => customerService.getCustomerProgress(userId!),
    enabled: !!userId,
  });
}

export function useCustomerPayments(userId: string | undefined) {
  return useQuery({
    queryKey: customerKeys.payments(userId ?? ""),
    queryFn: () => customerService.getCustomerPayments(userId!),
    enabled: !!userId,
  });
}

/** Maps API progress to dashboard `ProgressEntry` and applies optional month window. */
export function useProgress(customerId: string | undefined, months?: number) {
  const { data: raw = [], isLoading, isError, error, refetch } = useCustomerProgress(customerId);

  const entries = useMemo(() => {
    if (!customerId) return [];
    const mapped = raw.map((p) => fitnessToProgressEntry(p, customerId));
    return months
      ? selectProgressInRange(mapped, customerId, months)
      : selectProgressByCustomer(mapped, customerId);
  }, [raw, customerId, months]);

  const stats = useMemo(() => computeProgressStats(entries), [entries]);
  const latest = useMemo(
    () => (customerId ? selectLatestProgress(
      raw.map((p) => fitnessToProgressEntry(p, customerId)),
      customerId
    ) : null),
    [raw, customerId]
  );

  return { entries, stats, latest, isLoading, isError, error, refetch };
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerPayload) => customerService.createCustomer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerPayload }) =>
      customerService.updateCustomer(id, data),
    onSuccess: (_u, { id }) => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
      qc.invalidateQueries({ queryKey: customerKeys.detail(id) });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
      qc.removeQueries({ queryKey: customerKeys.detail(id) });
    },
  });
}

export function useAddProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProgressPayload) => {
      const row = await customerService.addProgress(data);
      await customerService.syncCustomerProfileFromLatestProgress(data.user);
      return row;
    },
    onSuccess: (_row, vars) => {
      qc.invalidateQueries({ queryKey: customerKeys.progress(vars.user) });
      qc.invalidateQueries({ queryKey: customerKeys.detail(vars.user) });
      qc.invalidateQueries({ queryKey: customerKeys.all });
      invalidateFitnessBulk(qc);
    },
  });
}

export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
      userId,
    }: {
      id: string;
      data: UpdateProgressPayload;
      userId: string;
    }) => {
      const row = await customerService.updateProgress(id, data);
      await customerService.syncCustomerProfileFromLatestProgress(userId);
      return row;
    },
    onSuccess: (_row, { userId }) => {
      qc.invalidateQueries({ queryKey: customerKeys.progress(userId) });
      qc.invalidateQueries({ queryKey: customerKeys.detail(userId) });
      qc.invalidateQueries({ queryKey: customerKeys.all });
      invalidateFitnessBulk(qc);
    },
  });
}

function invalidatePaymentsBulk(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: [...customerKeys.all, "payments-bulk"] });
}

function invalidateFitnessBulk(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: [...customerKeys.all, "fitness-bulk"] });
}

export function usePaymentsForCustomerIds(userIds: string[]) {
  const sortedKey = useMemo(() => [...userIds].sort().join(","), [userIds]);
  return useQuery({
    queryKey: [...customerKeys.all, "payments-bulk", sortedKey] as const,
    queryFn: () => customerService.getPaymentsForUsers(userIds),
    enabled: userIds.length > 0,
  });
}

export function useFitnessProgressForUsers(userIds: string[]) {
  const sortedKey = useMemo(() => [...userIds].sort().join(","), [userIds]);
  return useQuery({
    queryKey: [...customerKeys.all, "fitness-bulk", sortedKey] as const,
    queryFn: () => customerService.getFitnessProgressForUsers(userIds),
    enabled: userIds.length > 0,
  });
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentPayload) => customerService.addPayment(data),
    onSuccess: (_row, vars) => {
      qc.invalidateQueries({ queryKey: customerKeys.payments(vars.user) });
      invalidatePaymentsBulk(qc);
    },
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePaymentPayload;
      userId: string;
    }) => customerService.updatePayment(id, data),
    onSuccess: (_row, { userId }) => {
      qc.invalidateQueries({ queryKey: customerKeys.payments(userId) });
      invalidatePaymentsBulk(qc);
    },
  });
}

export function customerDisplayName(c: Pick<Customer, "first_name" | "last_name" | "email">): string {
  const n = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return n || c.email || "—";
}
