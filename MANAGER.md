# Manager Role — Permissions & Implementation Status

> Cross-checked against `backend/src/**` (`@Roles` decorators), `frontend/middleware.ts`, `frontend/components/layout/Navbar.tsx`, and the live `/docs-json` Swagger spec.
>
> Legend: ✅ implemented · ⚠️ partially · ❌ missing or denied

## Test Credentials

| Role | Email | Password |
|---|---|---|
| `MANAGER` (pure) | `manager@tfms.com` | `manager123` |
| `ADMIN` (fallback) | `admin@tfms.com` | `admin123` |
| `HR_ADMIN` (overlap) | (run `npm run seed:workforce` to provision) | seeded |

`MANAGER` is a **view/approver** role, not a **creator/operator** role. It has no production-floor, inventory-write, or HR-write access. It can read state, approve/reject workforce requests, view hiring data, and read production & inventory telemetry.

---

## 1. Sidebar / Navigation

**Status: ✅ implemented**

Sidebar links for `MANAGER` (`frontend/components/layout/Navbar.tsx`):

| Link | Purpose | Backend gate |
|---|---|---|
| `/dashboard/manager` | Manager KPI dashboard | open to all |
| `/manager/leave-approvals` | Manager Console (5 tabs) | MANAGER + ADMIN |
| `/manager/analytics` | Workforce analytics (leave) | MANAGER + ADMIN + HR_ADMIN |
| `/manager/hiring-requests` | Hiring requisitions list | MANAGER + HR_ADMIN + ADMIN |
| `/production` | Production order list (read-only) | MANAGER + PRODUCTION_MANAGER + PRODUCTION_SUPERVISOR + ADMIN |
| `/inventory` | Inventory dashboard (read-only) | MANAGER + STOREKEEPER + PRODUCTION_MANAGER + ADMIN |
| `/workforce/staffing` | Staffing gaps & headcount | MANAGER + HR_ADMIN + ADMIN |
| `/workforce/workers` | Worker directory | MANAGER + HR_ADMIN + ADMIN |

**Gap before this PR:** the sidebar only had 3 manager links. **Fixed.**

---

## 2. Manager Console (`/manager/leave-approvals`)

**Status: ✅ implemented (this PR)**

Single tabbed page replacing multiple role-specific consoles. Five tabs:

| Tab | Data source | Capabilities |
|---|---|---|
| **Overview** | `GET /workforce/leave/analytics`, `GET /workforce/leave`, `GET /workforce/workers` | KPI tiles, pending-decision counts, department headcount snapshot |
| **Leaves** | `GET /workforce/leave` + `PUT /workforce/leave/:id/status` | Approve / Reject leaves (status body) |
| **Overtime** | `GET /workforce/overtime` + `PUT /workforce/overtime/:id/approve` or `/reject` | Approve / Reject overtime |
| **Hiring** | `POST /workforce/hiring`, `GET /workforce/hiring`, `PUT /workforce/hiring/:id/approve` or `/reject` | Submit new requisition, list, approve/reject |
| **Staffing** | `GET /workforce/workers`, `GET /workforce/staffing/gaps` | Headcount + gap-driven recommendations |

Page-level role check: `useCanPerform(["MANAGER", "ADMIN"])` — returns Access Denied panel for any other role.

**Files touched in this PR:**
- `frontend/app/manager/leave-approvals/page.tsx` — rewritten as 5-tab hub
- `frontend/services/workforceService.ts` — added `getLeaveAnalytics`, `getStaffingGaps`, `getStaffingHeadcount`, `createHiringRequest`, `approveOvertime`, `rejectOvertime`; `approveLeave(id, status)` now takes status
- `frontend/hooks/useLeaves.ts` — `useApproveLeave({id, status})` payload
- `backend/src/workforce/hiring/hiring.controller.ts:65,75` — `PUT /:id/approve` & `/:id/reject` now allow `MANAGER`

---

## 3. Workforce approvals (leave, overtime, hiring)

