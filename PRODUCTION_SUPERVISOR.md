# Production Supervisor Role — Permissions & Implementation Status

> Cross-checked against `backend/src/production/**`, `backend/src/inventory/**`,
> `backend/src/maintenance/**`, `backend/src/notifications/**`,
> `backend/prisma/schema.prisma`, `frontend/middleware.ts`,
> `frontend/components/layout/Navbar.tsx`,
> `frontend/components/dashboards/ProductionSupervisorDashboard.tsx`,
> `frontend/app/production-supervisor/page.tsx`,
> `frontend/app/production/[id]/page.tsx`, and the live `/docs-json` Swagger spec.
>
> Legend: ✅ implemented · ⚠️ partially (frontend or backend gap) · ❌ missing or denied

## Test Credentials

| Role | Email | Password |
|---|---|---|
| `PRODUCTION_SUPERVISOR` | `production.supervisor@tfms.com` | `supervisor123` |
| `ADMIN` (fallback) | `admin@tfms.com` | `admin123` |

`PRODUCTION_SUPERVISOR` is the **floor owner** of an assigned production
line. They request materials and spare parts, drive stages through
start/stop/complete, record shift output, file machine failures, monitor
critical spare-part stock, and submit release requests once every stage
has passed QA.

The Production **Manager** is the upstream role that creates orders and
assigns supervisors; the Production **Storekeeper** and **QA Manager** are
downstream approvers.

---

## 1. Login with assigned credentials

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `POST /auth/login` (`backend/src/auth/auth.controller.ts`) — no role guard; any verified credentials work. |
| Frontend | `frontend/middleware.ts` — `/login` is public; JWT is set as the `access_token` cookie + `localStorage` key. |
| Seeded user | `backend/prisma/seed.ts:121-136` — `production.supervisor@tfms.com / supervisor123` is provisioned with the `PRODUCTION_SUPERVISOR` role, `isVerified=true`, `mustChangePassword=false`. |

---

## 2. View production orders assigned to them

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Endpoint | `GET /production` | `backend/src/production/production.controller.ts:71-82` — `@Roles('PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'QA_MANAGER', 'QA_STAFF', 'STOREKEEPER', 'ADMIN', 'MANAGER')`. |
| Filter | `backend/src/production/production.service.ts:304-345` | `listOrders` injects `where: { assignedSupervisorId: user.userId }` for any user carrying the `PRODUCTION_SUPERVISOR` role, so the supervisor only ever sees their own orders. |
| Sort | `backend/src/production/production.service.ts:332-343` | Active orders (any status except `COMPLETED`) at the top by `createdAt desc`; completed orders at the bottom by `updatedAt asc`. |
| Frontend list | `frontend/app/production/page.tsx` | Renders the supervisor's orders with quick links to stages, output, issues, and the detail page. |
| Frontend hub | `frontend/app/production-supervisor/page.tsx:386-465` ("Release Requests" tab) | Lists all of the supervisor's orders with their `releaseRequestStatus` and a "Ready to Request" pill. |
| Frontend dashboard | `frontend/components/dashboards/ProductionSupervisorDashboard.tsx` | Auto-polls `/production` every 5 s and shows **Active Orders**, **Ready for Release**, **Pending Release**, and **Remaining Good** KPIs. |

---

## 3. Request materials for production orders through the system

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Submit requisition | `POST /inventory/requisitions` | `backend/src/inventory/inventory.controller.ts` — supervisor is included in the role list. |
| Auto-availability check | `backend/src/inventory/requisition.service.ts:26-67` | Returns `availability.shortBy` and `canFulfill` on every response. |
| Approval | `PATCH /inventory/requisitions/:id/approve` | Performed by `MANAGER` / `PRODUCTION_MANAGER` / `ADMIN`. Stock is decremented atomically and a `TransactionType.ISSUE` row is written. |
| Frontend form | `frontend/app/production-supervisor/page.tsx:226-276` ("Request Materials" tab) | Item dropdown is pre-populated with on-hand stock; supervisors can attach a `purpose` like "For order #1234". |
| Frontend tracker | `frontend/app/production-supervisor/page.tsx:278-321` ("My Requisitions" tab) | Shows status badges for every requisition the supervisor has raised. |

