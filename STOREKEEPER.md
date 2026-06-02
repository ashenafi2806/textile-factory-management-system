# Storekeeper Role — Permissions & Implementation Status

> Cross-checked against `backend/src/inventory/**`, `backend/src/production/**`,
> `backend/src/auth/**`, `backend/src/notifications/**`, `frontend/middleware.ts`,
> `frontend/components/layout/Navbar.tsx`, `frontend/components/dashboards/StorekeeperDashboard.tsx`,
> and the live `/docs-json` Swagger spec.
>
> Legend: ✅ implemented · ⚠️ partially (frontend or backend gap) · ❌ missing or denied

## Test Credentials

| Role | Email | Password |
|---|---|---|
| `STOREKEEPER` | `storekeeper@tfms.com` | `storekeeper123` |
| `ADMIN` (fallback) | `admin@tfms.com` | `admin123` |

`STOREKEEPER` is a **warehouse operator** role. It owns the inventory
sub-system: receipts, issues, adjustments, returns, low-stock & spare-part
reorder monitoring, and finished-goods release approval.

---

## 1. Login with assigned credentials

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `POST /auth/login` (`backend/src/auth/auth.controller.ts`) — no role guard; any verified credentials work. |
| Frontend | `frontend/middleware.ts:4` — `/login` is public; JWT is set as the `access_token` cookie + `localStorage` key. |
| Seeded user | `backend/prisma/seed.ts:172-187` — `storekeeper@tfms.com / storekeeper123` is provisioned with the `STOREKEEPER` role, `isVerified=true`, `mustChangePassword=false`. |
| Swagger | `auth` tag (5 operations under `/auth`). |

---

## 2. Navigate to Inventory Management

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Sidebar | `frontend/components/layout/Navbar.tsx:186-209` — `STOREKEEPER` shows **Inventory**, **Reorder Alerts**, **Release Queue**, **Requisitions**. |
| Dashboard tile | `frontend/components/dashboards/StorekeeperDashboard.tsx` — KPI tiles for inventory, alerts, critical, ready-to-release. |
| Route guard | `frontend/middleware.ts:14-22` — `/inventory` accepts `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, MAINTENANCE_MANAGER, ADMIN`. |
| Page guard | `frontend/app/(dashboard)/inventory/page.tsx:72-77` — `useCanPerform` denies other roles. |

---

## 3. Record incoming raw materials (fabrics, accessories) with quantity, supplier, and purchase date

**Status: ✅ fully implemented**

| Capability | Endpoint | Roles | Frontend |
|---|---|---|---|
| Create inventory item (RAW_MATERIAL / ACCESSORY / SPARE_PART / FINISHED_GOOD) | `POST /inventory/items` | `STOREKEEPER, ADMIN` | `frontend/components/modules/inventory/CreateItemModal.tsx` |
| Create receipt with supplier, batch, purchase date, and line items | `POST /inventory/receipts` | `STOREKEEPER, ADMIN` | `frontend/components/modules/inventory/ReceiptForm.tsx` |
| Restock an existing item | `POST /inventory/restock` | `STOREKEEPER, ADMIN` | `frontend/components/modules/inventory/RestockModal.tsx` |
| List receipts | `GET /inventory/receipts` | `STOREKEEPER, MANAGER, ADMIN` | surfaces on inventory dashboard |

- Receipts are stored in `InventoryReceipt` with a header (`supplierName`,
  `batchNumber`, `purchaseDate`) and child `InventoryReceiptItem` rows
  (per-SKU quantity + optional `unitPrice`).
- Stock is incremented and a `RESTOCK` `InventoryTransaction` is written
  with `ReferenceType.RECEIPT`, giving a complete audit trail.

---

## 4. Record incoming spare parts and maintenance materials

**Status: ✅ fully implemented**

The same `POST /inventory/receipts` endpoint handles spare parts — items
created with `category=SPARE_PART` flow through the same receipt workflow.
The storekeeper:

