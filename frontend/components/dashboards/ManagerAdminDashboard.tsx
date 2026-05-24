"use client";
import React from "react";
import WorkersTable from "@/components/workforce/WorkersTable";
import LeavesTabs from "@/components/workforce/LeavesTabs";
import OvertimeApprovals from "@/components/workforce/OvertimeApprovals";
import HiringRequisitions from "@/components/workforce/HiringRequisitions";
import StaffingDashboard from "@/components/workforce/StaffingDashboard";

export default function ManagerAdminDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          Manager Workspace
        </h2>
        <p className="font-medium text-slate-500">
          Workforce analytics, approvals, and staffing.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="col-span-2">
          <div className="rounded border bg-white p-4">
            <h3 className="font-bold mb-2">Workers</h3>
            <WorkersTable />
          </div>
        </div>
        <div>
          <div className="rounded border bg-white p-4 mb-4">
            <h3 className="font-bold mb-2">Staffing</h3>
            <StaffingDashboard />
          </div>
          <div className="rounded border bg-white p-4">
            <h3 className="font-bold mb-2">Approvals (Overtime)</h3>
            <OvertimeApprovals />
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <h3 className="font-bold mb-2">Leave Approvals</h3>
          <LeavesTabs />
        </div>

        <div className="rounded border bg-white p-4">
          <h3 className="font-bold mb-2">Hiring Requisitions</h3>
          <HiringRequisitions />
        </div>
      </section>
    </div>
  );
}
