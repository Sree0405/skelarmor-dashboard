import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOrganization } from "@/features/dashboard/hooks/useOrganization";

type Props = {
  children: ReactNode;
};

export function SuperAdminFeatureGate({ children }: Props) {
  const { isSuperAdmin } = useOrganization();
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard/admin" replace />;
  }
  return <>{children}</>;
}