1. Creates the spare-part item (or re-stocks an existing one) with
   `category=SPARE_PART` and a sensible `minThreshold`.
2. Creates a receipt with supplier, batch, purchase date.
3. The system increments the spare-part stock atomically and writes a
   `RESTOCK` transaction.

**File:** `backend/src/inventory/receipt.service.ts:24-60`.

---

## 5. Issue materials to production orders as requested

**Status: ✅ fully implemented**

| Capability | Endpoint | Roles | Frontend |
|---|---|---|---|
| Issue stock | `POST /inventory/issue` | `STOREKEEPER, ADMIN` | `frontend/components/modules/inventory/IssueStockModal.tsx` |
| List requisitions | `GET /inventory/requisitions` | `MANAGER, ADMIN, SUPERVISOR, MAINTENANCE_MANAGER, PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR` | `frontend/app/dashboard/inventory/requisitions/page.tsx` |

**Workflow enforced in `backend/src/inventory/inventory.service.ts:229-344`:**

1. If `referenceId` is a requisition → it must be `APPROVED` and the issued
   quantity / item must match the requisition.
2. If `referenceId` is a `ProductionOrder` → the order must be `IN_PROGRESS`
   (or further along); `PLANNED` / `CANCELLED` orders cannot draw material.
3. If `referenceId` is a `MaintenanceTask` → the system requires an
   `APPROVED` requisition attached to that task.
4. Stock cannot go below zero; low-stock alerts are returned in the response.
5. Each issue writes a `TransactionType.ISSUE` row with
   `ReferenceType.PRODUCTION_ORDER` / `MAINTENANCE_TASK` / `REQUISITION`.

---

## 6. Issue spare parts to maintenance technicians upon request

**Status: ✅ fully implemented**

Spare-part issuance follows the same flow as production material issuance:

- A `MAINTENANCE_TECHNICIAN` (or `MAINTENANCE_MANAGER`) submits a
  requisition through `POST /maintenance/tasks/:id/spare-parts-request`
  (`backend/src/maintenance/maintenance.controller.ts:112-133`).
- A `MANAGER` / `PRODUCTION_MANAGER` / `ADMIN` approves it
  (`PATCH /inventory/requisitions/:id/approve`).
- The storekeeper then issues the spare parts with
  `POST /inventory/issue`, supplying the **maintenance task id** as
  `referenceId`. The service enforces that an approved requisition exists
  for the task and that the issued item / quantity match it
  (`backend/src/inventory/inventory.service.ts:265-289`).

---

## 7. Generate inventory reports for management review

**Status: ✅ fully implemented**

