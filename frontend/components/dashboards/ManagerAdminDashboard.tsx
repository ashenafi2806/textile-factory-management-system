"use client";
import React from "react";
import WorkersTable from "@/components/workforce/WorkersTable";
import LeavesTabs from "@/components/workforce/LeavesTabs";
import OvertimeApprovals from "@/components/workforce/OvertimeApprovals";
import HiringRequisitions from "@/components/workforce/HiringRequisitions";
import StaffingDashboard from "@/components/workforce/StaffingDashboard";

export default function ManagerAdminDashboard() {
  return (
    <div className="space-y-4">
      <header className="px-0">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
          Manager Workspace
        </h2>
        <p className="font-medium text-slate-500 mt-1">
          Workforce analytics, approvals, and staffing.
        </p>
      </header>

      <section className="grid gap-3 md:gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="card p-3 md:p-4 shadow-sm">
            <h3 className="font-bold mb-3">Workers</h3>
            <WorkersTable />
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-3 md:p-4 shadow-sm">
            <h3 className="font-bold mb-3">Staffing</h3>
            <StaffingDashboard />
          </div>
          <div className="card p-3 md:p-4 shadow-sm">
            <h3 className="font-bold mb-3">Approvals (Overtime)</h3>
            <OvertimeApprovals />
          </div>
        </div>
      </section>
      <section className="grid gap-3 md:gap-4 md:grid-cols-2">
        <div className="card p-3 md:p-4 shadow-sm">
          <h3 className="font-bold mb-3">Leave Approvals</h3>
          <LeavesTabs />
        </div>

        <div className="card p-3 md:p-4 shadow-sm">
          <h3 className="font-bold mb-3">Hiring Requisitions</h3>
          <HiringRequisitions />
        </div>
      </section>
    </div>
  );
}
