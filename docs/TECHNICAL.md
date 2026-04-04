# SkelArmor Dashboard — Technical Documentation

For developers and AI agents rebuilding web or mobile clients against the same Directus API.

---

## 1. Tech stack

| Layer | Technology |
|--------|------------|
| UI | React 18, TypeScript, Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS, shadcn/ui (Radix), Framer Motion |
| Server state | TanStack React Query v5 |
| Client auth | Zustand + `persist` (localStorage) |
| HTTP | Axios |
| Backend | Directus REST (`API_BASE_URL` from `src/config/env.ts`, `VITE_API_BASE_URL`) |

---

## 2. Source layout

```
src/
  App.tsx                 # Routes, QueryClientProvider
  main.tsx                # Auth bootstrap, React root
  config/env.ts           # API base URL
  lib/
    apiClient.ts          # Bearer + org-scoping interceptor, 401 logout
    authToken.ts          # Token getter from Zustand
    queryClient.ts        # React Query defaults
    tenantContext.ts      # { organizationId, isSuperAdmin } for interceptors
    organizationScope.ts  # withOrganization(), assertBelongsToCurrentOrganization()
    organizationPolicy.ts # inactive org, max_users checks
  features/Login/         # api, store, useAuth, ProtectedRoute, LoginPage
  features/dashboard/
    layouts/              # DashboardLayout, nav, sidebar, navbar, MobileBottomBar
    modules/              # Feature modules (customers, gym-setup, …)
    hooks/                # Cross-cutting (e.g. useOrganization, useAdminClientIntelligence)
    selectors/            # Pure transforms (progress, KPIs)
    types/                # Shared types
  components/ui/          # shadcn primitives
```

---

## 3. Authentication

### 3.1 Login flow (`LoginPage`)

1. `POST /auth/login` via **`authPublicApi`** → `access_token`, `refresh_token`, `dashboard_roles`.
2. `useAuthStore.setToken(access, refresh)` — persists tokens; clears in-memory `user`.
3. `fetchMe()` → `hydrateAuthSession()` → **`GET /users/me`** via **`api`** with explicit `fields` (profile, `organization`, `is_super_admin`, fallbacks).
4. `enforceLoginOrganizationPolicy(user)` — if org is **inactive** and user is not super admin, login fails; session cleared; error shown on login UI.
5. `navigate(getRoleDestination(dashboard_roles))`:
   - `admin` → `/dashboard/admin`
   - `Franchise_setup_client` → `/dashboard/franchise`
   - `training_client` → `/dashboard/training`

### 3.2 Tokens and persistence

- Store: `useAuthStore` (`features/Login/store.ts`), key `skelarmor-auth`: `user`, `accessToken`, `refreshToken`.
- `registerAuthTokenGetter` wires tokens into `api` requests.

### 3.3 Bootstrap

- `bootstrapAuthFromStorage` / `initAuth`: await Zustand rehydration, optional legacy token migration, then `hydrateAuthSession()`.

### 3.4 Logout

- `logout()`: `POST /auth/logout` (best-effort), clear persisted auth, reset store, `window.location.replace("/")`.

### 3.5 401

- `api` response interceptor: on 401 (except login path), import store and call `logout()`.

---

## 4. Roles and routing

`features/Login/utils.ts`:

- Roles: `admin`, `Franchise_setup_client`, `training_client` (exact strings).

`features/Login/components/ProtectedRoute.tsx`:

- `ProtectedRoute`: requires authenticated user; optional `allowedRoles`; wrong role → `Navigate` to that role’s home.
- `AdminRoute` → `["admin"]`
- `FranchiseRoute` → `["Franchise_setup_client"]`
- `TrainingRoute` → `["training_client"]`
- While `hydrationStatus === "loading"`, shows session loader.

### 4.1 In-app gates (admin)

- **Leads**: `LeadsFeatureGate` — org “main” or super admin.
- **Organizations**: `SuperAdminFeatureGate` — `is_super_admin` only.

---

## 5. Multi-tenancy (API client)

`lib/apiClient.ts` request interceptor (scoped URLs):

- Applies to paths under `/items/*` and `/users` except `/users/me` and `/auth/*`.
- Reads **`getTenantContext()`**: `organizationId`, `isSuperAdmin` (from auth store).
- Non–super-admin without `organizationId` → reject before send.
- **GET** on **collection** endpoints only: `/items/{collection}` (no deeper path) or exactly `/users`:
  - Merges `filter[organization][_eq]=orgId`, or ANDs into JSON `filter=` if present.
- **POST** with plain object body: injects `organization: organizationId` if missing.

**`skipOrgScope: true`** on axios config (see `src/types/axios.d.ts`) — super-admin / cross-tenant calls (e.g. `/items/organizations`).

Service helpers: `withOrganization()`, `assertBelongsToCurrentOrganization()` in `organizationScope.ts`.  
Policy: `ensureOrganizationIsActive`, `ensureOrganizationCanAddUser` in `organizationPolicy.ts`.

---

## 6. Directus API surface (as used in app)

Base: `{API_BASE_URL}`.

### 6.1 Auth

