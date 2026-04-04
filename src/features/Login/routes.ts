// features/auth/index.ts
// Public surface of the auth feature — import from here, not from sub-files.

export type { DirectusUser, AuthApiError } from "./api";
export { login, logoutFromServer } from "./api";

export type { DashboardRole } from "./utils";
export { getRoleDestination, isValidRole, hasAccess, ALL_ROLES } from "./utils";

export { useAuthStore, selectUser, selectIsAuth, selectRole, bootstrapAuthFromStorage } from "./store";

export { useAuth, initAuth } from "./useAuth";

export {
  ProtectedRoute,
  AdminRoute,
  FranchiseRoute,
  TrainingRoute,
} from "./components/ProtectedRoute";