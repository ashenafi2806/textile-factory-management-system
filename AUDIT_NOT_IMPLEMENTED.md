# Factory Management System Audit: Not Implemented / Partial Gaps

This audit was produced by scanning the backend NestJS source, Prisma schema, and the Next.js frontend source.

## Audit Summary

| Module                                | Implemented | Partial | Not Implemented |
| ------------------------------------- | ----------- | ------- | --------------- |
| Authentication & Authorization (FR-1) | ✅          |         |                 |
| Production Order Management (FR-2)    | ✅          |         |                 |
| Material Availability (FR-3)          | ✅          |         |                 |
| Production Workflow (FR-4)            | ✅          |         |                 |
| QA Enforcement (FR-5)                 | ✅          |         |                 |
| Output & Issue Reporting (FR-6)       | ✅          |         |                 |
| Production Monitoring (FR-7)          | ✅          |         |                 |
| Inventory Receipt (FR-8)              | ✅          |         |                 |
| Inventory Issue (FR-9)                | ✅          |         |                 |
| Inventory Alerts (FR-10)              | ✅          |         |                 |
| Requisition & Approval (FR-11)        | ✅          |         |                 |
| Transaction History (FR-12)           | ✅          |         |                 |
| Maintenance Scheduling (FR-13)        | ✅          |         |                 |
| Maintenance Execution (FR-14)         | ✅          |         |                 |
| Failure Reporting (FR-15)             | ✅          |         |                 |
| Maintenance Analytics (FR-16)         | ✅          |         |                 |
| Quality Inspection (FR-17)            | ✅          |         |                 |
| Quality Standards (FR-18)             | ✅          |         |                 |
| Quality Reporting (FR-19)             | ✅          |         |                 |
| Workforce & Attendance (FR-20)        | ✅          |         |                 |
| Employee Self-Service (FR-21)         | ✅          |         |                 |
| HR Approval & Analytics (FR-22)       | ✅          |         |                 |
| HR Administration (FR-23)             | ✅          |         |                 |

## Detailed Gaps

### Recently Implemented

- [FR-1] Authentication and Authorization
  - Users can log in with valid credentials, tokens are revoked on logout via Redis blocklisting, verification is enforced against stored tokens, `/auth/me` is protected by JWT auth, and the frontend middleware validates role access per route prefix.
  - Evidence: [`backend/src/auth/auth.service.ts`](backend/src/auth/auth.service.ts), [`backend/src/auth/auth.controller.ts`](backend/src/auth/auth.controller.ts), [`backend/src/auth/jwt.strategy.ts`](backend/src/auth/jwt.strategy.ts), [`frontend/middleware.ts`](frontend/middleware.ts), [`frontend/app/unauthorized/page.tsx`](frontend/app/unauthorized/page.tsx)

- [FR-2] Production Order Management
  - Production service is now active again with BOM-aware create, supervisor-scoped listing, and status transition validation.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts)

- [FR-4] Production Workflow Control
  - Stage sequencing is enforced in the authoritative production service, and later stages cannot progress until the previous stage is QA approved.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`backend/src/production/guards/stage-sequence.guard.ts`](backend/src/production/guards/stage-sequence.guard.ts)

- [FR-5] QA Enforcement and Review Flow
  - QA staff can submit stage inspections, QA managers can approve or reject them, and stage completion is blocked until an approved QA inspection exists.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`frontend/components/dashboards/QAStaffDashboard.tsx`](frontend/components/dashboards/QAStaffDashboard.tsx), [`frontend/components/dashboards/QAManagerDashboard.tsx`](frontend/components/dashboards/QAManagerDashboard.tsx), [`frontend/app/production/qa/page.tsx`](frontend/app/production/qa/page.tsx)

- [FR-6] Production Output and Issue Reporting
  - Output and issue recording now feed dedicated shift-based and stage-based reporting endpoints, along with issue classification summaries.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

- [FR-7] Production Monitoring
  - The production manager dashboard now consumes the monitoring summary API, shows progress percentages, and highlights stopped orders alongside production performance reporting.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`frontend/components/dashboards/ProductionManagerDashboard.tsx`](frontend/components/dashboards/ProductionManagerDashboard.tsx)

