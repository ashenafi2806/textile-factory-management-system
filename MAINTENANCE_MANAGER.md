# Maintenance Manager Role — Permissions & Implementation Status

> Cross-checked against `backend/src/maintenance/**`, `backend/prisma/schema.prisma`,
> `frontend/middleware.ts`,
> `frontend/app/(dashboard)/maintenance/page.tsx`,
> `frontend/components/modules/maintenance/**`,
> `frontend/lib/api/maintenance.ts`,
> and the live `/docs-json` Swagger spec.
>
> Legend: ✅ implemented · ⚠️ partially (frontend or backend gap) · ❌ missing or denied

## Test Credentials

| Role | Email | Password |
|---|---|---|
| `MAINTENANCE_MANAGER` | `maintenance.manager@tfms.com` | `maintenance123` |
| `ADMIN` (fallback) | `admin@tfms.com` | `admin123` |

`MAINTENANCE_MANAGER` is the **maintenance leadership** role. They create and schedule tasks, assign work to technicians, monitor workload and KPIs, review failure reports, generate advanced reliability reports (MTTR, MTBF), plan preventive maintenance, and manage spare parts requisitions.

---

## 1. Login with assigned credentials

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `POST /auth/login` (`backend/src/auth/auth.controller.ts`) — no role guard; any verified credentials work. |
| Frontend | `frontend/middleware.ts` — `/login` is public; JWT is set as the `access_token` cookie + `localStorage` key. |
| Seeded user | `backend/prisma/seed.ts:190-204` — `maintenance.manager@tfms.com / maintenance123` is provisioned with the `MAINTENANCE_MANAGER` role, `isVerified=true`, `mustChangePassword=false`. WorkerProfile created with `employeeId: 'MNT-MGR-001'`. |

---

## 2. Create and schedule maintenance tasks

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend (create) | `POST /maintenance/tasks` — `@Roles(MAINTENANCE_MANAGER, ADMIN)`. Accepts type, priority, equipment name, description, optional scheduled date, optional assigned technician. If assigned, status starts as `IN_PROGRESS`. |
| Backend (preventive) | `POST /maintenance/tasks/preventive` — `@Roles(MAINTENANCE_MANAGER, ADMIN)`. Same as create but enforces `type=PREVENTIVE` and requires `scheduledDate`. |
| Frontend | `CreateTaskModal` — form with: type (PREVENTIVE/CORRECTIVE), priority (NORMAL/CRITICAL), equipment name, description, scheduled date picker, optional technician assignment. Submit calls `maintenanceApi.createTask()` or `maintenanceApi.schedulePreventiveTask()` depending on type. |
| API client | `maintenanceApi.createTask(data)` and `maintenanceApi.schedulePreventiveTask(data)` |

---

## 3. Assign tasks to technicians

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `PATCH /maintenance/tasks/:id/assign` — `@Roles(MAINTENANCE_MANAGER, ADMIN)`. Validates task is not completed, verifies technician `WorkerProfile` exists, sets `assignedToId` and status to `IN_PROGRESS`. |
| Technicians list | `GET /maintenance/technicians` — `@Roles(MAINTENANCE_MANAGER, MAINTENANCE_TECHNICIAN, ADMIN)`. Returns all users with `MAINTENANCE_TECHNICIAN` role who have a `WorkerProfile`, with `id` (WorkerProfile ID), `username`, `email`, `position`. |
| Frontend | `AssignTaskModal` — dialog opens from the manager dashboard task table. Shows task summary (equipment, type, priority, status). Searchable technician dropdown. Fallback to `/hr/workers` endpoint if `/maintenance/technicians` unavailable. Submit calls `maintenanceApi.assignTask()`. |
| API client | `maintenanceApi.assignTask(taskId, { assignedToId })` |

---

## 4. Monitor maintenance workload and KPIs

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `GET /maintenance/analytics` — `@Roles(MAINTENANCE_MANAGER, ADMIN)`. Returns total count, by-status breakdown, by-type, by-priority, avg completion time, total completed, per-technician stats (completed count + avg time), top spare parts consumed, top failing equipment, overdue task count, avg days to complete. |
| Backend (calendar) | `GET /maintenance/planning/calendar` — `@Roles(MAINTENANCE_MANAGER, ADMIN)`. Returns tasks grouped by scheduled date with full task details. |
| Frontend dashboard | `frontend/app/(dashboard)/maintenance/page.tsx` — "Equipment Care Command Center". Displays 4 KPI cards (Open Tasks, In Progress, Critical Issues, Avg Completion Time). MTTR/MTBF/Downtime/Spare Cost metrics with prior-period comparison. Planning calendar grouped by date. Technician performance panel. Top spare parts panel. Equipment failures panel. Full paginated task table with status/type/priority filters and assign/view actions. |

---

