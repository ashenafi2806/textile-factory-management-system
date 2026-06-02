# Production Manager Role — Permissions & Implementation Status

> Cross-checked against `backend/src/production/**`, `backend/src/inventory/**`,
> `backend/src/maintenance/**`, `backend/src/notifications/**`,
> `backend/prisma/schema.prisma`, `frontend/middleware.ts`,
> `frontend/components/layout/Navbar.tsx`,
> `frontend/components/dashboards/ProductionManagerDashboard.tsx`,
> `frontend/app/production-manager/page.tsx`,
> `frontend/app/production/page.tsx`, `frontend/app/production/new/page.tsx`,
> and the live `/docs-json` Swagger spec.
>
> Legend: ✅ implemented · ⚠️ partially (frontend or backend gap) · ❌ missing or denied

## Test Credentials

| Role | Email | Password |
|---|---|---|
| `PRODUCTION_MANAGER` | `production.manager@tfms.com` | `manager123` |
| `ADMIN` (fallback) | `admin@tfms.com` | `admin123` |

`PRODUCTION_MANAGER` is the **planning + scheduling** role for the
factory floor. They own the production sub-system: they create and
manage orders, assign them to supervisors, monitor live progress,
approve material requisitions, adjust targets, and consume reports
for planning decisions.

The Production **Supervisor** is the downstream role that drives
individual stages; the **Storekeeper** and **QA Manager** are the
downstream approvers for finished-goods release.

---

## 1. Login with assigned credentials

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `POST /auth/login` (`backend/src/auth/auth.controller.ts`) — no role guard; any verified credentials work. |
| Frontend | `frontend/middleware.ts` — `/login` is public; JWT is set as the `access_token` cookie + `localStorage` key. |
| Seeded user | `backend/prisma/seed.ts:107-119` — `production.manager@tfms.com / manager123` is provisioned with the `PRODUCTION_MANAGER` role, `isVerified=true`, `mustChangePassword=false`. |

---

## 2. View available stock before planning production

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Browse inventory | `GET /inventory/items` | `backend/src/inventory/inventory.controller.ts:91-107` — `@Roles('STOREKEEPER', 'MANAGER', 'PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'MAINTENANCE_MANAGER', 'MAINTENANCE_TECHNICIAN', 'ADMIN')`. |
| Browse on the new-order form | `frontend/app/production/new/page.tsx:46-56` | The order-creation form loads `/inventory` so the manager can pick raw materials for the bill of materials. |
| Manager hub | `frontend/app/production-manager/page.tsx:198-228` ("Available Stock" tab) | Lists every item (name, on-hand, min) so the manager can see at-a-glance what is in stock before drafting a plan. |
| Summary | `GET /inventory/summary` | `backend/src/inventory/inventory.controller.ts:253-262` — counts and totals by category. |
| Consumption | `GET /inventory/consumption?days=30` | `backend/src/inventory/inventory.controller.ts:280-292` — material pulled per category, used by the "Consumption Trends" tab. |
| Transactions | `GET /inventory/transactions` | `backend/src/inventory/inventory.controller.ts:224-232` — full audit history. |

---

## 3. Check machine spare-part availability for maintenance scheduling

**Status: ✅ fully implemented (this PR)**

| Concern | File | Notes |
|---|---|---|
| Endpoint | `GET /inventory/alerts?category=SPARE_PART` | `backend/src/inventory/inventory.controller.ts:165-187` — accepts an optional `category` query parameter. |
| Service | `backend/src/inventory/inventory.service.ts:392-453` | Returns items whose `quantity <= minThreshold`, with `shortage`, `severity` (`critical` if `quantity === 0`), and `suggestedReorderQuantity`. |
| Manager hub tab | `frontend/app/production-manager/page.tsx:230-291` ("Spare Parts for Maintenance" tab) | **Updated this PR** to call `?category=SPARE_PART` so the manager only sees machine spare parts (the previous call returned all categories). The table now also shows **Shortage** and **Suggested reorder** columns derived from `minThreshold`. A "Open full reorder page →" link jumps to `/dashboard/inventory/reorder-alerts` for deep management. |
| Dashboard widget | `frontend/components/dashboards/ProductionManagerDashboard.tsx:75-85, 158-160` | New **Spare-Part Alerts** KPI tile surfaces the count of below-threshold spare parts on the manager home. |
| Tip | `frontend/app/production-manager/page.tsx:288-291` | A footer tip reminds the manager to coordinate restock with the `MAINTENANCE_MANAGER` so maintenance windows line up with parts on hand. |