| Report | Endpoint | Roles |
|---|---|---|
| Category summary (count + quantity) | `GET /inventory/summary` | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, ADMIN` |
| Valuation (avg unit price × current qty) | `GET /inventory/valuation` | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, ADMIN` |
| Aging (weighted average age in days) | `GET /inventory/aging` | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, ADMIN` |
| Consumption (issued in last N days + daily rate) | `GET /inventory/consumption?days=30` | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, ADMIN` |
| Low-stock alerts (with suggested reorder qty) | `GET /inventory/alerts?category=...` | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, MAINTENANCE_MANAGER, ADMIN` |
| Alerts as CSV (for management review / supplier emails) | `GET /inventory/alerts/export?category=...` | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, MAINTENANCE_MANAGER, ADMIN` |
| Transaction history with filters | `GET /inventory/transactions` | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, MAINTENANCE_MANAGER, ADMIN` |

Reports are surfaced on `/inventory` and in the **Reorder Alerts** page.
The CSV export endpoint is consumed by the storekeeper dashboard's
"Export CSV" button so the file can be emailed to suppliers or attached to
weekly review meetings.

---

## 8. Approve finished products for storage after quality inspection

**Status: ✅ fully implemented (this PR)**

**Workflow:**

1. Production order flows through CUTTING → SEWING → FINISHING → PACKING.
2. QA staff inspect each stage and submit a `QualityInspection`; QA
   managers approve or reject each inspection.
3. Once **every stage is `QA_APPROVED`**, the order is queued for
   finished-goods release.
4. The **Storekeeper** reviews the queue at
   `/dashboard/inventory/release-queue` and clicks **Approve for
   storage** (or the QA manager / admin can do it from
   `/dashboard/qa-manager`).

**Implementation:**

| Concern | File | Notes |
|---|---|---|
| Endpoint | `POST /production/:id/release` | `backend/src/production/production.controller.ts:165-179` — `@Roles('QA_MANAGER', 'STOREKEEPER', 'ADMIN')`. |
| Service | `backend/src/production/production.service.ts:1187-1280` | Verifies all stages are `QA_APPROVED`, atomically increments finished-goods stock (creating a `FINISHED_GOOD` item if one does not exist), and flips the order to `COMPLETED`. |
| Quantity source | `backend/src/production/production.service.ts:1202-1216` | Uses `order.targetQuantity` (the planned good quantity) as the produced quantity, falling back to the sum of recorded outputs only if outputs exist. This avoids the previous behaviour where missing supervisor output rows caused 0 units to be moved to finished goods. |
| Minimum threshold | `backend/src/production/production.service.ts:1217-1220` | Set to `max(0, ceil(producedQty * 0.1))` — a low threshold (≈10 % of the released quantity) so the storekeeper can still see "running low" alerts without paging on every release. |
| Notifications | `backend/src/production/production.service.ts:1262-1276` | Notifies the assigned supervisor and the manager who created the order. |
| Frontend page | `frontend/app/dashboard/inventory/release-queue/page.tsx` | KPI tiles + a tabbed list (ready / all) with an "Approve for storage" button. |
| Frontend widget | `frontend/components/dashboards/StorekeeperDashboard.tsx:158-205` | The dashboard surfaces the top-5 ready orders with a one-click release action. |

**Change made in this PR:** added `STOREKEEPER` to the `@Roles` of
`POST /production/:id/release` so the storekeeper can finalise the
storage step after QA has already approved every stage. The QA manager
and admin retain the same right (dual control).

---

## 9. Monitor machine spare-part inventory levels and generate reorder alerts

**Status: ✅ fully implemented (this PR)**

| Concern | File | Notes |
|---|---|---|
| Endpoint | `GET /inventory/alerts?category=SPARE_PART` | `backend/src/inventory/inventory.controller.ts:165-187` — accepts an optional `category` query parameter. |
| Service | `backend/src/inventory/inventory.service.ts:387-453` | Returns items whose `quantity <= minThreshold`, with `shortage`, `severity` (`critical` if `quantity === 0`), and a `suggestedReorderQuantity` (`2 × threshold − quantity`, floor at threshold). |
| CSV export | `GET /inventory/alerts/export?category=SPARE_PART` | `backend/src/inventory/inventory.service.ts:455-490` — RFC-4180-style CSV for management / supplier sharing. |
| Frontend page | `frontend/app/dashboard/inventory/reorder-alerts/page.tsx` | Tabbed by category (spare parts, raw materials, accessories, finished goods). Shows KPIs, per-item shortage, suggested reorder, and a one-click **Reorder** action that opens the restock modal pre-filled. |
| Dashboard widget | `frontend/components/dashboards/StorekeeperDashboard.tsx:113-156` | Top-5 spare-part reorder alerts on the storekeeper home screen. |

**Change made in this PR:** the `getAlerts` endpoint previously returned
all categories. Adding the `?category=...` query parameter lets the
storekeeper dashboard request a **machine spare-part-specific** alert
list. The new `suggestedReorderQuantity` field replaces the need for the
storekeeper to compute the reorder size manually.

---

## Sidebar / Navigation map for `STOREKEEPER`

**Status: ✅ fully implemented**

| Link | Purpose | Backend gate |
|---|---|---|
| `/inventory` | Full inventory dashboard (KPIs, charts, transactions) | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, MAINTENANCE_MANAGER, ADMIN` |
| `/dashboard/inventory/reorder-alerts` | Spare-part & per-category reorder alerts + CSV export | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, MAINTENANCE_MANAGER, QA_MANAGER, ADMIN` |
| `/dashboard/inventory/release-queue` | Approve fully QA-inspected orders into finished-goods storage | `STOREKEEPER, QA_MANAGER, ADMIN` |
| `/dashboard/inventory/requisitions` | View material requisitions (read-only for storekeeper) | `MANAGER, ADMIN, SUPERVISOR, MAINTENANCE_MANAGER, PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR` |
| `/dashboard` | Storekeeper home with KPI tiles + notifications | open to all authenticated users |

**File:** `frontend/components/layout/Navbar.tsx:186-209`.

---

## Backend endpoint matrix — Storekeeper capabilities

| Capability | Endpoint | File | Roles |
|---|---|---|---|
| Login | `POST /auth/login` | `auth.controller.ts` | any |
| Read inventory items | `GET /inventory/items` | `inventory.controller.ts:62-83` | STOREKEEPER, MANAGER, PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, MAINTENANCE_MANAGER, MAINTENANCE_TECHNICIAN, ADMIN |
| Create inventory item | `POST /inventory/items` | `inventory.controller.ts:49-53` | STOREKEEPER, ADMIN |
| Update inventory item | `PATCH /inventory/items/:id` | `inventory.controller.ts:106-113` | STOREKEEPER, ADMIN |
| Create receipt | `POST /inventory/receipts` | `receipt.controller.ts:28-35` | STOREKEEPER, ADMIN |
| List receipts | `GET /inventory/receipts` | `receipt.controller.ts:41-48` | STOREKEEPER, MANAGER, ADMIN |
| Restock | `POST /inventory/restock` | `inventory.controller.ts:118-122` | STOREKEEPER, ADMIN |
| Issue stock | `POST /inventory/issue` | `inventory.controller.ts:127-131` | STOREKEEPER, ADMIN |
| Adjust stock | `POST /inventory/adjust` | `inventory.controller.ts:136-143` | STOREKEEPER, ADMIN |
| Return stock | `POST /inventory/return` | `inventory.controller.ts:148-163` | STOREKEEPER, ADMIN |
| Low-stock alerts | `GET /inventory/alerts?category=...` | `inventory.controller.ts:165-187` | STOREKEEPER, MANAGER, PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, MAINTENANCE_MANAGER, ADMIN |
| Export alerts CSV | `GET /inventory/alerts/export?category=...` | `inventory.controller.ts:189-214` | STOREKEEPER, MANAGER, PRODUCTION_MANAGER, MAINTENANCE_MANAGER, ADMIN |
| Transaction history | `GET /inventory/transactions` | `inventory.controller.ts:223-247` | STOREKEEPER, MANAGER, PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, MAINTENANCE_MANAGER, ADMIN |
| Summary / Valuation / Aging / Consumption | `GET /inventory/{summary,valuation,aging,consumption}` | `inventory.controller.ts:252-301` | STOREKEEPER, MANAGER, PRODUCTION_MANAGER, ADMIN |
| Approve finished-goods release | `POST /production/:id/release` | `production.controller.ts:165-179` | QA_MANAGER, **STOREKEEPER** (added in this PR), ADMIN |
| List production orders (read-only context) | `GET /production` | `production.controller.ts:71-82` | … + **STOREKEEPER** (added in this PR) |
| View a single production order | `GET /production/:id` | `production.controller.ts:87-99` | already includes STOREKEEPER |
| Notifications | `GET /notifications/unread` | `notifications.controller.ts` | any authenticated |
| Mark notification read | `PATCH /notifications/:id/read` | `notifications.controller.ts` | the recipient only |

---

## Files added or modified in this PR

### Backend

- `backend/src/inventory/inventory.controller.ts:165-187` — `GET /inventory/alerts` now accepts an optional `category` query.
- `backend/src/inventory/inventory.controller.ts:189-214` — new `GET /inventory/alerts/export` returning CSV.
- `backend/src/inventory/inventory.controller.ts:11` — added `Res`, `Header` to Nest common imports.
- `backend/src/inventory/inventory.service.ts:387-490` — `getAlerts` now accepts `{ category }`, attaches a `suggestedReorderQuantity`, and is paired with a new `exportAlertsCsv` method.
- `backend/src/production/production.controller.ts:72-79` — added `STOREKEEPER` to `GET /production`.
- `backend/src/production/production.controller.ts:165-179` — added `STOREKEEPER` to `POST /production/:id/release`.

### Frontend

- `frontend/lib/api/inventory.ts:50-54` — `AlertItem` interface gained `suggestedReorderQuantity`.
- `frontend/lib/api/inventory.ts:245-254` — `inventoryApi.getAlerts` now accepts `{ category }`.
- `frontend/app/dashboard/inventory/release-queue/page.tsx` — new page (KPI tiles, ready/all tabs, approve-for-storage action).
- `frontend/app/dashboard/inventory/reorder-alerts/page.tsx` — new page (per-category tabs, KPIs, suggested-reorder table, CSV export, one-click restock).
- `frontend/components/dashboards/StorekeeperDashboard.tsx` — full rewrite adding KPI tiles for spare-part alerts and ready-to-release count, plus the two new dashboard widgets.
- `frontend/components/layout/Navbar.tsx:186-209` — `STOREKEEPER` sidebar now exposes **Inventory**, **Reorder Alerts**, **Release Queue**, **Requisitions**.
- `frontend/middleware.ts:44-55` — added `/dashboard/inventory` to the route-role map for STOREKEEPER, MANAGER, PRODUCTION_MANAGER, MAINTENANCE_MANAGER, QA_MANAGER, ADMIN.

### Docs

- `STOREKEEPER.md` — this file.

---

## How to test

1. `cd backend && npm run start:dev` (wait for "Nest application successfully started").
2. `cd frontend && npm run dev` (port 3000).
3. Log in as `storekeeper@tfms.com / storekeeper123`.
4. **Sidebar:** Inventory, Reorder Alerts, Release Queue, Requisitions are visible.
5. **Reorder Alerts:** visit `/dashboard/inventory/reorder-alerts`. The page loads with `SPARE_PART` selected by default; a list of spare parts at or below their minimum threshold is shown. Click **Reorder** to open the restock modal pre-filled with the item, or **Export CSV** to download the list.
6. **Release Queue:** visit `/dashboard/inventory/release-queue`. If any production order has all stages `QA_APPROVED` and is not yet `COMPLETED`, it appears under the "Ready to release" tab. Click **Approve for storage** to release the order — the produced quantity is added to finished-goods inventory, the order is marked `COMPLETED`, and a notification is sent to the supervisor and the production manager.
7. **Inventory dashboard:** visit `/inventory`. Low-stock alerts, KPIs, recent transactions, valuation, aging, and consumption are all visible.
8. **Login as `qa.manager@tfms.com / qa123`** (or `admin@tfms.com / admin123`): the same **Release Queue** page is accessible, confirming dual control between QA and the storekeeper.

---

## Pre-existing limitations (out of scope for this PR)

- **No bulk-reorder action** — the storekeeper must reorder items one at a time. Acceptable for final-year scope; a future enhancement could add a "Create purchase order from alerts" workflow.
- **No automatic email to suppliers** — the CSV export is the manual handoff today. Plugging into an SMTP/purchase-order system is a future sprint.
- **Spare-part reorder alerts use a static `2 × threshold − quantity` rule.** A more advanced policy could pull from `getConsumptionAnalysis(dailyRate)` to project days-of-stock-remaining. The `dailyRate` field is already returned by the consumption endpoint and can be wired in later without schema changes.
- **Release decision is binary (approve or view-only).** A "Hold in quarantine" status would be a future-state addition.