- [FR-11] Inventory Requisition and Approval
  - Supervisors, managers, maintenance staff, and production roles can submit requisitions, managers/admin can approve or reject, and the form shows live availability before submission.
  - Evidence: [`backend/src/inventory/requisition.service.ts`](backend/src/inventory/requisition.service.ts), [`backend/src/inventory/inventory.controller.ts`](backend/src/inventory/inventory.controller.ts), [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma), [`frontend/app/dashboard/inventory/requisitions/page.tsx`](frontend/app/dashboard/inventory/requisitions/page.tsx)

- [FR-13] Maintenance Scheduling and Planning
  - Maintenance managers can create preventive tasks with scheduled dates, review an upcoming planning calendar, and create spare-part requisitions that tie back to a specific maintenance task.
  - Evidence: [`backend/src/maintenance/maintenance.service.ts`](backend/src/maintenance/maintenance.service.ts), [`backend/src/maintenance/maintenance.controller.ts`](backend/src/maintenance/maintenance.controller.ts), [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma), [`frontend/app/(dashboard)/maintenance/page.tsx`](<frontend/app/(dashboard)/maintenance/page.tsx>), [`frontend/lib/api/maintenance.ts`](frontend/lib/api/maintenance.ts)

- [FR-15] Equipment Failure Reporting
  - Failure reports create corrective maintenance tasks, persist failure records, and send urgent unread notifications to maintenance managers, technicians, and admins.
  - Evidence: [`backend/src/maintenance/maintenance.service.ts`](backend/src/maintenance/maintenance.service.ts), [`backend/src/maintenance/maintenance.controller.ts`](backend/src/maintenance/maintenance.controller.ts), [`backend/src/notifications/notifications.service.ts`](backend/src/notifications/notifications.service.ts), [`backend/src/notifications/notifications.controller.ts`](backend/src/notifications/notifications.controller.ts), [`frontend/components/notifications/UnreadNotificationsPanel.tsx`](frontend/components/notifications/UnreadNotificationsPanel.tsx)

- [FR-17] Quality Inspection Management
  - Inspection records capture measurements, defects, and results, auto-reject when defect rates exceed the active threshold, and QA managers can approve or reject the record through the review UI.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma), [`frontend/components/production/QAReviewPanel.tsx`](frontend/components/production/QAReviewPanel.tsx)

- [FR-18] Quality Standards and Approval
  - QA managers can maintain stage thresholds, inspections are evaluated against active thresholds, and completed QA-approved orders can be released to finished goods through the manager dashboard.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`frontend/components/dashboards/QAManagerDashboard.tsx`](frontend/components/dashboards/QAManagerDashboard.tsx), [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

- [FR-19] Quality Reporting and Analysis
  - The backend now generates quality KPIs, defect trend data, top defect categories, and stage breakdowns, and the QA manager dashboard renders those analytics.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`frontend/components/dashboards/QAManagerDashboard.tsx`](frontend/components/dashboards/QAManagerDashboard.tsx)

- [FR-3] Material Availability
  - Material availability checks now return specific missing items and are applied to create/approve paths.
  - Evidence: [`backend/src/production/guards/material-availability.guard.ts`](backend/src/production/guards/material-availability.guard.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts)

- [FR-7] Production Monitoring
  - Monitoring summary endpoint is now available for dashboard consumption.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`frontend/components/dashboards/ProductionManagerDashboard.tsx`](frontend/components/dashboards/ProductionManagerDashboard.tsx)

- [FR-11] Inventory Requisition and Approval
  - Requisition model, submission, manager approval/rejection, and stock deduction flow are now in place.
  - Evidence: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma), [`backend/src/inventory/requisition.service.ts`](backend/src/inventory/requisition.service.ts), [`backend/src/inventory/inventory.controller.ts`](backend/src/inventory/inventory.controller.ts), [`frontend/app/dashboard/inventory/requisitions/page.tsx`](frontend/app/dashboard/inventory/requisitions/page.tsx)