## 5. Generate advanced reports (MTTR, MTBF, downtime, spare cost)

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `GET /maintenance/reports/advanced?days=90` — `@Roles(MAINTENANCE_MANAGER, ADMIN)`. Returns current and prior period comparisons of: MTTR (minutes), MTBF (days), total downtime minutes, total spare part cost. Spare cost computed from average unit price of receipt items. |
| Frontend dashboard | Aggregated KPI row on dashboard (4 cards: MTTR, MTBF, Downtime, Spare Cost) with vs prior period % change. Downtime comparison colored based on improvement (green) or regression (red). |
| API client | `maintenanceApi.getAdvancedReports(days)` |

---

## 6. Approve/reject spare parts requests / manage requisitions

**Status: ⚠️ partially implemented (backend handles via inventory requisition system; no dedicated maintenance UI)**

| Layer | Evidence |
|---|---|
| Backend | `POST /maintenance/tasks/:id/spare-parts-request` creates an `InventoryRequisition` linked to the task. Requisition approval/rejection is handled by the inventory module (`PATCH /inventory/requisitions/:id` with `STOREKEEPER` role). |
| Frontend | No dedicated approval UI within the maintenance dashboard. Managers must navigate to inventory requisitions. The `requestSpareParts` API is callable but no button exists on either the manager or technician UI to trigger it. |

---

## 7. Report production failures (corrective maintenance)

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `POST /maintenance/failures` — `@Roles(PRODUCTION_SUPERVISOR, MAINTENANCE_MANAGER, ADMIN)`. Creates a `CORRECTIVE` task + `FailureReport` in a transaction. If linked to a production order, cancels it. Sends notifications to all maintenance users. |
| Frontend | Failure reports displayed on the manager dashboard in a dedicated "Failure Reports" section showing recent equipment failures with reporter info. |

---

## Sidebar / Navigation map for `MAINTENANCE_MANAGER`

**Status: ✅ fully implemented**

| Link | Purpose | Backend gate |
|---|---|---|
| `/maintenance` | Maintenance Dashboard — full operational view | frontend-gated to `MAINTENANCE_MANAGER, ADMIN` |
| `/maintenance/my-tasks` | Also can view own task assignments (if assigned as technician) | frontend-gated to `MAINTENANCE_TECHNICIAN` |

---

## Backend endpoint matrix — Maintenance Manager capabilities

| Capability | Endpoint | Roles |
|---|---|---|
| Login | `POST /auth/login` | any |
| Create task | `POST /maintenance/tasks` | `MAINTENANCE_MANAGER, ADMIN` |
| Schedule preventive | `POST /maintenance/tasks/preventive` | `MAINTENANCE_MANAGER, ADMIN` |
| Assign task | `PATCH /maintenance/tasks/:id/assign` | `MAINTENANCE_MANAGER, ADMIN` |
| Complete task | `PATCH /maintenance/tasks/:id/complete` | `MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN` |
| Cancel task | `PATCH /maintenance/tasks/:id/cancel` | `MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN` |
| Report failure | `POST /maintenance/failures` | `PRODUCTION_SUPERVISOR, MAINTENANCE_MANAGER, ADMIN` |
| Request spare parts | `POST /maintenance/tasks/:id/spare-parts-request` | `MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN` |
| List tasks | `GET /maintenance/tasks` | `MAINTENANCE_MANAGER, ADMIN` |
| My tasks | `GET /maintenance/tasks/mine` | `MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN` |
| View task | `GET /maintenance/tasks/:id` | `MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN` |
| List technicians | `GET /maintenance/technicians` | `MAINTENANCE_MANAGER, MAINTENANCE_TECHNICIAN, ADMIN` |
| Analytics | `GET /maintenance/analytics` | `MAINTENANCE_MANAGER, ADMIN` |
| Advanced reports | `GET /maintenance/reports/advanced` | `MAINTENANCE_MANAGER, ADMIN` |
| Planning calendar | `GET /maintenance/planning/calendar` | `MAINTENANCE_MANAGER, ADMIN` |

---

## How to test

1. `cd backend && npm run start:dev` (wait for "Nest application successfully started").
2. `cd frontend && npm run dev` (port 3000).
3. Log in as `maintenance.manager@tfms.com / maintenance123`.
4. **Dashboard:** navigate to `/maintenance`. See 4 KPI cards, MTTR/MTBF/Downtime/Spare Cost metrics, planning calendar, technician performance, top spare parts, equipment failures, full paginated task table.
5. **Create a task:** click "Schedule Task". Fill out type, priority, equipment name, description, date, and optional technician. Submit.
6. **Assign a task:** find an OPEN task in the table, click "Assign". Select a technician from the searchable dropdown. Submit.
7. **Advanced reports:** the MTTR/MTBF/Downtime/Spare Cost row shows period-over-period comparison automatically based on 90-day window.
8. **View analytics:** the dashboard shows per-technician completed counts, top 10 spare parts by usage, top 10 failing equipment, overdue count, and avg days to complete.
9. **Report a failure:** (as production supervisor) Log out and log in as `production.supervisor@tfms.com / supervisor123`, navigate to production, report a failure. Log back in as maintenance manager — see the failure report on the dashboard.
