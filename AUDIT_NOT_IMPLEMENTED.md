# Factory Management System Audit: Not Implemented / Partial Gaps

This audit was produced by scanning the backend NestJS source, Prisma schema, and the Next.js frontend source.

## Audit Summary

| Module | Implemented | Partial | Not Implemented |
|--------|-------------|---------|-----------------|
| Authentication & Authorization (FR-1) |  | ✅ |  |
| Production Order Management (FR-2) |  | ✅ |  |
| Material Availability (FR-3) |  | ✅ |  |
| Production Workflow (FR-4) |  | ✅ |  |
| QA Enforcement (FR-5) |  | ✅ |  |
| Output & Issue Reporting (FR-6) |  | ✅ |  |
| Production Monitoring (FR-7) |  | ✅ |  |
| Inventory Receipt (FR-8) | ✅ |  |  |
| Inventory Issue (FR-9) | ✅ |  |  |
| Inventory Alerts (FR-10) | ✅ |  |  |
| Requisition & Approval (FR-11) |  | ✅ |  |
| Transaction History (FR-12) | ✅ |  |  |
| Maintenance Scheduling (FR-13) |  | ✅ |  |
| Maintenance Execution (FR-14) | ✅ |  |  |
| Failure Reporting (FR-15) |  | ✅ |  |
| Maintenance Analytics (FR-16) | ✅ |  |  |
| Quality Inspection (FR-17) |  | ✅ |  |
| Quality Standards (FR-18) |  | ✅ |  |
| Quality Reporting (FR-19) |  | ✅ |  |
| Workforce & Attendance (FR-20) | ✅ |  |  |
| Employee Self-Service (FR-21) |  | ✅ |  |
| HR Approval & Analytics (FR-22) | ✅ |  |  |
| HR Administration (FR-23) | ✅ |  |  |

## Detailed Gaps

### Recently Implemented

- [FR-2] Production Order Management
  - Production service is now active again with BOM-aware create, supervisor-scoped listing, and status transition validation.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts)

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

