# QA Manager Role — Permissions & Implementation Status

> Cross-checked against `backend/src/production/**`, `backend/src/notifications/**`,
> `backend/prisma/schema.prisma`, `frontend/middleware.ts`,
> `frontend/components/dashboards/QAManagerDashboard.tsx`,
> `frontend/app/dashboard/qa-manager/page.tsx`,
> and the live `/docs-json` Swagger spec.
>
> Legend: ✅ implemented · ⚠️ partially (frontend or backend gap) · ❌ missing or denied

## Test Credentials

| Role | Email | Password |
|---|---|---|
| `QA_MANAGER` | `qa.manager@tfms.com` | `qamanager123` |
| `ADMIN` (fallback) | `admin@tfms.com` | `admin123` |

`QA_MANAGER` is the **quality assurance leadership** role. They define quality thresholds and acceptance criteria, review inspection results and dashboards, evaluate rejection trends, support audit and compliance activities, monitor inspection completion status, recommend process improvements, and generate quality performance reports for management review.

---

## 1. Login with assigned credentials

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `POST /auth/login` (`backend/src/auth/auth.controller.ts`) — no role guard; any verified credentials work. |
| Frontend | `frontend/middleware.ts` — `/login` is public; JWT is set as the `access_token` cookie + `localStorage` key. |
| Seeded user | `backend/prisma/seed.ts:138-153` — `qa.manager@tfms.com / qamanager123` is provisioned with the `QA_MANAGER` role, `isVerified=true`, `mustChangePassword=false`. |

---

## 2. Defining quality thresholds and acceptance criteria

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Threshold model | `QualityThreshold` | `backend/prisma/schema.prisma:545-561` — per-stage `maxDefectsPerHundred`, `acceptanceCriteria`, `isActive` flag. |
| List thresholds | `GET /production/qa/thresholds` | `backend/src/production/production.controller.ts:592-596` — `@Roles('QA_MANAGER', 'ADMIN')`. Returns active thresholds ordered by stage name. |
| Upsert threshold | `POST /production/qa/thresholds/:stageName` | `backend/src/production/production.controller.ts:612-629` — `@Roles('QA_MANAGER', 'ADMIN')`. Creates or updates threshold for a stage. |
| Threshold evaluation | `backend/src/production/production.service.ts:825-835` | When recording inspections, defect rate is compared against active threshold. Records above threshold are flagged. |
| Frontend management UI | `frontend/components/dashboards/QAManagerDashboard.tsx` | "Quality thresholds" card with "Add / Edit" toggle. Form to select stage, set max defects/100, and write acceptance criteria. Displays existing thresholds with status badges. |

---

## 3. Reviewing inspection results and quality dashboards

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| QA Dashboard endpoint | `GET /production/qa/dashboard` | `backend/src/production/production.controller.ts:633-637` — `@Roles('QA_MANAGER', 'ADMIN')`. Returns total inspections, total defects, defect rate, and by-stage breakdown. |
| Frontend dashboard | `frontend/components/dashboards/QAManagerDashboard.tsx` | KPI tiles (Inspections, Total Defects, Defect Rate, Stages Tracked). "Defect trend by stage" breakdown with inspections/passes/rejects per stage. |
| Quality KPI report | `GET /production/reports/quality` | `backend/src/production/production.controller.ts:232-240` — `@Roles('PRODUCTION_MANAGER', 'QA_MANAGER', 'ADMIN')`. Returns pass rate, defect trend, top defect types, stage breakdown. |
| Frontend KPI display | `frontend/components/dashboards/QAManagerDashboard.tsx:208-265` | Pass rate metric, total inspections, weekly defect trend chart, top defect type breakdown. |

---

## 4. Evaluating rejection trends

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Quality report trends | `backend/src/production/production.service.ts:1419-1532` | `getQualityReport()` computes weekly defect trends, top defect types, and stage-level pass/reject rates. |
| Frontend trend display | `frontend/components/dashboards/QAManagerDashboard.tsx:234-248` | Weekly defect trend displayed with defect rate percentages per week. |
| Stage breakdown | `backend/src/production/production.service.ts:1489-1519` | Per-stage pass rates, inspection counts, defect counts, and reject counts. |
| Dashboard by-stage | `frontend/components/dashboards/QAManagerDashboard.tsx:186-204` | Each stage shown with defect count, inspections, passes, and rejects. |

---

## 5. Supporting audit and compliance activities

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Audit log model | `QualityAuditLog` | `backend/prisma/schema.prisma:591-606` — records action, entity type, entity ID, performed by, and JSON details. |
| Audit log creation | `backend/src/production/production.service.ts` | Audit logs are created for: inspection recorded, inspection updated, inspection approved, inspection rejected — all with previous vs updated state details. |
| Audit log endpoint | `GET /production/qa/audit-logs/:inspectionId` | `backend/src/production/production.controller.ts` — `@Roles('QA_MANAGER', 'ADMIN')`. Returns full audit trail for a specific inspection. |
| Inspection history | `backend/src/production/production.service.ts:975-984` | `listInspections()` returns full inspection list with inspector details — all historical records are preserved (old records are superseded, never deleted). |

