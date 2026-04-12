import type { Organization } from "./services/organizationService";

/** Props passed to each organization detail section (extend when adding new blocks). */
export type OrganizationDetailContext = {
  organizationId: string;
  organization: Organization;
  userCount: number;
  /** True while the user-count query is still resolving (first load or refetch). */
  isUserCountPending?: boolean;
};
