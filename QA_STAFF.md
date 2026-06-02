# QA Staff Role — Permissions & Implementation Status

> Cross-checked against `backend/src/production/**`, `backend/src/notifications/**`,
> `backend/prisma/schema.prisma`, `frontend/middleware.ts`,
> `frontend/components/dashboards/QAStaffDashboard.tsx`,
> `frontend/app/dashboard/qa-staff/page.tsx`,
> `frontend/app/production/qa/page.tsx`,
> and the live `/docs-json` Swagger spec.
>
> Legend: ✅ implemented · ⚠️ partially (frontend or backend gap) · ❌ missing or denied

## Test Credentials

| Role | Email | Password |
|---|---|---|
| `QA_STAFF` | `qa.staff@tfms.com` | `qastaff123` |
| `ADMIN` (fallback) | `admin@tfms.com` | `admin123` |

`QA_STAFF` is the **frontline quality assurance** role on the factory floor. They execute inspections at each production stage, record measurements and defects, attach evidence, respond to quality alerts, update records during re-inspections, and approve/reject stage-level inspections.

---

## 1. Login with assigned credentials

**Status: ✅ fully implemented**

| Layer | Evidence |
|---|---|
| Backend | `POST /auth/login` (`backend/src/auth/auth.controller.ts`) — no role guard; any verified credentials work. |
| Frontend | `frontend/middleware.ts` — `/login` is public; JWT is set as the `access_token` cookie + `localStorage` key. |
| Seeded user | `backend/prisma/seed.ts:155-170` — `qa.staff@tfms.com / qastaff123` is provisioned with the `QA_STAFF` role, `isVerified=true`, `mustChangePassword=false`. |

---

## 2. Executing inspections at each production stage

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| QA Staff Dashboard | `frontend/components/dashboards/QAStaffDashboard.tsx:44-630` | Shows "Stages waiting for inspection" table with "Enter Review" button. Lists all stages in `QA_PENDING` status across production orders. |
| Record inspection | `POST /production/:id/stages/:stageId/qa-inspection` | `backend/src/production/production.controller.ts:382-404` — `@Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')`. |
| Inspection modal | `frontend/components/dashboards/QAStaffDashboard.tsx:531-610` | Modal form with Measurements, Defects, Evidence, and Notes fields. |
| Submit for QA | `POST /production/:id/stages/:stageId/submit-for-qa` | `backend/src/production/production.controller.ts:309-322` — Supervisor submits stage; QA Staff sees it in their queue. |

---

## 3. Recording inspection measurements, defects, and observations

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Measurements | `QualityInspection.measurements` | `backend/prisma/schema.prisma:575` — optional text field for dimension/value readings. |
| Defects | `QualityInspection.defects` | `backend/prisma/schema.prisma:577` — integer count of defects found. |
| Notes / Observations | `QualityInspection.notes` | `backend/prisma/schema.prisma:581` — free-text observations and context. |
| Service method | `backend/src/production/production.service.ts:813-875` | `recordInspection()` creates the inspection record, supersedes previous PENDING entries, evaluates defect rate against thresholds, and notifies QA managers. |

---

## 4. Attaching inspection evidence such as comments

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Evidence field | `QualityInspection.evidence` | `backend/prisma/schema.prisma:583` — text field for evidence descriptions, file references, sample IDs, photo notes, test results. |
| Frontend evidence input | `frontend/components/dashboards/QAStaffDashboard.tsx` | Textarea labeled "Evidence / Observations" in the inspection modal, with placeholder "Describe evidence: photos taken, samples collected, test results, etc." |
| Audit trail | `QualityAuditLog` | `backend/prisma/schema.prisma:591-606` — every inspection record, update, approval, and rejection is logged with previous/updated values. |

---

## 5. Responding to quality alerts and notifications

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Notification system | `backend/src/notifications/notifications.service.ts` | `createForUsers()` sends notifications to user IDs. |
| QA Staff notified | `backend/src/production/production.service.ts:81-102` | `notifyQaManagers()` sends `QA_REVIEW` type notifications to `QA_MANAGER` and `ADMIN` roles when inspections are recorded. |
| Frontend notification panel | `frontend/components/dashboards/QAStaffDashboard.tsx` | Collapsible "Quality alerts" panel with unread count badge. Shows urgent and normal notifications with timestamps. |
| Middleware route | `frontend/middleware.ts:44` | `/dashboard/notifications` route now includes `QA_STAFF`. |
| Unread indicator | `frontend/components/dashboards/QAStaffDashboard.tsx` | Polls `/api/notifications` every 15s alongside inspection data. |

---

## 6. Updating inspection records during audits or re-inspections

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Update endpoint | `PATCH /production/:id/stages/:stageId/qa-inspection/:inspectionId` | `backend/src/production/production.controller.ts` — `@Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')`. Allows updating measurements, defects, notes, and evidence. |
| Audit logging | `backend/src/production/production.service.ts` | `updateInspection()` creates a `QualityAuditLog` entry with previous vs updated values. |
| Frontend re-inspect button | `frontend/components/dashboards/QAStaffDashboard.tsx` | "Edit / Re-inspect" button on each closed inspection row. Opens the inspection modal pre-filled with existing values. |
| Frontend PATCH call | `frontend/components/dashboards/QAStaffDashboard.tsx` | `submitInspection()` calls PATCH when `editingInspection` is set, POST otherwise. |

---