---

## 4. Review material consumption trends for production planning

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Endpoint | `GET /inventory/consumption?days=30` | `backend/src/inventory/inventory.controller.ts:280-292` — `@Roles('STOREKEEPER', 'MANAGER', 'PRODUCTION_MANAGER', 'ADMIN')`. |
| Manager hub tab | `frontend/app/production-manager/page.tsx:293-311` ("Consumption Trends" tab) | Renders the JSON response (category summary, daily rate, last-30-days trend) so the manager can spot rising consumption before planning the next batch. |

---

## 5. Approve emergency material requisitions for production lines

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| List requisitions | `GET /inventory/requisitions` | `backend/src/inventory/inventory.controller.ts:327-338` — manager sees the full list; supervisor sees their own only. |
| Approve | `PATCH /inventory/requisitions/:id/approve` | `backend/src/inventory/inventory.controller.ts:343-355` — `@Roles('MANAGER', 'ADMIN', 'PRODUCTION_MANAGER')`. Stock is decremented atomically and a `TransactionType.ISSUE` row is written. |
| Reject | `PATCH /inventory/requisitions/:id/reject` | Same role list. Reason is captured. |
| Manager hub tab | `frontend/app/production-manager/page.tsx:313-375` ("Approve Emergency Requisitions" tab) | Lists every requisition, with Approve / Reject buttons gated by `useCanPerform` (manager / production manager / admin). |
| Notification on the supervisor | `backend/src/inventory/requisition.service.ts:145-186` (this PR) | Sends `REQUISITION_APPROVED` / `REQUISITION_REJECTED` notifications to the requester. |
| Dashboard widget | `frontend/components/dashboards/ProductionManagerDashboard.tsx:160-165` | New **Pending Requisitions** KPI tile surfaces how many requisitions are waiting for action. |

---

## 6. Create and manage production plans and schedules

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Create order | `POST /production` | `backend/src/production/production.controller.ts:60-67` — `@Roles('PRODUCTION_MANAGER', 'ADMIN')`. Accepts `productName`, `productCode`, `targetQuantity`, `deadline`, optional `assignedSupervisorId`, and an optional list of BOM items. |
| Order creation form | `frontend/app/production/new/page.tsx` | Full form with product fields, deadline picker, optional supervisor assignment, and a dynamic bill-of-materials editor sourced from the live inventory list. |
| Update order | `PATCH /production/:id` | `backend/src/production/production.controller.ts:107-111` — manager can edit product name, product code, target quantity, deadline, supervisor, or status (status change is gated by `ensureCanChangeStatus`). |
| Cancel order | `DELETE /production/:id` | `backend/src/production/production.controller.ts:126-130` — manager-only cancellation. |
| Service | `backend/src/production/production.service.ts:155-301, 352-376` | `createOrder` creates four default stages (CUTTING, SEWING, FINISHING, PACKING), reserves BOM stock, and emits a `TransactionType.ISSUE` row per material with `ReferenceType.PRODUCTION_ORDER`. |
| Approve order | `POST /production/:id/approve` | `backend/src/production/production.controller.ts:116-121` + `production.service.ts:408-430` (`approveOrder`) — verifies material availability, then flips the order from `PLANNED` to `IN_PROGRESS`. The MaterialAvailabilityGuard on the route provides an additional defensive check. |

---

## 7. Assign production orders to respective supervisors

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Endpoint | `POST /production/:id/assign` | `backend/src/production/production.controller.ts:136-143` — `@Roles('PRODUCTION_MANAGER', 'ADMIN')`. Body: `{ supervisorId: string }`. |
| Service | `backend/src/production/production.service.ts:379-385` | `assignSupervisor` simply updates `assignedSupervisorId` on the order. |
| Supervisor filter on the list | `backend/src/production/production.service.ts:304-345` | Once assigned, the supervisor sees the order in their own `GET /production` (the service injects `where: { assignedSupervisorId: user.userId }`). |
| Frontend — order list | `frontend/app/production/page.tsx:110-145, 268-318` | "Assign" button per row opens a modal that loads `/users` and filters to those holding the `PRODUCTION_SUPERVISOR` role. The `submitSupervisorAssignment` handler posts to `/production/:id/assign`. |
| Frontend — new order | `frontend/app/production/new/page.tsx:246-261` | Optional supervisor field on the create form (paste a user id). |

---