- [FR-15] Equipment Failure Reporting
  - Failure reports now generate unread notifications for maintenance managers and technicians, with urgency flagged for critical priorities.
  - Evidence: [`backend/src/maintenance/maintenance.service.ts`](backend/src/maintenance/maintenance.service.ts), [`backend/src/notifications/notifications.service.ts`](backend/src/notifications/notifications.service.ts), [`backend/src/notifications/notifications.controller.ts`](backend/src/notifications/notifications.controller.ts)

- [FR-5] QA Enforcement and Review Flow
  - QA staff can submit stage inspections for review, QA managers can approve/reject from the dashboard, and QA review notifications are generated.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`frontend/components/dashboards/QAStaffDashboard.tsx`](frontend/components/dashboards/QAStaffDashboard.tsx), [`frontend/components/dashboards/QAManagerDashboard.tsx`](frontend/components/dashboards/QAManagerDashboard.tsx), [`frontend/app/production/qa/page.tsx`](frontend/app/production/qa/page.tsx)

- [FR-1] Authentication and Authorization UI
  - Storekeeper and admin dashboards now display unread production/inventory notifications.
  - Evidence: [`frontend/components/notifications/UnreadNotificationsPanel.tsx`](frontend/components/notifications/UnreadNotificationsPanel.tsx), [`frontend/components/dashboards/StorekeeperDashboard.tsx`](frontend/components/dashboards/StorekeeperDashboard.tsx), [`frontend/components/dashboards/AdminDashboard.tsx`](frontend/components/dashboards/AdminDashboard.tsx)

- [FR-18] Production Release and Reporting
  - Final product release, production performance reporting, and quality reporting endpoints are now available.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts)

- [FR-23] Workforce Form Type Safety
  - Workforce admin forms now use the current React Query v5 mutation/query API and no longer fail the frontend typecheck.
  - Evidence: [`frontend/components/workforce/AdminCreateDepartmentForm.tsx`](frontend/components/workforce/AdminCreateDepartmentForm.tsx), [`frontend/components/workforce/AdminCreateShiftForm.tsx`](frontend/components/workforce/AdminCreateShiftForm.tsx), [`frontend/components/workforce/AdminCreateTeamForm.tsx`](frontend/components/workforce/AdminCreateTeamForm.tsx), [`frontend/components/workforce/AdminCreateWorkerForm.tsx`](frontend/components/workforce/AdminCreateWorkerForm.tsx), [`frontend/components/workforce/AttendanceSupervisor.tsx`](frontend/components/workforce/AttendanceSupervisor.tsx), [`frontend/hooks/useAttendance.ts`](frontend/hooks/useAttendance.ts)

- [FR-1] Notifications Center UI
  - A dedicated notifications page now exists for admins and storekeepers.
  - Evidence: [`frontend/app/dashboard/notifications/page.tsx`](frontend/app/dashboard/notifications/page.tsx), [`frontend/components/notifications/UnreadNotificationsPanel.tsx`](frontend/components/notifications/UnreadNotificationsPanel.tsx)

### ⚠️ Partially Implemented Features

- [FR-21] Employee Self-Service
  - What exists: attendance lookup, leave request endpoints, shifts endpoints, training materials and user profile update endpoints.
  - Implemented: worker-facing pages and API integration for viewing upcoming shifts, browsing training materials, and editing personal profile. A navbar account menu (profile + logout) and client-side photo upload have been added.
  - Limitations (why Partial): profile photos are stored on the server filesystem under `frontend/public/profile-pics/` (not persisted in the database), which means the solution is suitable for single-server deployments but not ideal for multi-instance/replicated setups or CDNs. There is no database column for profile pictures and no dedicated CDN or S3 integration yet. Access control is limited to existing JWT role checks; no additional privacy/consent workflows are implemented.
  - Evidence: backend endpoints [`backend/src/workforce/shifts/shifts.controller.ts`](backend/src/workforce/shifts/shifts.controller.ts), [`backend/src/training/training.controller.ts`](backend/src/training/training.controller.ts), [`backend/src/users/users.controller.ts`](backend/src/users/users.controller.ts) (new `POST /users/me/photo`); frontend pages/components [`frontend/app/worker/shifts/page.tsx`](frontend/app/worker/shifts/page.tsx), [`frontend/app/worker/training/page.tsx`](frontend/app/worker/training/page.tsx), [`frontend/app/employee/profile/page.tsx`](frontend/app/employee/profile/page.tsx), [`frontend/components/workforce/WorkerProfile.tsx`](frontend/components/workforce/WorkerProfile.tsx), [`frontend/components/layout/Navbar.tsx`](frontend/components/layout/Navbar.tsx)