---

## 6. Monitoring inspection completion status

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Pending stages tracking | `frontend/components/dashboards/QAManagerDashboard.tsx:56-70` | Computes `pendingStages` from orders — all stages in `QA_PENDING` status. |
| Release-ready orders | `frontend/components/dashboards/QAManagerDashboard.tsx:72-83` | Computes `releaseReadyOrders` — orders where all stages are `QA_APPROVED` but not yet `COMPLETED`. |
| Dashboard polls every 10s | `frontend/components/dashboards/QAManagerDashboard.tsx:50-53` | Auto-refreshes dashboard data every 10 seconds for near-real-time monitoring. |
| Real-time notifications | `backend/src/production/production.service.ts:867-871, 929-933` | Managers receive `QA_REVIEW` notifications when inspections are recorded and urgent notifications when all stages are approved. |

---

## 7. Recommending process improvements for defect reduction and efficiency gains

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Process improvement model | `ProcessImprovement` | `backend/prisma/schema.prisma:608-626` — stores title, description, category, expected impact, status, and suggester. |
| Create suggestion | `POST /production/qa/process-improvements` | `backend/src/production/production.controller.ts` — `@Roles('QA_MANAGER', 'QA_STAFF', 'ADMIN')`. |
| List suggestions | `GET /production/qa/process-improvements` | `backend/src/production/production.controller.ts` — `@Roles('QA_MANAGER', 'QA_STAFF', 'ADMIN')`. |
| Update status | `PATCH /production/qa/process-improvements/:id` | `backend/src/production/production.controller.ts` — `@Roles('QA_MANAGER', 'ADMIN')`. Status: `OPEN`, `UNDER_REVIEW`, `IMPLEMENTED`, `REJECTED`. |
| Frontend suggestion form | `frontend/components/dashboards/QAManagerDashboard.tsx` | "Improvement suggestions" card with "New" button. Form captures title, description, category (Defect Reduction, Efficiency Gain, Process Change, Quality Improvement, Safety), and expected impact. |
| Frontend status management | `frontend/components/dashboards/QAManagerDashboard.tsx` | Each suggestion has a status dropdown for managers to update review state. |
| Frontend suggestion list | `frontend/components/dashboards/QAManagerDashboard.tsx` | Displays all suggestions with title, description, category, suggester, status, and expected impact. |

---

## 8. Generating and analyzing quality performance reports for management review

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Quality report endpoint | `GET /production/reports/quality` | `backend/src/production/production.controller.ts:232-240` — accepts optional `from`, `to`, `productId` query params. |
| Report data | `backend/src/production/production.service.ts:1419-1532` | Returns `totalInspections`, `passRate`, `defectTrend` (weekly), `topDefectTypes` (top 5), `stageBreakdown` (per-stage pass rate, inspections, defects, passes, rejects), `totalDefects`. |
| Dashboard analytics | `frontend/components/dashboards/QAManagerDashboard.tsx` | Visualizes defect trends, stage breakdowns, top defect types, and key metrics. |
| Performance report | `GET /production/reports/performance` | `backend/src/production/production.controller.ts:221-225` — aggregate good/defective by stage. |
| Issue report | `GET /production/reports/issues` | `backend/src/production/production.controller.ts:262-264` — issues by type, priority, status. |
| Output report | `GET /production/reports/output` | `backend/src/production/production.controller.ts:247-249` — good vs defective per shift and stage. |

---

## 9. Final product release to finished goods inventory

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Release order | `POST /production/:id/release` | `backend/src/production/production.controller.ts:169-176` — `@Roles('QA_MANAGER', 'STOREKEEPER', 'ADMIN')`. Creates/updates finished-goods inventory item and marks order as `COMPLETED`. |
| Reject release request | `POST /production/:id/reject-release` | `backend/src/production/production.controller.ts:205-217` — `@Roles('QA_MANAGER', 'STOREKEEPER', 'ADMIN')`. Requires rejection reason. |
| Release queue UI | `frontend/components/dashboards/QAManagerDashboard.tsx:111-175` | "Release finished orders to inventory" table with orders where all stages are QA-approved. Release button gated by `useCanPerform(['QA_MANAGER', 'ADMIN'])`. |
| Release notification | `backend/src/production/production.service.ts:1394-1408` | Supervisor and manager receive `PRODUCTION_RELEASED` notification when order is released. |

---

## Sidebar / Navigation map for `QA_MANAGER`

**Status: ✅ fully implemented**