## 7. Approving or rejecting stage inspections

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Approve inspection | `PATCH /production/:id/stages/:stageId/qa-inspection/:inspectionId/approve` | `backend/src/production/production.controller.ts:411-419` — `@Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')`. Flips stage to `QA_APPROVED`. |
| Reject inspection | `PATCH /production/:id/stages/:stageId/qa-inspection/:inspectionId/reject` | `backend/src/production/production.controller.ts:427-441` — `@Roles('QA_STAFF', 'QA_MANAGER', 'ADMIN')`. Flips stage to `QA_REJECTED`, appends reason to notes. |
| Frontend decision buttons | `frontend/components/dashboards/QAStaffDashboard.tsx:332-434` | "Inspections awaiting your decision" table with Approve / Reject buttons. Reject prompts for an optional reason. |
| Audit log | `backend/src/production/production.service.ts` | Both approve and reject create `QualityAuditLog` entries. |
| Full-stage-approved notification | `backend/src/production/production.service.ts:924-933` | When all stages of an order are approved, QA managers are notified that the order is ready for final release. |

---

## 8. Recording production output and reporting issues

**Status: ✅ fully implemented**

| Concern | File | Notes |
|---|---|---|
| Record output | `POST /production/:id/output` | `backend/src/production/production.controller.ts:447-460` — `@Roles('PRODUCTION_SUPERVISOR', 'QA_STAFF', 'QA_MANAGER', 'ADMIN')`. |
| Report issue | `POST /production/:id/issues` | `backend/src/production/production.controller.ts:498-513` — `@Roles('PRODUCTION_SUPERVISOR', 'QA_STAFF', 'QA_MANAGER', 'PRODUCTION_MANAGER', 'ADMIN')`. |

---

## Sidebar / Navigation map for `QA_STAFF`

**Status: ✅ fully implemented**

| Link | Purpose | Backend gate |
|---|---|---|
| `/dashboard` | QA Staff home (pending stages, inspections to decide, recent history) | open to all authenticated users |
| `/production/qa` | QA Staff dashboard (alternate route) | page-level gated via `useCanPerform` |
| `/production` | Production order list (read-only context) | `PRODUCTION_MANAGER, PRODUCTION_SUPERVISOR, QA_MANAGER, QA_STAFF, STOREKEEPER, ADMIN, MANAGER` |

---

## Backend endpoint matrix — QA Staff capabilities

| Capability | Endpoint | File | Roles |
|---|---|---|---|
| Login | `POST /auth/login` | `auth.controller.ts` | any |
| List orders | `GET /production` | `production.controller.ts:71-82` | `…, QA_STAFF, …` |
| View one order | `GET /production/:id` | `production.controller.ts:88-100` | `…, QA_STAFF, …` |
| Record QA inspection | `POST /production/:id/stages/:stageId/qa-inspection` | `production.controller.ts:382-404` | `QA_STAFF, QA_MANAGER, ADMIN` |
| Record inspection (alt) | `POST /production/:id/stages/:stageId/inspection` | `production.controller.ts:548-570` | `QA_STAFF, QA_MANAGER, ADMIN` |
| Update inspection | `PATCH /production/:id/stages/:stageId/qa-inspection/:inspectionId` | `production.controller.ts` | `QA_STAFF, QA_MANAGER, ADMIN` |
| Approve inspection | `PATCH /production/:id/stages/:stageId/qa-inspection/:inspectionId/approve` | `production.controller.ts:411-419` | `QA_STAFF, QA_MANAGER, ADMIN` |
| Reject inspection | `PATCH /production/:id/stages/:stageId/qa-inspection/:inspectionId/reject` | `production.controller.ts:427-441` | `QA_STAFF, QA_MANAGER, ADMIN` |
| List all inspections | `GET /production/qa/inspections` | `production.controller.ts:574-578` | `QA_STAFF, QA_MANAGER, ADMIN` |
| List order inspections | `GET /production/:id/qa/inspections` | `production.controller.ts:583-588` | `QA_STAFF, QA_MANAGER, ADMIN` |
| Record output | `POST /production/:id/output` | `production.controller.ts:447-460` | `…, QA_STAFF, …` |
| Report issue | `POST /production/:id/issues` | `production.controller.ts:498-513` | `…, QA_STAFF, …` |
| List issues | `GET /production/:id/issues` | `production.controller.ts:518-529` | `…, QA_STAFF, …` |
| Get output history | `GET /production/:id/output` | `production.controller.ts:465-476` | `…, QA_STAFF, …` |
| Get stage output report | `GET /production/:id/output/report` | `production.controller.ts:481-492` | `…, QA_STAFF, …` |
| View unread notifications | `GET /notifications` | `notifications.controller.ts:21-23` | any authenticated |
| View process improvements | `GET /production/qa/process-improvements` | `production.controller.ts` | `QA_MANAGER, QA_STAFF, ADMIN` |
| Create process improvement | `POST /production/qa/process-improvements` | `production.controller.ts` | `QA_MANAGER, QA_STAFF, ADMIN` |

---

## How to test

1. `cd backend && npm run start:dev` (wait for "Nest application successfully started").
2. `cd frontend && npm run dev` (port 3000).
3. Log in as `qa.staff@tfms.com / qastaff123`.
4. **Dashboard:** see KPI tiles (Stages Awaiting Review, Inspections to Decide, Approved/Rejected Stages).
5. **Record an inspection:** click "Enter Review" on a pending stage, fill in measurements, defects, evidence, and notes, then "Save Inspection".
6. **Approve or reject:** after recording, the inspection appears in "Inspections awaiting your decision". Click Approve or Reject.
7. **Edit a closed inspection:** find a decided inspection in "Inspections you closed", click "Edit / Re-inspect", update fields, and submit.
8. **View notifications:** click "Quality alerts" panel to see unread QA notifications.
9. **Suggest improvement:** click "New" under the Improvement suggestions section (or use the QA Manager view).
10. **View production orders:** navigate to `/production` for the full order list.