---

## 4. Request spare parts for machine maintenance and repairs

**Status: ✅ fully implemented**

Two entry points exist; both go through the requisition service:

1. **Report a machine failure (creates the maintenance task):**
   `POST /maintenance/failures`
   (`backend/src/maintenance/maintenance.controller.ts:85-96`) — `@Roles('PRODUCTION_SUPERVISOR', 'MAINTENANCE_MANAGER', 'ADMIN')`.
2. **Attach a spare-parts request to an existing task:**
   `POST /maintenance/tasks/:id/spare-parts-request`
   (`backend/src/maintenance/maintenance.controller.ts:112-133`) — `@Roles('MAINTENANCE_MANAGER', 'MAINTENANCE_TECHNICIAN', 'ADMIN')`.

   The supervisor reports the failure in step 1; the maintenance manager
   then either pre-approves a requisition on the supervisor's behalf or
   the manager creates the task themselves. The supervisor sees the
   status via notifications and via the requisitions tab.

Frontend: `frontend/app/production-supervisor/page.tsx:323-398` ("Spare
Parts" tab) — supervisors fill the failure form (equipment, description,
priority) and submit it. The Maintenance Tips card explains the
priorities and the spare-part approval loop.

---

## 5. Receive notifications when materials are issued or unavailable

**Status: ✅ fully implemented (this PR)**

Three notification hooks were added so the supervisor is no longer blind
to material flow:

| Trigger | Service | Notification type |
|---|---|---|
| Material is unavailable at requisition time (`available < requested`) | `backend/src/inventory/requisition.service.ts:50-62` | `MATERIAL_SHORTAGE` (urgent) — sent to the **requester** (the supervisor). |
| Requisition is approved and stock is decremented | `backend/src/inventory/requisition.service.ts:145-156` | `REQUISITION_APPROVED` — sent to the **requester**. |
| Requisition is rejected | `backend/src/inventory/requisition.service.ts:174-186` | `REQUISITION_REJECTED` (urgent) — sent to the **requester** with the rejection reason. |
| Stock is issued against a requisition or production order | `backend/src/inventory/inventory.service.ts:355-414` (`notifyIssuanceRecipient`) | `MATERIAL_ISSUED` — sent to the requisition requester, the production order's supervisor + manager, and the maintenance task reporter. |

Frontend: `frontend/app/production-supervisor/page.tsx:493-531`
("Notifications" tab) — unread count badge on the tab, list of recent
notifications with one-click "Mark read" (`PATCH /notifications/:id/read`).

---

## 6. Submit requests for finished products to be transferred to inventory

**Status: ✅ fully implemented (this PR)**

The release path was previously `QA_MANAGER / STOREKEEPER / ADMIN →
POST /production/:id/release`, which moved stock immediately. The
supervisor could not request release on their own; that responsibility
now lives in a dedicated request step.

### New schema

`backend/prisma/schema.prisma:341-348` adds the enum
`ProductionReleaseRequestStatus { NONE | PENDING | APPROVED | REJECTED }`,
and `ProductionOrder` (lines 396-415) gains:

- `releaseRequestStatus` (default `NONE`)
- `releaseRequestedById` + `releaseRequestedAt`
- `releaseApprovedById` + `releaseApprovedAt`
- `releaseRejectionReason`
- Two new `User` relations: `releaseRequestsRaised`,
  `releaseRequestsApproved`.

Migration: `backend/prisma/migrations/20260601050000_add_release_request_fields/`.

### New endpoints

