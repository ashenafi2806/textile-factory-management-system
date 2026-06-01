# Supervisor Role — Permissions & Implementation Status

> Cross-checked against `backend/src/workforce/**` (`@Roles` decorators), `frontend/middleware.ts` route map, `frontend/components/layout/Navbar.tsx`, and the live `/docs-json` Swagger spec (114 paths, 40 schemas).
>
> Legend: ✅ implemented · ⚠️ partially (frontend present, backend limited) · ❌ missing or denied

## 1. Login with assigned credentials
**Status: ✅ fully implemented (both Supervisor and Admin)**

- Backend: `POST /auth/login` (`backend/src/auth/auth.controller.ts`) has no role guard — any valid credentials work.
- Frontend: `frontend/middleware.ts:5` allows `PUBLIC_PATHS = ["/login", ...]`; `useAuth()` context stores the JWT.
- Swagger tag: `auth` (5 operations).

## 2. Navigate to Workforce Management
**Status: ✅ fully implemented (both Supervisor and Admin)**

| Layer | Evidence |
|---|---|
| Route guard | `frontend/middleware.ts:7` — `/admin/workforce` → `["ADMIN", "HR_ADMIN", "SUPERVISOR"]` |
| Sidebar links | `frontend/components/layout/Navbar.tsx:155,166` — "Workforce" link for `ADMIN` and `SUPERVISOR` |
| Page | `frontend/app/admin/workforce/page.tsx` → `<EmployeeManagementPage />` |
| Dashboard entry | `frontend/components/dashboards/SupervisorDashboard.tsx:67` — quick link "Attendance Log" |

## 3. Record daily worker attendance (shift start and end)
**Status: ⚠️ partially implemented for Supervisor**

| Capability | Supervisor | Admin | Backend endpoint | Frontend |
|---|---|---|---|---|
| View attendance list for a date | ✅ | ✅ | `GET /workforce/attendance` | `AttendanceSupervisor.tsx` |
| Record check-in / check-out | ✅ | ✅ | `POST /workforce/attendance` | "Record" button |
| Edit attendance | ✅ | ✅ | `PUT /workforce/attendance/:id` | "Edit" button |
| Delete attendance | ✅ | ✅ | `DELETE /workforce/attendance/:id` | "Delete" button |
| View team attendance | ✅ | ✅ | `GET /workforce/attendance/team/:teamId` | — |
| **Attendance analytics** | ❌ **denied** | ✅ | `GET /workforce/attendance/analytics` (`MANAGER, HR_ADMIN, ADMIN` only) | ❌ no supervisor view |
| My own attendance | ✅ | ✅ | `GET /workforce/attendance/my-attendance` | — |

**Page:** `frontend/app/supervisor/attendance/page.tsx` → `<AttendanceSupervisor />`

**Gap:** Supervisor can record every record but cannot see aggregated analytics.

## 4. Record incidents, leaves, and disciplinary actions
**Status: ⚠️ mostly implemented, one gap**

### Incidents (acts as "disciplinary actions" — no separate DisciplineAction entity exists)
| Capability | Supervisor | Admin | Backend | Frontend |
|---|---|---|---|---|
| List all incidents | ✅ | ✅ | `GET /workforce/incidents` | `Incidents.tsx` |
| View incident detail | ✅ | ✅ | `GET /workforce/incidents/:id` | `/supervisor/incidents/[id]` |
| Report new incident | ✅ | ✅ | `POST /workforce/incidents` (`SUPERVISOR, ADMIN`) | form in `Incidents.tsx` |
| **Approve incident** | ❌ **denied** | ✅ | `PUT /workforce/incidents/:id/approve` (`MANAGER, HR_ADMIN, ADMIN`) | "Approve" button is hidden for SUPERVISOR in `Incidents.tsx:53-55` and `app/supervisor/incidents/[id]/page.tsx:36-38` |

**Pages:**
- `frontend/app/supervisor/incidents/page.tsx` — list + create form
- `frontend/app/supervisor/incidents/[id]/page.tsx` — detail view (approve hidden for supervisor)
- `frontend/components/workforce/Incidents.tsx` — shared component
- `frontend/hooks/useIncidents.ts` — `useIncidents`, `useCreateIncident`, `useIncident`, `useApproveIncident`

**Gap:** Supervisor can file incidents but cannot close/approve them.

