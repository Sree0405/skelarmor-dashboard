import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOrganization } from "@/features/dashboard/hooks/useOrganization";

type Props = {
  children: ReactNode;
};

export function LeadsFeatureGate({ children }: Props) {
  const { isMain, isSuperAdmin } = useOrganization();
  if (!isMain && !isSuperAdmin) {
    return <Navigate to="/dashboard/admin" replace />;
  }
  return <>{children}</>;
}
