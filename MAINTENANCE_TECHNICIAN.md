# Maintenance Technician Role — Permissions & Implementation Status

> Cross-checked against `backend/src/maintenance/**`, `backend/prisma/schema.prisma`,
> `frontend/middleware.ts`,
> `frontend/app/(dashboard)/maintenance/my-tasks/page.tsx`,
> `frontend/components/modules/maintenance/CompleteTaskModal.tsx`,
> `frontend/lib/api/maintenance.ts`,
> and the live `/docs-json` Swagger spec.
>
> Legend: ✅ implemented · ⚠️ partially (frontend or backend gap) · ❌ missing or denied

## Test Credentials

| Role | Email | Password |
|---|---|---|
| `MAINTENANCE_TECHNICIAN` | `maintenance.tech@tfms.com` | `mainttech123` |
| `ADMIN` (fallback) | `admin@tfms.com` | `admin123` |

`MAINTENANCE_TECHNICIAN` is the **front-line equipment care** role. They view tasks assigned to them, complete work orders with time and spare part logging, request additional spare parts, and keep equipment running.

---

## 1. View my assigned tasks

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `GET /maintenance/tasks/mine` — `@Roles(MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN)`. Looks up user's `WorkerProfile` and returns all non-completed tasks assigned to them, ordered by priority and scheduled date. |
| Backend error | Returns `404` if user has no `WorkerProfile` (fixed in seed: maintenance users now get a WorkerProfile). |
| Frontend | `frontend/app/(dashboard)/maintenance/my-tasks/page.tsx` — "Technician Workbench" page. Fetches tasks via `maintenanceApi.getMyTasks()`. Sorts by priority (CRITICAL first) then scheduled date. Displays equipment name, type, priority, status badges, description, and scheduled date. Loading skeleton and empty state handled. |
| Seeded worker | `prisma/seed.ts` — `maint_tech` user now has WorkerProfile with `employeeId: 'MNT-TECH-001'`, `position: 'Maintenance Technician'`, `department: 'Maintenance'`. |

---

## 2. Complete a task and log work performed

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `PATCH /maintenance/tasks/:id/complete` — `@Roles(MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN)`. Runs in a transaction: validates stock, decrements inventory, creates issue transaction, records `MaintenanceSparePart` entries, sets status to `COMPLETED` with `completedAt`, `timeSpentMins`, and `notes`. |
| Frontend | `CompleteTaskModal` — form with: time spent (minutes with human-readable label), spare parts (dynamic array with search + select from inventory + quantity, over-stock warning), notes textarea. Submit calls `maintenanceApi.completeTask()`. Invalidates both `maintenance-*` and `inventory-*` query caches on success. |
| API client | `maintenanceApi.completeTask(taskId, { timeSpentMins, spareParts?, notes? })` |

---

## 3. Request spare parts for a task

**Status: ⚠️ partially implemented (backend + API exist, no frontend button)**

| Layer | Evidence |
|---|---|
| Backend | `POST /maintenance/tasks/:id/spare-parts-request` — `@Roles(MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN)`. Creates an `InventoryRequisition` with `referenceId` pointing to the maintenance task. Returns availability info (`shortBy`, `canFulfill`). |
| API client | `maintenanceApi.requestSpareParts(taskId, { itemId, quantityRequested, purpose? })` — defined in `frontend/lib/api/maintenance.ts:224-232` |
| Frontend UI | ❌ No button on the technician workbench page to trigger spare parts request. The `CompleteTaskModal` lets technicians select parts they *used*, but there is no UI for requesting parts they *need* before starting work. |

---

## 4. View spare parts inventory availability

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `GET /inventory/items?category=SPARE_PART` — reusable via existing inventory endpoints. |
| Frontend | `CompleteTaskModal.tsx:37-44` — `fetchSpareParts()` queries `inventoryApi.getItems({ category: 'SPARE_PART' })`. Search filters by SKU, name, or unit. Each option shows `[SKU] Name — Qty unit available`. Over-stock warning displayed when `quantity > item.quantity`. |

---

## 5. Report worn-out or faulty spare parts

**Status: ❌ not implemented**

| Layer | Evidence |
|---|---|
| Backend | No dedicated endpoint for worn-out parts reporting. The `POST /maintenance/failures` endpoint only reports equipment failures (not spare part issues). The `requestSpareParts` flow can be used to flag shortages but not worn-out/faulty parts. |
| Frontend | No dedicated UI. |

---

## 6. View personal consumption history

**Status: ❌ not implemented**

| Layer | Evidence |
|---|---|
| Backend | The `MaintenanceConsumption` model was added to the schema but no endpoint exposes per-user consumption history. |
| Frontend | No dedicated UI on the technician workbench. |

---

## 7. Cancel a task

**Status: ⚠️ partially implemented (backend exists, no frontend button)**

| Layer | Evidence |
|---|---|
| Backend | `PATCH /maintenance/tasks/:id/cancel` — `@Roles(MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN)`. Validates task is not already completed, then sets status to `CANCELLED`. |
| API client | `maintenanceApi.cancelTask(taskId)` — defined in `frontend/lib/api/maintenance.ts` |
| Frontend UI | ❌ No cancel button on the technician workbench page. |

---

## Sidebar / Navigation map for `MAINTENANCE_TECHNICIAN`

**Status: ✅ fully implemented**

| Link | Purpose | Backend gate |
|---|---|---|
| `/maintenance/my-tasks` | Technician workbench — view and complete assigned tasks | open to all authenticated users, gated by role check on page |

---

## Backend endpoint matrix — Maintenance Technician capabilities

| Capability | Endpoint | File | Roles |
|---|---|---|---|
| Login | `POST /auth/login` | `auth.controller.ts` | any |
| My tasks | `GET /maintenance/tasks/mine` | `maintenance.controller.ts:151-159` | `MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN` |
| Complete task | `PATCH /maintenance/tasks/:id/complete` | `maintenance.controller.ts:71-83` | `MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN` |
| Cancel task | `PATCH /maintenance/tasks/:id/cancel` | `maintenance.controller.ts` | `MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN` |
| Request spare parts | `POST /maintenance/tasks/:id/spare-parts-request` | `maintenance.controller.ts:112-133` | `MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN` |
| View task detail | `GET /maintenance/tasks/:id` | `maintenance.controller.ts:164-172` | `MAINTENANCE_TECHNICIAN, MAINTENANCE_MANAGER, ADMIN` |
| List spare parts | `GET /inventory/items?category=SPARE_PART` | `inventory.controller.ts` | various (inventory read) |

---

## How to test

1. `cd backend && npm run start:dev` (wait for "Nest application successfully started").
2. `cd frontend && npm run dev` (port 3000).
3. Log in as `maintenance.tech@tfms.com / mainttech123`.
4. **My Tasks:** navigate to `/maintenance/my-tasks`. See your assigned tasks sorted by priority.
5. **Complete a task:** click "Complete Task" on any task. Fill in time spent, add spare parts (search + select from inventory), add notes. Submit. Verify the task is no longer shown.
6. **Check inventory:** open the Complete Task modal and see spare parts stock levels in the dropdown.
7. **Assign more tasks (as manager):** log out and log in as `maintenance.manager@tfms.com / maintenance123`, navigate to `/maintenance`, create a task, and assign it to `maint_tech`.