| Capability | MANAGER | HR_ADMIN | ADMIN | Endpoint | File |
|---|---|---|---|---|---|
| Approve/Reject leave | ✅ | ✅ | ✅ | `PUT /workforce/leave/:id/status` | `leaves.controller.ts` |
| Approve/Reject overtime | ✅ | ✅ | ✅ | `PUT /workforce/overtime/:id/approve` | `overtime.controller.ts` |
| Approve/Reject hiring | ✅ | ✅ | ✅ | `PUT /workforce/hiring/:id/approve` | `hiring.controller.ts` (this PR) |
| Create hiring requisition | ✅ | ✅ | ✅ | `POST /workforce/hiring` | `hiring.controller.ts` |
| View staffing gaps | ✅ | ✅ | ✅ | `GET /workforce/staffing/gaps` | `staffing.controller.ts` |

**Gap before this PR:** `PUT /:id/approve|reject` on hiring was restricted to `HR_ADMIN + ADMIN`, but the new Manager Console allowed Manager to click the button → 403. **Fixed.**

---

## 4. Production (read-only)

**Status: ✅ implemented (this PR) — Manager is a viewer**

Manager is now **gated by `useCanPerform`** on every production page. They can:

- ✅ View the production order list at `/production`
- ✅ Click **Inspections** on any order to see per-stage measurements/notes (modal, calls `GET /production/:id/qa/inspections`)
- ✅ View an order's detail, stages, outputs, and issues
- ❌ Create new orders (button hidden — backend would 403)
- ❌ Cancel an order (button hidden — backend would 403)
- ❌ Assign a supervisor (button hidden — backend would 403)
- ❌ Submit outputs / advance stages (page-level `useCanPerform` blocks)
- ❌ Approve QA or release order (the QA manager action)

**Files touched in this PR:**
- `frontend/app/production/page.tsx` — added `canManageOrders` and `canViewInspections` hooks; New Order link hidden when `!canManageOrders`; cancel/assign/inspections callbacks conditionally passed
- `frontend/components/production/ProductionOrderTable.tsx` — accepts `onViewInspections` prop (was added earlier in this work)
- `frontend/middleware.ts:27-36` — `/production` middleware allows `MANAGER` for read-only access (removed from `/production/qa`)

---

## 5. QA / Inspections

**Status: ✅ implemented (this PR)**

Manager can **view** but not **act** on QA inspections:

| Capability | MANAGER | QA_STAFF | QA_MANAGER | ADMIN |
|---|---|---|---|---|
| View inspections modal on order | ✅ (read-only) | ✅ | ✅ | ✅ |
| `/production/qa` page | ❌ **blocked** (this PR) | ✅ | ✅ | ✅ |
| Submit inspection | ❌ | ✅ | ✅ | ✅ |
| Approve / Reject inspection | ❌ | ✅ | ✅ | ✅ |
| Release completed order | ❌ | ❌ | ✅ | ✅ |

**Gap before this PR:** middleware `/production` allowed `MANAGER` through, but `/production/qa` rendered the QA Staff dashboard. **Fixed** with a `useCanPerform(["QA_STAFF", "QA_MANAGER", "ADMIN"])` check.

The Manager Console's **Overview** tab shows pending QA inspection counts. To see measurements/notes, the manager opens the production order and clicks **Inspections**.

---

## 6. Inventory (read-only)

**Status: ✅ implemented (this PR)**

Manager is added to the **view** roles for the inventory module:

| Capability | MANAGER | STOREKEEPER | PRODUCTION_MANAGER | ADMIN |
|---|---|---|---|---|
| `/inventory` dashboard | ✅ | ✅ | ✅ | ✅ |
| View items | ✅ | ✅ | ✅ | ✅ |
| Create/update items | ❌ | ✅ | ❌ | ✅ |
| Submit requisition | ❌ | ✅ | ✅ | ✅ |
| Approve requisition | ❌ | ❌ | ❌ | ✅ |
| View low-stock alerts | ✅ | ✅ | ✅ | ✅ |

**Files touched in this PR:**
- `frontend/app/inventory/dashboard/page.tsx` — added `useCanPerform` for view gate
- `backend/src/inventory/inventory.controller.ts` — `PRODUCTION_SUPERVISOR`/`PRODUCTION_MANAGER` already added to items, transactions, requisitions, alerts

**Caveat:** Manager can read the inventory dashboard, but most mutation buttons (Submit, Approve, etc.) are gated individually by `canCreate`/`canApprove` hooks. Manager is not added to mutation `@Roles` lists — the buttons stay hidden.

---

## 7. Workforce read access