### Leaves
| Capability | Supervisor | Admin | Backend | Frontend |
|---|---|---|---|---|
| Submit own leave request | ✅ | ✅ | `POST /workforce/leave/request` | — |
| List pending leaves | ✅ | ✅ | `GET /workforce/leave/pending` | `/manager/leave-approvals` page |
| Approve / reject leave | ✅ | ✅ | `PUT /workforce/leave/:id/approve` (`MANAGER, ADMIN, SUPERVISOR`) | Approve / Reject buttons |
| View my leave history | ✅ | ✅ | `GET /workforce/leave/my-leaves` | — |
| Leave analytics | ✅ | ✅ | `GET /workforce/leave/analytics` | — |

**Page:** `frontend/app/manager/leave-approvals/page.tsx` (route is gated to `MANAGER, ADMIN, SUPERVISOR, HR_ADMIN`).

### Disciplinary actions (explicit)
- No dedicated `DisciplineAction` entity exists; **incidents** are the de-facto model.
- If a separate "warning / suspension" workflow is required, it is ❌ **not implemented** in the backend.

## 5. Generate shift schedules and manage shift rotations
**Status: ⚠️ partially implemented for Supervisor**

| Capability | Supervisor | Admin | Backend endpoint | Notes |
|---|---|---|---|---|
| List shift definitions | ✅ | ✅ | `GET /workforce/shifts` | — |
| **Create shift definition** | ❌ **denied** | ✅ | `POST /workforce/shifts` (`HR_ADMIN, ADMIN`) | supervisor cannot define new shift types |
| Get worker shift for date | ✅ | ✅ | `GET /workforce/shifts/worker/:id` | — |
| Get worker schedule range | ✅ | ✅ | `GET /workforce/shifts/worker/:id/schedule` | — |
| Get worker upcoming shifts | ✅ | ✅ | `GET /workforce/shifts/worker/:id/upcoming` | — |
| Get team schedule | ✅ | ✅ | `GET /workforce/shifts/team/:teamId/schedule` | — |
| **Get department schedule** | ❌ **denied** | ✅ | `GET /workforce/shifts/department/:department/schedule` (`MANAGER, ADMIN`) | — |
| Get current shift | ✅ | ✅ | `GET /workforce/shifts/worker/:id/current` | — |
| **Assign shift to worker** | ✅ | ✅ | `POST /workforce/shifts/assign` | supervisor can rotate/assign |
| Unassign shift | ✅ | ✅ | `DELETE /workforce/shifts/assign/:id` | — |
| **Update rotation pattern** | ✅ | ✅ | `PUT /workforce/shifts/worker/:id/rotation-pattern` (`SUPERVISOR, HR_ADMIN, ADMIN`) | ✅ |
| My own shifts / schedule | ✅ | ✅ | `/my-current`, `/my-shifts`, `/my-schedule` | — |

**Gap:** No dedicated supervisor shift-management page exists.
- `frontend/app/supervisor/` only contains `attendance/` and `incidents/`.
- Supervisors reach the workforce view through `frontend/app/admin/workforce/page.tsx` (`<EmployeeManagementPage />`); shift rotation/assignment must be triggered from that single employee-management page or from a future dedicated `/supervisor/shifts` page.
- ❌ Missing pages: `/supervisor/shifts`, `/supervisor/shifts/assign`, `/supervisor/rotation`.

---

## Backend implementation audit

Verified against `backend/src/workforce/` controllers and the live `/docs-json` OpenAPI doc.

### Controllers in place (all wired with Swagger)
- `workforce/attendance` — 7 ops
- `workforce/workers` — 6 ops
- `workforce/leave` — 5 ops
- `workforce/shifts` — 15 ops
- `workforce/policies` — 5 ops
- `workforce/hiring` — 5 ops
- `workforce/overtime` — 4 ops
- `workforce/incidents` — 4 ops
- `workforce/staffing` — 3 ops

### What the backend already supports for Supervisor (no extra work)
- All attendance record / update / delete operations.
- All leave operations (request, list pending, approve, analytics).
- All shift read operations except department schedule.
- All incident read + create operations.
- Rotation pattern update (PUT `/workforce/shifts/worker/:id/rotation-pattern`).
- Shift assignment to workers (POST `/workforce/shifts/assign`).

