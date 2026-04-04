# SkelArmor Dashboard — Functional Documentation

Behavior of the system by role and module.

---

## 1. Roles

| Role | Home | What they do |
|------|------|----------------|
| **Admin** | `/dashboard/admin` | Operate the business: training clients, franchise gym clients, projects, payments, leads (if allowed), org intelligence |
| **Franchise client** (`Franchise_setup_client`) | `/dashboard/franchise` | See projects and payments relevant to them |
| **Training client** (`training_client`) | `/dashboard/training` | Personal overview, progress, training payments, profile |

**Super admin** (`is_super_admin`): extra admin abilities (e.g. manage all **organizations**). Not a separate dashboard tree.

**Organization**: Users belong to one tenant. **Inactive** organization blocks login for its members (message on login page). **max_users** caps how many users can be created for that org.

---

## 2. Training client management (admin)

**Purpose:** Manage personal-training clients (`training_client` users).

**What it does:**

- List/filter clients by status
- Open customer detail: profile, subscription, payments, progress history
- Create, edit, delete clients (within org and user limits)
- Add progress entries (date, weight, body fat); sync latest metrics to profile where implemented

**Flows:**

- **Create user** — Admin submits form → new user with training role and organization.
- **Edit user** — Update profile fields or status on detail screen.
- **Delete user** — Remove client (confirm in UI where present).
- **Add payment** — Record amount, type (paid/pending), date against the client.
- **Track progress** — Add dated log rows; list/charts reflect history.

---

## 3. Gym client (franchise) management (admin)

**Purpose:** Manage franchise / gym operator accounts (separate role from training clients).

**What it does:**

- List gym clients
- Detail: linked projects, payment-related views as implemented
- Create, update, delete gym clients (subject to org rules)

**Flows:** Same pattern as training clients but for franchise role and project-centric context.

---

## 4. Payment management

**Contexts:**

1. **Training payments** — Tied to training clients; types paid vs pending.
2. **Project payments** — Tied to gym setup projects (`payment_context` + `project`).

**Admin:** Add/edit payments from customer or project screens; see summaries on dashboards/modules.

**Franchise client:** View payments aligned with their projects.

**Training client:** Own payments under training dashboard.

**Flows:**

- **Add payment** — Choose client or project context, amount, type, optional date/notes.

---

## 5. Project management (admin — gym setup)

**Purpose:** Manage fit-out / gym projects (budget, timeline, status, linked franchise client).

**What it does:**

- List projects; create and open project detail
- Edit project fields; view financial summary
- Add project-scoped payments; rollups update per app logic

**Flows:**

- **Add project** — Define client, budget, dates, location, etc.
- **Edit project** — Update status or metadata.
- **Add payment** — Record project payment; affects paid/pending display.

---

## 6. Lead management (admin, conditional)

**Purpose:** Handle inbound enquiries from the contact form.

**Visibility:** Only if organization is a **main** org (feature) or user is super admin. Route gate prevents unauthorized access.

**Flows:**

- Browse leads → open detail → review contact info and message.

---

## 7. Progress tracking

**Admin:** Global progress module + per-customer history on detail views.

**Training client:** “My progress” — own metrics over time.

**Flow — track progress:** Enter date, weight, body fat (and any other fields exposed); entries drive charts and intelligence signals where implemented.

---

## 8. Dashboard home (admin)

**Purpose:** High-level **client intelligence** (activity, risk, renewals, top performer, revenue pulse) plus KPI-style cards for projects/customers as implemented.

---

## 9. Organizations (super admin)

**Purpose:** Create/manage tenants: name, main flag, **active/inactive** status, **max_users**.

**Effect:** Inactive org blocks member login; max users blocks new user creation for that org.

---

## 10. Profile (all roles)

View/edit own profile; password change where supported.

---

## 11. Security and routing behavior

- Unauthenticated users are sent to login.
- Authenticated users with wrong role for a section are redirected to their role home.
- Leads and Organizations use extra gates beyond base `AdminRoute`.

---

*End of FUNCTIONAL.md*