| Endpoint | Roles | Service |
|---|---|---|
| `POST /production/:id/request-release` | `PRODUCTION_SUPERVISOR, ADMIN` (supervisor must be the assigned supervisor) | `backend/src/production/production.service.ts:1201-1280` |
| `POST /production/:id/reject-release` | `QA_MANAGER, STOREKEEPER, ADMIN` (requires a non-empty `reason`) | `backend/src/production/production.service.ts:1282-1339` |
| `POST /production/:id/release` | `QA_MANAGER, STOREKEEPER, ADMIN` (now requires `releaseRequestStatus === 'PENDING'`) | `backend/src/production/production.service.ts:1341-1416` |

### Request flow

1. All stages of the order reach `QA_APPROVED`.
2. The **assigned supervisor** opens the order detail page and clicks
   **"Request Release to Inventory"**
   (`frontend/app/production/[id]/page.tsx:118-150`). The button is
   rendered only when:
   - the order is not `COMPLETED`,
   - every stage is `QA_APPROVED`,
   - `releaseRequestStatus === 'NONE'`, and
   - the current user is the assigned supervisor (or ADMIN).
3. The backend sets `releaseRequestStatus = PENDING`, records the
   requester, and notifies `QA_MANAGER / STOREKEEPER / ADMIN` via
   `RELEASE_REQUEST` notifications.
4. The approver can either:
   - call `POST /production/:id/release` (stock is moved to finished
     goods, order becomes `COMPLETED`, `releaseRequestStatus = APPROVED`,
     and the supervisor + manager are notified via
     `PRODUCTION_RELEASED`), or
   - call `POST /production/:id/reject-release` with a `reason` (the
     supervisor receives a `RELEASE_REJECTED` urgent notification with
     the reason). The supervisor can resubmit by clicking the request
     button again after fixing the issue.

### Tracking on the order detail page

`frontend/app/production/[id]/page.tsx:153-220` now renders a
**Finished-Goods Release** card showing:

- Current `releaseRequestStatus` (colour-coded badge),
- `releaseRequestedBy` + timestamp,
- `releaseApprovedBy` + timestamp (once approved),
- `releaseRejectionReason` (if previously rejected),

…and the per-stage table now also shows the assigned worker, `startedAt`,
and `completedAt` so the supervisor can audit who worked on which stage
and when (the **Track task execution by workers and machine** feature).

### Supervisor hub tracking

`frontend/app/production-supervisor/page.tsx:386-465` ("Release Requests"
tab) shows every order the supervisor owns with a status pill
(`NONE` / `PENDING` / `APPROVED` / `REJECTED`) and a "Ready to Request"
highlight when the order is QA-approved but not yet released. KPI tiles
at the top of the dashboard
(`frontend/components/dashboards/ProductionSupervisorDashboard.tsx:74-89`)
summarise **Ready for Release** and **Pending Release** counts.

---

## 7. Monitor critical spare-part availability for production continuity

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Endpoint | `GET /inventory/alerts?category=...` | `backend/src/inventory/inventory.controller.ts:165-187` — accepts an optional `category` query parameter (`SPARE_PART`, `RAW_MATERIAL`, `ACCESSORY`, `FINISHED_GOOD`). |
| Service | `backend/src/inventory/inventory.service.ts:392-453` | Returns items where `quantity <= minThreshold`, with `shortage`, `severity` (`critical` if `quantity === 0`), and `suggestedReorderQuantity`. |
| Frontend page | `frontend/app/production-supervisor/page.tsx:400-444` ("Critical Spares" tab) | Surfaces the table to the supervisor; calls the alerts endpoint with `?category=` so the supervisor only sees spare parts. The supervisor hub does not (yet) include the `RAW_MATERIAL` filter — that lives in the production-manager hub. |
| Role gate | `GET /inventory/alerts` includes `PRODUCTION_SUPERVISOR` | `backend/src/inventory/inventory.controller.ts:165-187` |

---

## 8. Update production status (in progress, completed, stopped)

**Status: ✅ fully implemented**

