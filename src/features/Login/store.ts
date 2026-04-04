import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { registerAuthTokenGetter } from "@/lib/authToken";
import { extractOrganizationId } from "@/lib/organizationScope";
import { registerTenantContextGetter } from "@/lib/tenantContext";
import { DirectusUser, fetchCurrentUser, logoutFromServer } from "./api";

type HydrationStatus = "idle" | "loading" | "done" | "error";

interface AuthState {
  user: DirectusUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  hydrationStatus: HydrationStatus;

  setToken: (access: string, refresh?: string) => void;
  setUser: (user: DirectusUser) => void;
  hydrateAuthSession: () => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

const LEGACY_ACCESS = "access_token";
const LEGACY_REFRESH = "refresh_token";

let hydratePromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      hydrationStatus: "idle",

      setToken: (access, refresh) => {
        set({
          accessToken: access,
          refreshToken: refresh ?? get().refreshToken,
          user: null,
        });
      },

      setUser: (user) =>
        set({
          user,
          isLoading: false,
          hydrationStatus: "done",
        }),

      hydrateAuthSession: async () => {
        if (hydratePromise) {
          await hydratePromise;
          return;
        }

        hydratePromise = (async () => {
          try {
            const token = get().accessToken;
            if (!token) {
              set({ hydrationStatus: "done", isLoading: false });
              return;
            }
            if (get().user?.id) {
              set({ hydrationStatus: "done", isLoading: false });
              return;
            }

            set({ isLoading: true, hydrationStatus: "loading" });
            const user = await fetchCurrentUser();
            set({ user, isLoading: false, hydrationStatus: "done" });
          } catch {
            const stillHasToken = Boolean(get().accessToken);
            set({
              isLoading: false,
              hydrationStatus: stillHasToken ? "error" : "idle",
            });
          }
        })();

        try {
          await hydratePromise;
        } finally {
          hydratePromise = null;
        }
      },

      fetchMe: () => get().hydrateAuthSession(),

      logout: async () => {
        const refresh = get().refreshToken;
        void logoutFromServer(refresh ?? "");

        try {
          useAuthStore.persist.clearStorage();
        } catch {
          /* ignore */
        }
        localStorage.removeItem(LEGACY_ACCESS);
        localStorage.removeItem(LEGACY_REFRESH);

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          hydrationStatus: "idle",
        });

        if (typeof window !== "undefined") {
          window.location.replace("/");
        }
      },
    }),
    {
      name: "skelarmor-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

registerAuthTokenGetter(() => useAuthStore.getState().accessToken ?? null);
registerTenantContextGetter(() => {
  const user = useAuthStore.getState().user;
  const orgCandidate =
    user?.organization ??
    user?.organization_id ??
    user?.organizationId ??
    null;
  return {
    organizationId: extractOrganizationId(orgCandidate),
    isSuperAdmin: Boolean(user?.is_super_admin),
  };
});

export const selectUser = (s: AuthState) => s.user;
export const selectIsAuth = (s: AuthState) => Boolean(s.user?.id && s.accessToken);
export const selectRole = (s: AuthState) => s.user?.dashboard_roles ?? null;

/** Legacy migration + session fetch — call once before rendering the app. */
export async function bootstrapAuthFromStorage(): Promise<void> {
  await new Promise<void>((resolve) => {
    const p = useAuthStore.persist;
    if (p.hasHydrated()) resolve();
    else p.onFinishHydration(() => resolve());
  });

  const { accessToken } = useAuthStore.getState();
  if (!accessToken) {
    const legacyA = localStorage.getItem(LEGACY_ACCESS);
    const legacyR = localStorage.getItem(LEGACY_REFRESH);
    if (legacyA) {
      useAuthStore.setState({ accessToken: legacyA, refreshToken: legacyR });
    }
  }

  await useAuthStore.getState().hydrateAuthSession();
}