## 8. Monitor production progress and output

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Production list | `GET /production` | `backend/src/production/production.controller.ts:71-82` — manager sees all orders (the supervisor filter only applies to users carrying the `PRODUCTION_SUPERVISOR` role). |
| Monitoring summary | `GET /production/monitoring/summary` | `backend/src/production/production.controller.ts:157-161` + `production.service.ts:1150-1198` — per-status counts, per-order `progressPercent`, and `stopped` flag. |
| Output report | `GET /production/reports/output` | `backend/src/production/production.controller.ts:247-249` — date- and order-scoped report. |
| Issue report | `GET /production/reports/issues` | `backend/src/production/production.controller.ts:262-264` — date- and order-scoped issues. |
| Material check | `GET /production/:id/material-check` | `backend/src/production/production.controller.ts:148-153` — for the manager to confirm the BOM is fulfilable before approving. |
| Dashboard | `frontend/components/dashboards/ProductionManagerDashboard.tsx` | Polls `/production`, `/production/monitoring/summary`, and `/production/reports/performance` on mount; shows KPI tiles, "Output by Stage" bars, "Overall Status" pie, "Monitoring Snapshot" progress bars, and a per-order table with status / supervisor / progress / deadline. |
| Stopped-orders panel | `frontend/components/dashboards/ProductionManagerDashboard.tsx:431-470` | Surfaces orders flagged as `stopped` by the monitoring API so the manager can intervene. |

---

## 9. Approve or adjust production targets

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Adjust target | `PATCH /production/:id` (body `{ targetQuantity }`) | `backend/src/production/production.controller.ts:107-111` + `production.service.ts:352-376` — manager-only update. |
| Manager hub tab | `frontend/app/production-manager/page.tsx:377-444` ("Approve / Adjust Targets" tab) | Selects an order, pre-fills the current target, posts the new value, and re-loads the open-orders list. |
| Permission gate | `useCanPerform(['PRODUCTION_MANAGER', 'ADMIN'])` on the form | Other roles see a read-only list with a message explaining why. |
| Default target on new orders | `frontend/app/production/new/page.tsx:211-228` | The manager enters the initial target at order creation. |

---

## 10. View production reports and performance analytics

**Status: ✅ fully implemented (this PR)**

| Endpoint | Roles | Notes |
|---|---|---|
| `GET /production/reports/performance` | `PRODUCTION_MANAGER, MANAGER, ADMIN` | `backend/src/production/production.controller.ts:221-228` + `production.service.ts:1099-1148` — returns `totalGood`, `totalDefective`, `defectRate`, and `byStage` aggregates. |
| `GET /production/reports/quality` | `PRODUCTION_MANAGER, QA_MANAGER, ADMIN` (this PR) | Previously `QA_MANAGER, ADMIN` only. The production manager can now pull the QA report directly to track defects per stage. |
| `GET /production/reports/output` | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, MANAGER, ADMIN` | per-shift good vs defective output, date-scoped. |
| `GET /production/reports/issues` | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, QA_MANAGER, ADMIN` | per-stage issues, date-scoped. |
| `GET /inventory/summary` | `PRODUCTION_MANAGER, …` | counts and totals by category. |
| `GET /inventory/valuation` | `PRODUCTION_MANAGER, …` | average unit price × current qty. |
| `GET /inventory/aging` | `PRODUCTION_MANAGER, …` | weighted average age in days. |
| `GET /inventory/consumption?days=N` | `PRODUCTION_MANAGER, …` | issued in last N days + daily rate. |
| `GET /inventory/transactions` | `PRODUCTION_MANAGER, …` | full transaction history with filters. |

