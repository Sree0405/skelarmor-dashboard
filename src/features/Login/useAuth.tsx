// features/auth/useAuth.ts

import { useEffect } from "react";
import { useAuthStore, selectUser, selectIsAuth, selectRole } from "./store";

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Primary auth hook for components.
 *
 * Triggers `hydrateAuthSession()` on mount (idempotent; skips /users/me if user is already in the store).
 *
 * @example
 * const { user, isAuthenticated, isLoading, logout } = useAuth();
 */
export const useAuth = () => {
  const user            = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuth);
  const role            = useAuthStore(selectRole);
  const isLoading       = useAuthStore((s) => s.isLoading);
  const hydrationStatus = useAuthStore((s) => s.hydrationStatus);
  const fetchMe         = useAuthStore((s) => s.fetchMe);
  const logout          = useAuthStore((s) => s.logout);

  useEffect(() => {
    void useAuthStore.getState().hydrateAuthSession();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    hydrationStatus,
    role,
    logout,
    fetchMe,
  };
};

// ─── Imperative initialiser (call once before mounting the React tree) ─────────

export { bootstrapAuthFromStorage as initAuth } from "./store";