- [FR-1] Authentication & Authorization
  - What exists: login, JWT cookie session, `/auth/me`, role guards, and RBAC decorators.
  - What is missing: account verification is stubbed, logout only clears the cookie and does not revoke Redis session, and frontend route guarding only checks cookie presence rather than validating role-specific access.
  - Evidence: [`backend/src/auth/auth.controller.ts`](backend/src/auth/auth.controller.ts#L19), [`backend/src/auth/auth.service.ts`](backend/src/auth/auth.service.ts), [`frontend/middleware.ts`](frontend/middleware.ts#L4)

- [FR-2] Production Order Management
  - What exists: production order create/update/cancel/assign endpoints and order-stage creation.
  - What is missing: the main production service is fully commented out, so the richer order lifecycle, BOM handling, and supervisor-scoped list logic shown there are not active. The active controller also does not enforce material approval before create/update.
  - Evidence: [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts#L6), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`backend/src/production/orders.service.ts`](backend/src/production/orders.service.ts)

- [FR-3] Material Availability
  - What exists: a material check route and a guard placeholder.
  - What is missing: no active service logic blocks order creation/approval when materials are insufficient, and the active order creation flow does not include BOM validation.
  - Evidence: [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`backend/src/production/guards/material-availability.guard.ts`](backend/src/production/guards/material-availability.guard.ts), [`backend/src/production/orders.service.ts`](backend/src/production/orders.service.ts)

- [FR-4] Production Workflow Control
  - What exists: endpoints for start/stop/resume/complete stage actions.
  - What is missing: stage sequence enforcement is not visible in the active service implementation, and the active stage service only updates status without enforcing sequential progression or stage dependency checks.
  - Evidence: [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`backend/src/production/stages.service.ts`](backend/src/production/stages.service.ts)

- [FR-5] Stage-wise QA Enforcement
  - What exists: QA review routes, inspection routes, QA-related schema tables.
  - What is missing: the active production service does not show stage-gated QA approval logic; the commented service contains the intended behavior, but it is not running.
  - Evidence: [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`backend/src/production/production.service.ts`](backend/src/production/production.service.ts#L6), [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

- [FR-6] Production Output and Issue Reporting
  - What exists: output and issue endpoints and persistence tables.
  - What is missing: output recording is present, but richer shift-based reporting, issue classification workflows, and cross-stage reporting logic are not fully wired through the active service.
  - Evidence: [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`backend/src/production/stages.service.ts`](backend/src/production/stages.service.ts), [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

- [FR-7] Production Monitoring and Reporting
  - What exists: order listing and output history endpoints.
  - What is missing: no dedicated real-time monitoring dashboard API, no explicit progress percentage calculation in the active service, and no production performance report generator is implemented in the active backend source.
  - Evidence: [`backend/src/production/orders.service.ts`](backend/src/production/orders.service.ts), [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts)

- [FR-11] Inventory Requisition and Approval
  - What exists: inventory issue/stock adjustment endpoints and maintenance spare-part usage tracking.
  - What is missing: there is no dedicated requisition model or approval workflow for supervisors/managers/maintenance staff, and no real-time availability check during requisition submission.
  - Evidence: [`backend/src/inventory/inventory.controller.ts`](backend/src/inventory/inventory.controller.ts), [`backend/src/maintenance/maintenance.service.ts`](backend/src/maintenance/maintenance.service.ts), [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

- [FR-13] Maintenance Scheduling and Planning
  - What exists: preventive vs corrective task types and scheduledDate field.
  - What is missing: no explicit planning calendar, no dedicated preventive maintenance scheduling workflow, and no approval workflow for spare-part requisitions tied to maintenance planning.
  - Evidence: [`backend/src/maintenance/maintenance.service.ts`](backend/src/maintenance/maintenance.service.ts), [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

- [FR-15] Equipment Failure Reporting
  - What exists: failure report endpoint and failure report persistence.
  - What is missing: there is no notification delivery implementation visible for immediate maintenance-team alerting, and priority handling is only stored, not connected to a notification or escalation workflow.
  - Evidence: [`backend/src/maintenance/maintenance.controller.ts`](backend/src/maintenance/maintenance.controller.ts), [`backend/src/maintenance/maintenance.service.ts`](backend/src/maintenance/maintenance.service.ts)

- [FR-17] Quality Inspection Management
  - What exists: inspection endpoints, quality inspection table, QA review UI.
  - What is missing: inspection measurements/defects/results are stored, but the active backend does not enforce non-conformance rejection rules or a full stage-by-stage inspection workflow.
  - Evidence: [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma), [`frontend/components/production/QAReviewPanel.tsx`](frontend/components/production/QAReviewPanel.tsx)

- [FR-18] Quality Standards and Approval
  - What exists: quality thresholds model and threshold endpoints.
  - What is missing: standards are stored, but the active production flow does not clearly apply them to every inspection, and final product release approval is not implemented as a dedicated release workflow.
  - Evidence: [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

- [FR-19] Quality Reporting and Analysis
  - What exists: inspection listing endpoints and QA dashboard pages.
  - What is missing: there is no backend quality KPI/report generator or defect trend analysis service in the active code.
  - Evidence: [`backend/src/production/production.controller.ts`](backend/src/production/production.controller.ts), [`frontend/app/dashboard/qa-manager/page.tsx`](frontend/app/dashboard/qa-manager/page.tsx)

- [FR-21] Employee Self-Service
  - What exists: attendance lookup and leave request endpoints.
  - What is missing: worker-facing shift viewing, training materials, and personal profile self-update flows are not implemented in the active backend source.
  - Evidence: [`backend/src/workforce/attendance/attendance.controller.ts`](backend/src/workforce/attendance/attendance.controller.ts), [`backend/src/workforce/leave/leave.controller.ts`](backend/src/workforce/leave/leave.controller.ts), [`backend/src/users/users.controller.ts`](backend/src/users/users.controller.ts)

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
1. Reactivate and finish the production workflow service so order lifecycle, stage sequencing, and QA gating run from one authoritative backend path.
2. Add real material validation before production order approval or stage start.
3. Replace stubbed auth verification and session revocation with a real verification flow and consistent server-side session invalidation.

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