| Method | Path |
|--------|------|
| POST | `/auth/login` |
| POST | `/auth/logout` |

### 6.2 Users

| Method | Path | Notes |
|--------|------|--------|
| GET | `/users/me` | Current user; explicit `fields` |
| GET | `/users?filter[dashboard_roles][_eq]=…&fields=*` | Lists (+ org filter from interceptor) |
| GET | `/users/:id?fields=*` | Detail |
| POST | `/users` | Create (body: email, password, roles, `organization`) |
| PATCH | `/users/:id` | Update |
| DELETE | `/users/:id` | Delete |

### 6.3 Items

| Collection | Typical use |
|------------|-------------|
| `fitness_progress` | Progress rows: `user`, `date`, weight, fat % |
| `payments` | Training or project payments; `type` paid/pending; optional `project`, `payment_context` |
| `projects` | Gym setup projects; client, budget, paid/pending, status |
| `contact_form` | Leads |
| `organizations` | Tenant config; super-admin list/create/update |

### 6.4 Filter examples

Bracket params:

```
/items/payments?filter[user][_eq]={uuid}&sort=-date
/items/projects?filter[client][_eq]={uuid}&fields=*,client.*
/users?filter[dashboard_roles][_eq]=training_client&fields=*
```

JSON filter (URL-encoded):

```
/items/fitness_progress?filter={"user":{"_in":["id1","id2"]}}&limit=-1&sort=date
```

Tenant-scoped list (after interceptor for normal admin):

```
/users?filter[dashboard_roles][_eq]=training_client&filter[organization][_eq]={orgId}&fields=*
```

---

## 7. Data fetching and storage

- **Authoritative data**: Directus.
- **React Query**: caches lists/details; defaults in `queryClient.ts` (`staleTime` ~7m, `gcTime` ~30m, `refetchOnWindowFocus: false`, `retry: 1`).
- **Auth**: Zustand persist for user + tokens.
- Domain lists are not duplicated in a separate global store; use React Query cache + selectors.

---

## 8. React Query — keys and mutations

- Each feature exports `*Keys` (e.g. `customerKeys`, `projectKeys`, `gymClientKeys`, `organizationKeys`).
- Queries: `useQuery({ queryKey, queryFn: () => service.method() })`.
- Mutations: `useMutation` + `queryClient.invalidateQueries({ queryKey })` on success.
- Customer progress/payments mutations may invalidate bulk keys (`fitness-bulk`, `payments-bulk`) where defined.

---

## 9. Service layer

Location: `features/dashboard/modules/<module>/services/*.ts`

| Service | Responsibility |
|--------|------------------|
| `customerService` | Training users, `fitness_progress`, user-scoped payments |
| `projectService` (`gymProjectService`) | Projects, project payments, franchise user fetch for forms |
| `gymClientService` | Franchise gym users, their projects/payments |
| `organizationService` | Organizations CRUD helpers, create admin user for org (`skipOrgScope`) |
| `ProfileApi` | Profile PATCH `/users/:id`, password `/users/me` |

Many services use small `apiJson` wrappers around `api.request` and throw domain errors (`CustomerApiError`, etc.).

---

## 10. Hooks layer

- `modules/<feature>/hooks/use*Queries.ts` — React Query + invalidation wired to services.
- `features/dashboard/hooks/` — shared hooks (`useOrganization`, `useAdminClientIntelligence`, …).
- `features/Login/useAuth.ts` — `user`, `role`, `logout`, triggers hydration on mount.

---

## 11. Module ↔ routes (admin)

| Route | Component |
|-------|-----------|
| `/dashboard/admin` | `DashboardHome` |
| `/dashboard/admin/customers` | `CustomersModule` |
| `/dashboard/admin/customers/:id` | `CustomerDetail` |
| `/dashboard/admin/progress` | `ProgressModule` |
| `/dashboard/admin/gym-setup/*` | Gym setup nested routes |
| `/dashboard/admin/gym-clients` | `GymClientsModule` |
| `/dashboard/admin/gym-clients/:id` | `GymClientDetail` |
| `/dashboard/admin/leads` | `LeadsModule` (gated) |
| `/dashboard/admin/organizations` | `OrganizationsModule` (super admin) |
| `/dashboard/admin/payments` | `ClientPayments` |
| `/dashboard/admin/profile` | `ProfilePage` |

Franchise: `/dashboard/franchise/*`. Training: `/dashboard/training/*`.

---

## 12. Layout / nav

- `DashboardLayout`: outlet + `DashboardSidebar`, `DashboardNavbar`, `MobileBottomBar`.
- `navConfig.ts`: `NAV_BY_ROLE`, `PAGE_TITLES`, `getNavItems(role, { isMainOrg, isSuperAdmin })`, `isNavItemActive`, mobile `splitNavForMobileBottomBar`.

---

## 13. Rebuild checklist (mobile / second web app)

1. Implement login + token storage.
2. Call `/users/me` with required fields.
3. Enforce org filters and `organization` on creates (or server RLS).
4. Map three `dashboard_roles` to three base URLs.
5. Port service calls from `customerService`, `projectService`, `gymClientService`, leads hooks, etc.

---

*End of TECHNICAL.md*