Manager hub: `frontend/app/production-manager/page.tsx:447-484` ("Production
Reports" tab) shows the performance report as JSON and links to the QA
dashboard for the full quality report. The production manager dashboard
also surfaces the **Defect Rate** KPI on the home screen.

---

## Sidebar / Navigation map for `PRODUCTION_MANAGER`

**Status: ✅ fully implemented**

| Link | Purpose | Backend gate |
|---|---|---|
| `/dashboard` | Production Manager home (KPI tiles, monitoring snapshot, order table) | open to all authenticated users |
| `/production` | Full production list with **New Order**, **Assign Supervisor**, **Cancel**, and **Inspections** actions | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, MANAGER, ADMIN` |
| `/production/new` | Create a new production order (BOM, target, deadline, supervisor) | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, MANAGER, ADMIN` |
| `/production-manager` | Manager hub (stock, spares, consumption, requisitions, targets, reports) | `PRODUCTION_MANAGER, ADMIN` |
| `/production/:id` | Order detail (stages, output, issues, finished-goods release) | role-agnostic per route guard |
| `/inventory` | Inventory list (read-only context for the manager) | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, MAINTENANCE_MANAGER, ADMIN` |
| `/dashboard/inventory/reorder-alerts` | Reorder-alert dashboard with CSV export | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, MAINTENANCE_MANAGER, QA_MANAGER, ADMIN` |
| `/dashboard/inventory/requisitions` | Material requisitions (read-only context) | `MANAGER, ADMIN, SUPERVISOR, MAINTENANCE_MANAGER, PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR` |

---

## Backend endpoint matrix — Production Manager capabilities

| Capability | Endpoint | File | Roles |
|---|---|---|---|
| Login | `POST /auth/login` | `auth.controller.ts` | any |
| List all orders | `GET /production` | `production.controller.ts:71-82` | `…, PRODUCTION_MANAGER, …` |
| View one order | `GET /production/:id` | `production.controller.ts:88-100` | `…, PRODUCTION_MANAGER, …` |
| Material check | `GET /production/:id/material-check` | `production.controller.ts:148-153` | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, STOREKEEPER, ADMIN` |
| Monitoring summary | `GET /production/monitoring/summary` | `production.controller.ts:157-161` | `PRODUCTION_MANAGER, ADMIN` |
| Create order | `POST /production` | `production.controller.ts:60-67` | `PRODUCTION_MANAGER, ADMIN` |
| Update order | `PATCH /production/:id` | `production.controller.ts:107-111` | `PRODUCTION_MANAGER, ADMIN` |
| Approve order (PLANNED → IN_PROGRESS) | `POST /production/:id/approve` | `production.controller.ts:116-121` | `PRODUCTION_MANAGER, ADMIN` |
| Cancel order | `DELETE /production/:id` | `production.controller.ts:126-130` | `PRODUCTION_MANAGER, ADMIN` |
| Assign supervisor | `POST /production/:id/assign` | `production.controller.ts:136-143` | `PRODUCTION_MANAGER, ADMIN` |
| Output report | `GET /production/reports/output` | `production.controller.ts:247-249` | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, MANAGER, ADMIN` |
| Issue report | `GET /production/reports/issues` | `production.controller.ts:262-264` | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, QA_MANAGER, ADMIN` |
| Performance report | `GET /production/reports/performance` | `production.controller.ts:221-228` | `PRODUCTION_MANAGER, MANAGER, ADMIN` |
| Quality report (added in this PR) | `GET /production/reports/quality` | `production.controller.ts:233-235` | `PRODUCTION_MANAGER, QA_MANAGER, ADMIN` (this PR) |
| Update issue status | `PATCH /production/:id/issues/:issueId` | `production.controller.ts:644-651` | `QA_MANAGER, PRODUCTION_MANAGER, ADMIN` |
| List items | `GET /inventory/items` | `inventory.controller.ts:91-107` | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, …, ADMIN` |
| Spare-part alerts | `GET /inventory/alerts?category=SPARE_PART` | `inventory.controller.ts:165-187` | `…, PRODUCTION_MANAGER, …` |
| Reorder export | `GET /inventory/alerts/export?category=…` | `inventory.controller.ts:189-214` | `…, PRODUCTION_MANAGER, …` |
| Transactions | `GET /inventory/transactions` | `inventory.controller.ts:224-232` | `…, PRODUCTION_MANAGER, …` |
| Summary / Valuation / Aging / Consumption | `GET /inventory/{summary,valuation,aging,consumption}` | `inventory.controller.ts:253-292` | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, ADMIN` |
| List requisitions | `GET /inventory/requisitions` | `inventory.controller.ts:327-338` | `MANAGER, ADMIN, SUPERVISOR, MAINTENANCE_MANAGER, PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR` |
| Approve requisition | `PATCH /inventory/requisitions/:id/approve` | `inventory.controller.ts:343-355` | `MANAGER, ADMIN, PRODUCTION_MANAGER` |
| Reject requisition | `PATCH /inventory/requisitions/:id/reject` | `inventory.controller.ts` | same |
| Notifications | `GET /notifications/unread`, `PATCH /notifications/:id/read` | `notifications.controller.ts` | any authenticated |

---

## Files added or modified in this PR

### Backend

- `backend/src/production/production.controller.ts:233-235` — added `PRODUCTION_MANAGER` to the `@Roles` of `GET /production/reports/quality`.

### Frontend

- `frontend/app/production-manager/page.tsx:78` — spares tab now calls `/inventory/alerts?category=SPARE_PART` instead of the unfiltered alerts endpoint.
- `frontend/app/production-manager/page.tsx:230-291` — spares tab UI upgraded to a table that surfaces **Shortage** and **Suggested reorder** columns (derived from `minThreshold × 2 − quantity`) and links to the full reorder dashboard.
- `frontend/app/production-manager/page.tsx:447-484` — reports tab now exposes a **Quality Report** link to the QA dashboard alongside the performance JSON.
- `frontend/components/dashboards/ProductionManagerDashboard.tsx:35-39, 43-99, 158-175` — added `spareAlerts` + `pendingRequisitions` state, switched the loaders to `Promise.allSettled` for resilience, and added three new KPI tiles: **Spare-Part Alerts**, **Pending Requisitions**, and **Defect Rate**.

### Docs

- `PRODUCTION_MANAGER.md` — this file.

---

## How to test

1. `cd backend && npm run start:dev` (wait for "Nest application successfully started").
2. `cd frontend && npm run dev` (port 3000).
3. Log in as `production.manager@tfms.com / manager123`.
4. **Sidebar:** Production, Manager Hub, Inventory (read-only), Reorder
   Alerts are visible.
5. **Spare Parts for Maintenance tab:** open
   `/production-manager` → **Spare Parts for Maintenance**. The page
   now calls `?category=SPARE_PART`; the table shows on-hand, min,
   shortage, and a suggested-reorder quantity for each below-threshold
   spare part. Click **Open full reorder page →** to jump to
   `/dashboard/inventory/reorder-alerts` for the full table + CSV
   export.
6. **Create a new order:** go to `/production` → **New Order**. Fill
   the product fields, set a target and deadline, optionally paste a
   supervisor id, and add BOM lines. Submit; the order appears in the
   list.
7. **Assign a supervisor:** from `/production` click **Assign** on the
   new row, pick a supervisor from the modal, and submit. The list
   now shows the supervisor's username.
8. **Approve the order:** click the order to open the detail page
   (read-only for now) or call `POST /production/:id/approve`. The
   order flips to `IN_PROGRESS` and the supervisor sees it in their
   own `/production` list.
9. **Approve a requisition:** log in as the supervisor, submit a
   material requisition from `/production-supervisor`. Re-login as the
   manager, open `/production-manager` → **Approve Emergency
   Requisitions**, click **Approve**. The requisition becomes
   `APPROVED`, the supervisor receives a `REQUISITION_APPROVED`
   notification, and stock is decremented.
10. **Adjust a target:** open `/production-manager` → **Approve /
    Adjust Targets**, pick the new order, set a new target, submit. The
    new target is persisted.
11. **Cancel an order:** from `/production` click **Cancel** on a
    row. The order status becomes `CANCELLED`.
12. **Performance report:** open `/production-manager` → **Production
    Reports** to see the JSON snapshot of `totalGood`,
    `totalDefective`, `defectRate`, and per-stage aggregates. The
    manager can also call `GET /production/reports/quality` (newly
    added in this PR) to inspect QA defects per stage.
13. **Dashboard KPIs:** the manager home (`/dashboard`) now shows the
    extra tiles **Spare-Part Alerts**, **Pending Requisitions**, and
    **Defect Rate** alongside the existing active-order, completed,
    and issue tiles.

---

## Pre-existing limitations (out of scope for this PR)

- **Manual supervisor id on the new-order form:** the create form
  accepts a free-text user id rather than a dropdown of supervisors.
  A future sprint should add a `/users?role=PRODUCTION_SUPERVISOR`
  autocomplete (the same data the assign modal already fetches).
- **No "Approve and start" one-click action:** the manager has to call
  `POST /production` (create) and `POST /production/:id/approve`
  (start) as two separate steps. Acceptable for the final-year scope.
- **No machine-specific maintenance scheduling:** the spare-part alerts
  are item-level, not machine-level. A future sprint could add a
  `Machine → spare parts` mapping and a "schedule downtime" CTA on
  the alerts.
- **No schedule / Gantt view:** the manager can see per-order
  deadlines and progress, but there is no calendar view of
  overlapping orders. A future sprint could add a Gantt chart on
  the manager hub.
- **The performance report aggregates all output rows;** it does not
  segment by supervisor or shift. A "by supervisor" or "by shift"
  breakdown is a future enhancement.
- **No email digests:** the manager receives in-app notifications
  only. Weekly email digests of pending requisitions, spare-part
  alerts, and stop orders are a future enhancement.