| Link | Purpose | Backend gate |
|---|---|---|
| `/dashboard` | QA Manager home (analytics, release queue, thresholds, improvements) | open to all authenticated users |
| `/production` | Production order list (read-only context) | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, QA_MANAGER, QA_STAFF, STOREKEEPER, ADMIN, MANAGER` |
| `/dashboard/inventory` | Inventory access for release context | `STOREKEEPER, MANAGER, PRODUCTION_MANAGER, MAINTENANCE_MANAGER, QA_MANAGER, ADMIN` |
| `/dashboard/notifications` | Notification center | `ADMIN, STOREKEEPER, QA_MANAGER, QA_STAFF` |

---

## Backend endpoint matrix — QA Manager capabilities

| Capability | Endpoint | File | Roles |
|---|---|---|---|
| Login | `POST /auth/login` | `auth.controller.ts` | any |
| List orders | `GET /production` | `production.controller.ts:71-82` | `…, QA_MANAGER, …` |
| View one order | `GET /production/:id` | `production.controller.ts:88-100` | `…, QA_MANAGER, …` |
| QA dashboard | `GET /production/qa/dashboard` | `production.controller.ts:633-637` | `QA_MANAGER, ADMIN` |
| Quality report | `GET /production/reports/quality` | `production.controller.ts:232-240` | `PRODUCTION_MANAGER, QA_MANAGER, ADMIN` |
| Issue report | `GET /production/reports/issues` | `production.controller.ts:262-264` | `…, QA_MANAGER, …` |
| List thresholds | `GET /production/qa/thresholds` | `production.controller.ts:592-596` | `QA_MANAGER, ADMIN` |
| Upsert threshold | `POST /production/qa/thresholds/:stageName` | `production.controller.ts:612-629` | `QA_MANAGER, ADMIN` |
| List inspections | `GET /production/qa/inspections` | `production.controller.ts:574-578` | `QA_STAFF, QA_MANAGER, ADMIN` |
| Order inspections | `GET /production/:id/qa/inspections` | `production.controller.ts:583-588` | `QA_STAFF, QA_MANAGER, ADMIN` |
| Record inspection | `POST /production/:id/stages/:stageId/qa-inspection` | `production.controller.ts:382-404` | `QA_STAFF, QA_MANAGER, ADMIN` |
| Update inspection | `PATCH /production/:id/stages/:stageId/qa-inspection/:inspectionId` | `production.controller.ts` | `QA_STAFF, QA_MANAGER, ADMIN` |
| Approve inspection | `PATCH /…/approve` | `production.controller.ts:411-419` | `QA_STAFF, QA_MANAGER, ADMIN` |
| Reject inspection | `PATCH /…/reject` | `production.controller.ts:427-441` | `QA_STAFF, QA_MANAGER, ADMIN` |
| QA review | `POST /…/qa-review` | `production.controller.ts:348-363` | `QA_STAFF, QA_MANAGER, ADMIN` |
| Release order | `POST /production/:id/release` | `production.controller.ts:169-176` | `QA_MANAGER, STOREKEEPER, ADMIN` |
| Reject release | `POST /production/:id/reject-release` | `production.controller.ts:205-217` | `QA_MANAGER, STOREKEEPER, ADMIN` |
| Update issue status | `PATCH /production/:id/issues/:issueId` | `production.controller.ts:644-651` | `QA_MANAGER, PRODUCTION_MANAGER, ADMIN` |
| Record output | `POST /production/:id/output` | `production.controller.ts:447-460` | `…, QA_MANAGER, …` |
| Report issue | `POST /production/:id/issues` | `production.controller.ts:498-513` | `…, QA_MANAGER, …` |
| List process improvements | `GET /production/qa/process-improvements` | `production.controller.ts` | `QA_MANAGER, QA_STAFF, ADMIN` |
| Create process improvement | `POST /production/qa/process-improvements` | `production.controller.ts` | `QA_MANAGER, QA_STAFF, ADMIN` |
| Update process improvement | `PATCH /production/qa/process-improvements/:id` | `production.controller.ts` | `QA_MANAGER, ADMIN` |
| Get audit logs | `GET /production/qa/audit-logs/:inspectionId` | `production.controller.ts` | `QA_MANAGER, ADMIN` |
| View notifications | `GET /notifications` | `notifications.controller.ts:21-23` | any authenticated |

---

## How to test

1. `cd backend && npm run start:dev` (wait for "Nest application successfully started").
2. `cd frontend && npm run dev` (port 3000).
3. Log in as `qa.manager@tfms.com / qamanager123`.
4. **Dashboard:** see KPI tiles (Inspections, Total Defects, Defect Rate, Stages Tracked), defect trend by stage, quality KPI report.
5. **Manage thresholds:** open "Quality thresholds" card, click "Add / Edit", select a stage, set max defects and criteria, save.
6. **Release an order:** when all stages of an order are QA-approved, it appears in the release queue. Click "Release" to move to finished goods.
7. **Process improvements:** click "New" under "Improvement suggestions", fill in title, description, category, and expected impact. Change status via the dropdown on existing suggestions.
8. **View analytics:** pass rate, defect trends, top defect types, and stage breakdown are all rendered on the dashboard.
9. **Check notifications:** open the notification center at `/dashboard/notifications`.
10. **Audit trail:** QA actions (inspection record, update, approve, reject) are all logged in `QualityAuditLog` and retrievable via `GET /production/qa/audit-logs/:inspectionId`.