| Capability | MANAGER | HR_ADMIN | ADMIN | Endpoint |
|---|---|---|---|---|
| Worker directory | ✅ | ✅ | ✅ | `GET /workforce/workers` |
| My workers (per supervisor) | ✅ | ✅ | ✅ | `GET /workforce/workers/my-workers` |
| Attendance analytics | ✅ | ✅ | ✅ | `GET /workforce/attendance/analytics` |
| Disciplinary records | ❌ (SUPERVISOR/HR_ADMIN/ADMIN only) | ✅ | ✅ | `GET /workforce/discipline` |

**Files:** `backend/src/workforce/**` — `@Roles` decorators. Manager is consistently grouped with HR_ADMIN/ADMIN for read-only operations.

---

## 8. Pages added in this work

| File | Purpose | Guard |
|---|---|---|
| `frontend/app/manager/leave-approvals/page.tsx` | 5-tab Manager Console | MANAGER + ADMIN |
| `frontend/app/dashboard/manager/page.tsx` | Manager KPI dashboard (existing, now guarded) | MANAGER + ADMIN |
| `frontend/app/manager/analytics/page.tsx` | Workforce analytics (existing, now guarded) | MANAGER + ADMIN + HR_ADMIN |
| `frontend/app/production/qa/page.tsx` | QA Staff dashboard (existing, now blocks Manager) | QA_STAFF + QA_MANAGER + ADMIN |
| `frontend/app/inventory/dashboard/page.tsx` | Inventory dashboard (existing, now guarded) | STOREKEEPER + MANAGER + PRODUCTION_MANAGER + ADMIN |

---

## 9. Pre-existing limitations (out of scope for this PR)

- **No MANAGER analytics tab on `/manager/leave-approvals`** for production/inventory — those exist in the production & inventory modules' own dashboards; manager navigates to them.
- **No MANAGER reports export** — Swagger has no report export endpoint, so manager reads views only.
- **No MANAGER bulk approval** — must approve leaves/overtime/hiring one at a time. Acceptable for the final-year scope.
- **No MANAGER notification preferences** — out of scope; the manager does receive urgent QA notifications via the in-app notification system.

---

## 10. Files modified in this PR

### Backend
- `backend/src/workforce/hiring/hiring.controller.ts:65,75` — added `MANAGER` to `PUT /:id/approve` and `PUT /:id/reject` `@Roles`.

### Frontend
- `frontend/app/manager/leave-approvals/page.tsx` — full rewrite (5 tabs).
- `frontend/app/dashboard/manager/page.tsx` — page-level role guard.
- `frontend/app/manager/analytics/page.tsx` — page-level role guard.
- `frontend/app/inventory/dashboard/page.tsx` — page-level role guard.
- `frontend/app/production/qa/page.tsx` — `useCanPerform` denies MANAGER.
- `frontend/app/production/page.tsx` — `canManageOrders`, `canViewInspections` hooks; conditionally passed callbacks; hidden New Order link.
- `frontend/components/layout/Navbar.tsx` — added 5 manager sidebar links.
- `frontend/services/workforceService.ts` — added hiring/overtime/staffing methods; `approveLeave(id, status)`.
- `frontend/hooks/useLeaves.ts` — `useApproveLeave` payload shape.
- `frontend/hooks/useCanPerform.ts` — shared hook (created earlier in the project).
- `frontend/middleware.ts` — `/production` allows MANAGER; `/manager` requires MANAGER/ADMIN (no other role).

### Docs
- `MANAGER.md` — this file.

---

## 11. How to test

1. `cd backend && npm run start:dev` (and wait for "Nest application successfully started").
2. `cd frontend && npm run dev` (port 3000).
3. Log in as `manager@tfms.com` / `manager123`.
4. Verify:
   - Sidebar shows: Manager, Manager Console, Analytics, Hiring, Production, Inventory, Staffing, Workers.
   - **Manager Console** loads with 5 tabs; **Leaves** tab can Approve/Reject a pending leave (no 403).
   - **Hiring** tab can submit and approve a requisition.
   - **Production** page lists orders; **New Order** button is **not** visible; **Cancel** and **Assign** buttons are not visible; **Inspections** button opens a modal.
   - Navigating to `/production/qa` directly shows the **Access Denied** panel.
   - `/inventory` dashboard loads with view-only tiles and tables; mutation buttons are absent.