| Action | Endpoint | Roles | Service |
|---|---|---|---|
| Start a stage | `POST /production/:id/stages/:stageId/start` | `PRODUCTION_SUPERVISOR, ADMIN` | `production.service.ts:startStage` |
| Stop a running stage | `POST /production/:id/stages/:stageId/stop` | `PRODUCTION_SUPERVISOR, ADMIN` | `production.service.ts:stopStage` |
| Resume a paused stage | `POST /production/:id/stages/:stageId/resume` | `PRODUCTION_SUPERVISOR, ADMIN` | `production.service.ts:resumeStage` |
| Submit a stage for QA | `POST /production/:id/stages/:stageId/submit-for-qa` | `PRODUCTION_SUPERVISOR, ADMIN` | `production.service.ts:submitForQa` |
| Complete a stage | `POST /production/:id/stages/:stageId/complete` | `PRODUCTION_SUPERVISOR, ADMIN` | `production.service.ts:completeStage` |
| Report an issue on a stage | `POST /production/:id/issues` | `PRODUCTION_SUPERVISOR, QA_STAFF, QA_MANAGER, PRODUCTION_MANAGER, ADMIN` | `production.service.ts:reportIssue` |

Guards enforce the workflow:

- `AssignedOrderGuard` (`backend/src/production/guards/assigned-order.guard.ts`)
  blocks supervisors from acting on orders they are not assigned to.
- `MaterialAvailabilityGuard` blocks stage starts if the BOM cannot be
  fulfilled.
- `StageSequenceGuard` blocks out-of-order stage transitions.
- `QAApprovalGuard` blocks QA steps until the upstream stage is approved.
- The status machine (`backend/src/production/production.service.ts:104-132`)
  only allows `PLANNED → IN_PROGRESS / CANCELLED`,
  `IN_PROGRESS → COMPLETED / STOPPED / CANCELLED`, and
  `STOPPED → IN_PROGRESS / CANCELLED`.

---

## 9. Ensure production steps follow defined standards

**Status: ✅ fully implemented**

| Capability | Endpoint / mechanism | Roles |
|---|---|---|
| Quality thresholds per stage | `GET /production/qa/thresholds`, `POST /production/qa/thresholds/:stageName` | `QA_MANAGER, ADMIN` (manages); supervisors read implicitly via QA review flow. |
| Stage-sequence guard | `StageSequenceGuard` (`backend/src/production/guards/stage-sequence.guard.ts`) | automatic on every supervisor stage action. |
| QA inspection recording | `POST /production/:id/stages/:stageId/qa-inspection` | `QA_STAFF, QA_MANAGER, ADMIN` (not supervisor, but the supervisor submits the stage for QA first). |
| Auto-issued notifications on QA events | `notifyQaManagers` in `backend/src/production/production.service.ts:81-102` | fires on every stage submission. |

---

## 10. Record production output per shift

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Endpoint | `POST /production/:id/output` | `backend/src/production/production.controller.ts:406-419` — `@Roles('PRODUCTION_SUPERVISOR', 'QA_STAFF', 'QA_MANAGER', 'ADMIN')`. |
| Frontend | `frontend/app/production/[id]/output/` | Per-order output entry form (per-shift good vs defective quantities, notes). |
| Auto-aggregation | `frontend/app/production/[id]/page.tsx:96-127` | The detail page recomputes per-stage `good / defects / netGood / stageInputGood` so the supervisor can see live counts without refreshing. |

---

## 11. Report machine failures to maintenance during production

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Endpoint | `POST /maintenance/failures` | `backend/src/maintenance/maintenance.controller.ts:88-96` — `@Roles('PRODUCTION_SUPERVISOR', 'MAINTENANCE_MANAGER', 'ADMIN')`. |
| Body | `equipmentName`, `description`, `priority` (LOW / MEDIUM / HIGH / CRITICAL) | `backend/src/maintenance/dto/report-failure.dto.ts` |
| Frontend | `frontend/app/production-supervisor/page.tsx:323-398` ("Spare Parts" tab) | The "Report Machine Failure" form is the supervisor's primary entry point. |

