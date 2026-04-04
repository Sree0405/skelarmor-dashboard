# Customers module (Directus)

## Data

- **Customers** are Directus `users` with `dashboard_roles = "training_client"`. Listed via `GET /users` with that filter (see `customerService.getCustomers`).
- **Progress** lives in `fitness_progress`; each row has `user` (Directus user id). CRUD goes through `/items/fitness_progress`.

## Auth

All requests send `Authorization: Bearer <token>`. The token is read inside the service layer from `useAuthStore` / `tokenStorage` (same source as the rest of the app).

## Files

| Path | Role |
|------|------|
| `types.ts` | `Customer`, `FitnessProgress`, payloads |
| `services/customerService.ts` | HTTP calls only |
| `hooks/useCustomerQueries.ts` | React Query keys, queries, mutations, `useProgress` mapping to dashboard `ProgressEntry` |
| `CustomersModule.tsx` | Admin list + create dialog |
| `CustomerDetail.tsx` | Edit user, delete, add progress, history table |

## Hooks

- `useCustomers(filter)` — list query + status filter (uses shared query key with KPIs).
- `useCustomer(id)` — single user.
- `useCustomerProgress(userId)` — raw `FitnessProgress[]`.
- `useProgress(userId, months?)` — maps to `ProgressEntry` for charts (used by `ProgressModule` / `ClientProgress`).
- Mutations: `useCreateCustomer`, `useUpdateCustomer`, `useDeleteCustomer`, `useAddProgress`, `useUpdateProgress`.

## UI fields

`directus_users` weight/body-fat fields use **camelCase** (`currentWeight`, `fatPercentage`) — same as `ProfileApi` PATCH. Sync from progress writes those keys. Optional fields (`age`, `goal`, `status`) depend on your schema. `readCustomerWeight` / `readCustomerFatPct` also accept legacy snake_case in JSON if present.
