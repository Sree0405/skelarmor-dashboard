# Customers module (Directus)

## Data

- **Customers** are Directus `users` with `dashboard_roles = "training_client"`. Listed via `GET /users` with that filter. The admin grid uses **server-side pagination and filtering** (`customerService.getCustomersPaged`); KPI-style consumers still use `getCustomers` + `useCustomers`.
- **Progress** lives in `fitness_progress`; each row has `user` (Directus user id). CRUD goes through `/items/fitness_progress`.

## Auth

All requests send `Authorization: Bearer <token>`. The token is read inside the service layer from `useAuthStore` / `tokenStorage` (same source as the rest of the app).

## Files

| Path | Role |
|------|------|
| `types.ts` | `Customer`, `FitnessProgress`, payloads |
| `services/customerService.ts` | HTTP calls only |
| `hooks/useCustomerQueries.ts` | React Query keys, queries, mutations, `useProgress` mapping to dashboard `ProgressEntry` |
| `CustomersModule.tsx` | Admin list + create dialog; wires URL state, paged query, facet discovery |
| `listing/*` | Production listing: compact filters (status · goal · plan), debounced search, URL sync, skeletons (see below) |
| `CustomerDetail.tsx` | Edit user, delete, add progress, history table |

## Hooks

- `useCustomers(filter)` — full list + client status filter (shared key for KPIs / other modules).
- `useCustomersPaged(request)` — **server-driven** list: `page`, `pageSize`, `q`, `facets`; React Query `placeholderData` for smooth transitions.
- `useCustomerFacetSamples()` — cached sample (`limit=200`) used to **seed option hints** for the fixed facet fields (`analyzeDatasetAttributes`).
- `useCustomer(id)` — single user.
- `useCustomerProgress(userId)` — raw `FitnessProgress[]`.
- `useProgress(userId, months?)` — maps to `ProgressEntry` for charts (used by `ProgressModule` / `ClientProgress`).
- Mutations: `useCreateCustomer`, `useUpdateCustomer`, `useDeleteCustomer`, `useAddProgress`, `useUpdateProgress`.

## UI fields

`directus_users` weight/body-fat fields use **camelCase** (`currentWeight`, `fatPercentage`) — same as `ProfileApi` PATCH. Sync from progress writes those keys. Optional fields (`age`, `goal`, `status`) depend on your schema. `readCustomerWeight` / `readCustomerFatPct` also accept legacy snake_case in JSON if present.

---

## Production listing (`listing/`)

The customers table is built for **large tenants (5000+ rows)** and stays maintainable when Directus fields change.

### Principles

1. **Server authority** — Filtering and pagination are expressed as Directus `filter`, `limit`, `offset`, and `meta[]=filter_count`. The UI never scans full datasets client-side.
2. **Fixed facets** — Only **`status`**, **`goal`**, and **`subscription`** (shown as “Plan”) appear in the toolbar; a sample helps fill option lists, with `asyncOptions` + `getCustomerFieldValueHints` when values are sparse or high-cardinality. Numeric / provider / access fields are not filterable in the UI.
3. **Single dropdown primitive** — `AsyncFilterDropdown` (shadcn Popover + Command + Checkbox) handles search-in-list, optional async option loading, multi/single mode, and reset.
4. **Debounced network** — Search draft debounces **400ms** before committing to the URL `q` param (which drives the paged query). Async filter option queries debounce **350ms** inside the dropdown.
5. **URL as state** — `page`, `ps` (page size), `q`, and `filters` (JSON) live in the query string so lists are **shareable and refresh-safe** (`useCustomerListingUrlState`). Changing filters resets `page` to `1`.
6. **React Query** — Distinct keys for paged lists vs facet samples; `placeholderData` on paged queries; broad invalidation on `customerKeys.all` after mutations so lists and samples stay coherent.
7. **Skeleton UX** — `CustomerListTableSkeleton` / `CustomerFilterBarSkeleton` replace spinner-only loading for table and filter bar.

### File map

| File | Responsibility |
|------|----------------|
| `listing/types.ts` | `CustomerPagedRequest`, `CustomerPagedResult`, shared option types |
| `listing/buildCustomerUserFilter.ts` | Pure builder: role + `_or` search + facet `_and` clauses for Directus |
| `listing/analyzeDatasetAttributes.ts` | Builds the three facet definitions + option hints from a sample |
| `listing/useDebouncedValue.ts` | Generic debounce hook |
| `listing/useCustomerListingUrlState.ts` | URL ↔ listing state |
| `listing/AsyncFilterDropdown.tsx` | Reusable filter dropdown |
| `listing/CustomerListSkeleton.tsx` | Skeletons |
| `listing/CustomerListPagination.tsx` | Page controls + page-size `Select` |
| `listing/CustomerListView.tsx` | Presentational grid + wiring props from `CustomersModule` |

### Directus note

Accurate “total results” requires `meta.filter_count` on `GET /users`. If your API omits `meta`, totals fall back to a heuristic and pagination may be conservative; enable meta in Directus or extend the service with a dedicated count call if needed.