### ❌ Not Implemented Features

- [FR-8] Inventory Receipt Management
  - No dedicated receipt workflow for supplier name, batch/lot number, purchase date, and automatic stock receipt tracking was found.
  - Suggested location to implement: `backend/src/inventory/*` plus an inventory receipt form in `frontend/components/modules/inventory/*`.

- [FR-9] Inventory Issue and Deduction for Production/Maintenance Requests
  - Stock issue exists, but there is no workflow that links issued raw materials to approved production orders, and spare-part issues are not constrained by a requisition approval flow.
  - Suggested location to implement: `backend/src/inventory/inventory.service.ts` and `backend/src/production/*`, `backend/src/maintenance/*`.

- [FR-10] Inventory Monitoring and Alerts
  - Low-stock alert computation exists, but there is no continuous alerting channel, valuation report, aging report, or consumption analysis.
  - Suggested location to implement: `backend/src/inventory/inventory.service.ts` and a dashboard/report module.

- [FR-12] Inventory Transaction History
  - Transaction history is present, but a complete audit trail with receipt/issue/return lifecycle and return handling is not fully implemented.
  - Suggested location to implement: `backend/src/inventory/inventory.service.ts` and inventory transaction UI.

- [FR-14] Maintenance Execution and Reporting
  - Technicians can complete tasks, but there is no dedicated execution report that captures richer task analytics beyond stored task completion data.
  - Suggested location to implement: `backend/src/maintenance/maintenance.service.ts`.

- [FR-16] Maintenance Analytics and Reports
  - Current analytics only cover totals, by-status, by-type, by-priority, and average completion time; MTTR, MTBF, downtime, and cost analysis are not implemented.
  - Suggested location to implement: `backend/src/maintenance/maintenance.service.ts`.

- [FR-20] Workforce and Attendance Management
  - Attendance recording exists, but shift assignment to workers and full shift schedule management are incomplete.
  - Suggested location to implement: `backend/src/workforce/shifts/*` and `backend/src/workforce/staffing/*`.

- [FR-22] HR Approval and Workforce Analytics
  - Leave approval and workforce analytics exist, but overtime approval and hiring requisition workflows are stubbed or incomplete.
  - Suggested location to implement: `backend/src/workforce/overtime/*` and `backend/src/workforce/hiring/*`.

- [FR-23] HR Administration and Policy Management
  - Worker master records exist, but configurable attendance policy and permission administration are not present in the active source.
  - Suggested location to implement: `backend/src/workforce/*` and `backend/src/users/*`.

## Gap Analysis & Recommendations

### Critical Gaps

1. No open critical gaps remain after the latest FR-1, FR-2, FR-3, FR-4, and FR-5 updates.

### High Priority Gaps

1. Implement requisition/approval flows for inventory and maintenance spare parts.
2. Add production, QA, and maintenance reporting endpoints for KPIs and trend analysis.
3. Add worker self-service features for shifts, profile updates, and training access.

### Lower Priority / Nice-to-Have

1. Add richer inventory valuation and aging reports.
2. Add better notification delivery for failure reports and low-stock alerts.
3. Add finalized release workflows for QA-approved production orders.

### Suggested Next Development Sprints

- Sprint 1: Production workflow completion, material validation, QA gating, and supervisor-scoped order views.
- Sprint 2: Inventory requisitions, receipt management, and maintenance spare-part approval flows.
- Sprint 3: Workforce self-service, overtime/hiring, and reporting dashboards across production, maintenance, and QA.
