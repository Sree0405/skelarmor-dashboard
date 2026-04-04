import { useMemo } from "react";
import {
  useProjectsList,
  useProjectsByClient,
  useAllProjectContextPayments,
} from "@/features/dashboard/modules/gym-setup/hooks/useProjectQueries";
import {
  selectPaymentsByProjects,
  computeFinancialSummaryFromProjects,
  computeAdminKPIs,
  computeClientKPIs,
} from "@/features/dashboard/selectors";
import { useCustomers } from "@/features/dashboard/modules/customers/hooks/useCustomerQueries";

export const useProjects = () => {
  const { data: projects = [], isLoading, isError, error, refetch } = useProjectsList();
  const { data: payments = [], isLoading: paymentsLoading } = useAllProjectContextPayments();

  const financials = useMemo(() => computeFinancialSummaryFromProjects(projects), [projects]);

  return {
    projects,
    payments,
    financials,
    isLoading: isLoading || paymentsLoading,
    isError,
    error,
    refetch,
  };
};

export const useClientProjects = (clientId: string | undefined) => {
  const { data: myProjects = [], isLoading, isError, error, refetch } = useProjectsByClient(clientId);
  const projectIds = useMemo(() => myProjects.map((p) => p.id), [myProjects]);
  const { data: allProjectPayments = [], isLoading: payLoading } = useAllProjectContextPayments();

  const myPayments = useMemo(
    () => (clientId ? selectPaymentsByProjects(allProjectPayments, projectIds) : []),
    [allProjectPayments, projectIds, clientId]
  );

  const financials = useMemo(() => computeFinancialSummaryFromProjects(myProjects), [myProjects]);

  return {
    projects: myProjects,
    payments: myPayments,
    financials,
    isLoading: isLoading || payLoading,
    isError,
    error,
    refetch,
  };
};

export const useAdminKPIs = () => {
  const { customers } = useCustomers("all");
  const { data: projects = [] } = useProjectsList();
  const { data: payments = [] } = useAllProjectContextPayments();
  return useMemo(() => computeAdminKPIs(customers, projects, payments), [customers, projects, payments]);
};

export const useClientKPIs = (clientId: string | undefined) => {
  const { projects, payments } = useClientProjects(clientId);
  return useMemo(() => computeClientKPIs(projects, payments), [projects, payments]);
};
