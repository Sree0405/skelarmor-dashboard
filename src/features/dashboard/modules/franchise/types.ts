import type { GymProject, Payment } from "@/features/dashboard/types";
import type { PaymentWithProjectMeta } from "@/features/dashboard/modules/gym-setup/services/projectService";

export type { GymProject, Payment };
export type FranchisePayment = PaymentWithProjectMeta;