---

## 12. Track task execution by workers and machine

**Status: ✅ fully implemented (this PR)**

The order detail page (`frontend/app/production/[id]/page.tsx:185-209`)
now renders per-stage audit rows below the "Completed by" / "QA by" lines:

- **Worker** — `stage.assignedWorker.fullName` (or fallback to the linked
  user's `username`) and position.
- **Started** — `stage.startedAt` formatted as a locale string.
- **Completed** — `stage.completedAt` formatted as a locale string.

These fields are already part of the `ProductionStage` model
(`backend/prisma/schema.prisma:437-471`) and are returned by
`getOrderOrThrow` (`backend/src/production/production.service.ts:134-165`),
so no schema or migration work was needed for the data — only the
frontend display.

The machine reference (`stage.machineId`) is not currently surfaced in
the UI because no machine registry exists yet; supervisors can still
attribute work to the worker who started/completed the stage.

---

## Sidebar / Navigation map for `PRODUCTION_SUPERVISOR`

**Status: ✅ fully implemented**

| Link | Purpose | Backend gate |
|---|---|---|
| `/dashboard` | Supervisor home (KPI tiles, assigned-order cards) | open to all authenticated users |
| `/production` | Full production list (filtered to assigned) | `PRODUCTION_SUPERVISOR, PRODUCTION_MANAGER, …` |
| `/production-supervisor` | Supervisor hub (materials, requisitions, spares, monitor, releases, notifications) | open to `PRODUCTION_SUPERVISOR, ADMIN` |
| `/production/:id` | Order detail (stage breakdown, release request) | `AssignedOrderGuard` for supervisors |
| `/production/:id/stages` | Per-stage start/stop/complete | supervisor only |
| `/production/:id/output` | Shift output entry | supervisor + QA |
| `/production/:id/issues` | Issue list / report | supervisor + QA |
| `/inventory` (read-only) | Browse stock levels & alerts | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, MAINTENANCE_MANAGER, ADMIN` (supervisor can read `/inventory/alerts` directly) |

---

## Backend endpoint matrix — Supervisor capabilities

| Capability | Endpoint | File | Roles |
|---|---|---|---|
| Login | `POST /auth/login` | `auth.controller.ts` | any |
| List my orders | `GET /production` | `production.controller.ts:71-82` | `…, PRODUCTION_SUPERVISOR, …` |
| View one order | `GET /production/:id` | `production.controller.ts:87-99` + `AssignedOrderGuard` | `…, PRODUCTION_SUPERVISOR, …` |
| Material check | `GET /production/:id/material-check` | `production.controller.ts:148-153` | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, STOREKEEPER, ADMIN` |
| Output report | `GET /production/reports/output` | `production.controller.ts:206-213` | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, MANAGER, ADMIN` |
| Issue report | `GET /production/reports/issues` | `production.controller.ts:221-228` | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, QA_MANAGER, ADMIN` |
| Start a stage | `POST /production/:id/stages/:stageId/start` | `production.controller.ts:235-240` | `PRODUCTION_SUPERVISOR, ADMIN` |
| Stop a stage | `POST /production/:id/stages/:stageId/stop` | `production.controller.ts:246-250` | `PRODUCTION_SUPERVISOR, ADMIN` |
| Resume a stage | `POST /production/:id/stages/:stageId/resume` | `production.controller.ts:257-261` | `PRODUCTION_SUPERVISOR, ADMIN` |
| Submit a stage for QA | `POST /production/:id/stages/:stageId/submit-for-qa` | `production.controller.ts:268-280` | `PRODUCTION_SUPERVISOR, ADMIN` |
| Complete a stage | `POST /production/:id/stages/:stageId/complete` | `production.controller.ts:287-298` | `PRODUCTION_SUPERVISOR, ADMIN` |
| Record output | `POST /production/:id/output` | `production.controller.ts:406-419` | `PRODUCTION_SUPERVISOR, QA_STAFF, QA_MANAGER, ADMIN` |
| Output history | `GET /production/:id/output` | `production.controller.ts:424-435` | `…, PRODUCTION_SUPERVISOR, …` |
| Stage output report | `GET /production/:id/output/report` | `production.controller.ts:440-451` | `…, PRODUCTION_SUPERVISOR, …` |
| Report an issue | `POST /production/:id/issues` | `production.controller.ts:457-472` | `PRODUCTION_SUPERVISOR, QA_STAFF, QA_MANAGER, PRODUCTION_MANAGER, ADMIN` |
| List order issues | `GET /production/:id/issues` | `production.controller.ts:477-488` | `…, PRODUCTION_SUPERVISOR, …` |
| **Request release** (this PR) | `POST /production/:id/request-release` | `production.controller.ts:184-199` | `PRODUCTION_SUPERVISOR, ADMIN` |
| Reject release | `POST /production/:id/reject-release` | `production.controller.ts:204-220` | `QA_MANAGER, STOREKEEPER, ADMIN` |
| Approve / release | `POST /production/:id/release` | `production.controller.ts:170-181` | `QA_MANAGER, STOREKEEPER, ADMIN` (now requires pending request) |
| Submit requisition | `POST /inventory/requisitions` | `inventory.controller.ts` | `MANAGER, ADMIN, SUPERVISOR, MAINTENANCE_MANAGER, PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR` |
| View requisitions | `GET /inventory/requisitions` | `inventory.controller.ts` | same (filtered to the requester) |
| Critical alerts | `GET /inventory/alerts?category=SPARE_PART` | `inventory.controller.ts:165-187` | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, MAINTENANCE_MANAGER, ADMIN` |
| Report machine failure | `POST /maintenance/failures` | `maintenance.controller.ts:88-96` | `PRODUCTION_SUPERVISOR, MAINTENANCE_MANAGER, ADMIN` |
| Notifications | `GET /notifications/unread`, `PATCH /notifications/:id/read` | `notifications.controller.ts` | any authenticated |

---

## Files added or modified in this PR

### Backend

- `backend/prisma/schema.prisma:341-348` — added `ProductionReleaseRequestStatus` enum.
- `backend/prisma/schema.prisma:396-415` — added `releaseRequestStatus`, `releaseRequestedById`, `releaseRequestedAt`, `releaseApprovedById`, `releaseApprovedAt`, `releaseRejectionReason` columns on `ProductionOrder`.
- `backend/prisma/schema.prisma:27-29` — added `releaseRequestsRaised` / `releaseRequestsApproved` relations on `User`.
- `backend/prisma/migrations/20260601050000_add_release_request_fields/migration.sql` — manual migration adding the columns, indexes, and foreign keys.
- `backend/src/production/production.service.ts:1201-1339` — new `requestRelease` and `rejectRelease` service methods.
- `backend/src/production/production.service.ts:1311-1320` — `releaseOrder` now requires `releaseRequestStatus === 'PENDING'` and writes the approval fields on success.
- `backend/src/production/production.service.ts:154-158` — `getOrderOrThrow` now includes the new release-request relations.
- `backend/src/production/production.controller.ts:184-220` — new `POST /production/:id/request-release` and `POST /production/:id/reject-release` routes.
- `backend/src/inventory/inventory.module.ts` — imports `NotificationsModule` so `InventoryService` can inject `NotificationsService`.
- `backend/src/inventory/inventory.service.ts:355-414` — new `notifyIssuanceRecipient` helper that notifies the requester when stock is issued against a requisition, production order, or maintenance task.
- `backend/src/inventory/requisition.service.ts:50-62` — notifies the requester when stock is unavailable at submission time.
- `backend/src/inventory/requisition.service.ts:145-156, 174-186` — sends `REQUISITION_APPROVED` / `REQUISITION_REJECTED` notifications after the manager's decision.

### Frontend

- `frontend/app/production/[id]/page.tsx` — new "Finished-Goods Release" card with a request-release button; per-stage worker / started / completed rows.
- `frontend/app/production-supervisor/page.tsx` — added the "Release Requests" tab with KPI counts and per-order status pills; switched the spare-parts tab to use `?category=SPARE_PART` alerts.
- `frontend/components/dashboards/ProductionSupervisorDashboard.tsx` — added **Ready for Release** and **Pending Release** KPI tiles; release-status chip on each order card.

### Docs

- `PRODUCTION_SUPERVISOR.md` — this file.

---

## How to test

1. `cd backend && npx prisma migrate deploy && npm run start:dev` (wait
   for "Nest application successfully started").
2. `cd frontend && npm run dev` (port 3000).
3. Log in as `production.supervisor@tfms.com / supervisor123`.
4. **Sidebar:** "Production Supervisor" hub is visible. The supervisor
   home shows the four KPI tiles (Active Orders, Ready for Release,
   Pending Release, Remaining Good) and the assigned-order list.
5. **Reorder Alerts / Critical Spares:** the Critical Spares tab loads
   `GET /inventory/alerts?category=SPARE_PART` and lists any
   spare-parts at or below their minimum threshold.
6. **Submit a material requisition:** in the **Request Materials** tab
   pick an item, quantity, and purpose; click Submit. The requisition
   appears under **My Requisitions** with `PENDING`.
7. **Get a notification when material is unavailable:** pick an item
   whose on-hand stock is less than the requested quantity; the
   response includes `availability.canFulfill = false` and a
   `MATERIAL_SHORTAGE` notification arrives in the **Notifications**
   tab.
8. **Get a notification on approval:** log in as
   `production.manager@tfms.com / manager123` and approve the
   requisition from `/dashboard/inventory/requisitions`. Re-login as
   the supervisor; a `REQUISITION_APPROVED` notification is visible in
   the **Notifications** tab.
9. **Drive a stage through QA:** go to `/production`, open an order
   assigned to the supervisor, click **Stages** → start a stage → stop
   it → submit for QA. Log in as `qa.manager@tfms.com / qa123`, open
   the same stage, and **Approve**. Repeat until every stage is
   `QA_APPROVED`.
10. **Request release:** back in the supervisor's order detail page,
    the **Finished-Goods Release** card now shows the "Request Release
    to Inventory" button. Click it; the card flips to `PENDING` and
    shows the requester + timestamp.
11. **Approve / reject release:** as `qa.manager@tfms.com` (or
    `storekeeper@tfms.com / storekeeper123` or `admin@tfms.com /
    admin123`), open `/dashboard/inventory/release-queue`. The order
    appears with the request attached; click **Approve for storage**.
    The supervisor's notifications tab now shows a `PRODUCTION_RELEASED`
    entry. As an alternative, call **Reject** with a reason and watch
    the supervisor receive a `RELEASE_REJECTED` notification; the
    card surfaces the rejection reason.
12. **Worker / start / completed audit:** the per-stage rows on the
    order detail page now show the worker (full name + position) and
    the started / completed timestamps, demonstrating the task
    execution tracking.

---

## Pre-existing limitations (out of scope for this PR)

- **No machine registry:** the `ProductionStage.machineId` column exists
  in the schema but is not yet exposed in the UI. A future sprint
  could add a `/machines` page and bind stages to specific machines.
- **Single-approver release:** only one of QA Manager / Storekeeper /
  Admin needs to approve a release. Dual control (e.g. QA + Storekeeper
  sign-off) is a future enhancement.
- **No bulk material request:** supervisors must request items one
  requisition at a time. A "request the full BOM at once" flow is
  planned for the next sprint.
- **Notifications are stored in the `Notification` table only** (no
  email or push). Plugging into an SMTP / push provider is a future
  sprint.
- **Audit of release rejection reason** is captured in the production
  order and the notification, but not in a separate immutable audit
  log table.
