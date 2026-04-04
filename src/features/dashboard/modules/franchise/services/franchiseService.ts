import { gymProjectService } from "@/features/dashboard/modules/gym-setup/services/projectService";

/** Franchise-portal API surface (wraps gym project service; no duplicate HTTP logic). */
export const franchiseService = {
  getProjectsByClient: gymProjectService.getProjectsByClient,
  getProjectById: gymProjectService.getProjectById,
  getProjectPayments: gymProjectService.getProjectPayments,
  getPaymentsByUser: gymProjectService.getPaymentsByUser,
} as const;