### What the backend does NOT currently allow Supervisor
| Operation | Endpoint | Current roles | Action needed |
|---|---|---|---|
| Attendance analytics | `GET /workforce/attendance/analytics` | `MANAGER, HR_ADMIN, ADMIN` | Add `'SUPERVISOR'` to `@Roles` |
| Approve incident | `PUT /workforce/incidents/:id/approve` | `MANAGER, HR_ADMIN, ADMIN` | Add `'SUPERVISOR'` to `@Roles` |
| Create shift definition | `POST /workforce/shifts` | `HR_ADMIN, ADMIN` | Add `'SUPERVISOR'` to `@Roles` (or keep HR-only) |
| Department schedule | `GET /workforce/shifts/department/:department/schedule` | `MANAGER, ADMIN` | Add `'SUPERVISOR'` to `@Roles` (or keep manager-only) |

### What does NOT exist anywhere in the backend
- ❌ Dedicated `DisciplineAction` entity (warnings, suspensions, written notices).
- ❌ Disciplinary approval / escalation workflow.
- ❌ Audit log for supervisor actions.

---

## What is left to do

### A. Quick wins — backend role-list updates (≈ 4 lines)
1. `backend/src/workforce/attendance/attendance.controller.ts:176` — add `'SUPERVISOR'` to analytics `@Roles`.
2. `backend/src/workforce/incidents/incidents.controller.ts:72` — add `'SUPERVISOR'` to approve `@Roles`.
3. `backend/src/workforce/shifts/shifts.controller.ts:63` — optionally add `'SUPERVISOR'` to create-shift `@Roles`.
4. `backend/src/workforce/shifts/shifts.controller.ts:156` — optionally add `'SUPERVISOR'` to department-schedule `@Roles`.

If the spec truly intends "Supervisor can do everything workforce-related", apply (1)+(2) at minimum.

### B. Frontend pages missing
- `frontend/app/supervisor/shifts/page.tsx` — list shifts + workers, link to assign / rotation.
- `frontend/app/supervisor/shifts/assign/page.tsx` (or modal) — form to call `POST /workforce/shifts/assign`.
- `frontend/app/supervisor/shifts/rotation/[id]/page.tsx` — form to call `PUT /workforce/shifts/worker/:id/rotation-pattern`.
- `frontend/app/supervisor/attendance/analytics/page.tsx` — only if backend grants analytics access.
- `frontend/app/supervisor/incidents/[id]/approve.tsx` (or expose approve in the detail page) — only if backend grants incident approval.

### C. Disciplinary module (optional, per spec)
- If "disciplinary actions" means a separate workflow, design + add:
  - Prisma model `DisciplinaryAction` (worker, type, severity, issuedBy, status, notes, createdAt).
  - `backend/src/workforce/discipline/discipline.controller.ts` + `discipline.service.ts`.
  - `frontend/app/supervisor/discipline/page.tsx` and detail form.
  - Wire into `app.module.ts` and `Swagger`.

### D. Verification
- Re-login as a `SUPERVISOR` account (seed or `admin/users` page) and walk through `/supervisor/attendance`, `/supervisor/incidents`, and any newly added `/supervisor/shifts` to confirm 200s.
- Visit `http://localhost:5000/docs` and confirm the new operations appear under the `workforce/*` tags with bearer-auth.

---

## Quick reference — relevant file paths

**Backend**
- `backend/src/workforce/attendance/attendance.controller.ts:39-214` — attendance
- `backend/src/workforce/incidents/incidents.controller.ts:31-76` — incidents
- `backend/src/workforce/leave/leave.controller.ts:34-105` — leaves
- `backend/src/workforce/shifts/shifts.controller.ts:40-315` — shifts + rotation
- `backend/src/auth/auth.controller.ts` — login

**Frontend**
- `frontend/middleware.ts:6-38` — route-to-role map
- `frontend/components/layout/Navbar.tsx:151-179` — sidebar links by role
- `frontend/components/dashboards/SupervisorDashboard.tsx` — supervisor home
- `frontend/app/supervisor/attendance/page.tsx` — attendance log page
- `frontend/app/supervisor/incidents/page.tsx` — incidents list + form
- `frontend/app/supervisor/incidents/[id]/page.tsx` — incident detail
- `frontend/app/admin/workforce/page.tsx` — generic workforce view (also for SUPERVISOR)
- `frontend/app/manager/leave-approvals/page.tsx` — leave approval queue
- `frontend/components/workforce/Incidents.tsx` — incidents list/form
- `frontend/components/workforce/AttendanceSupervisor.tsx` — attendance grid
- `frontend/hooks/useIncidents.ts` — incident react-query hooks
