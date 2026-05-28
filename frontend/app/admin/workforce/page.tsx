"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import AdminCreateDepartmentForm from "@/components/workforce/AdminCreateDepartmentForm";
import AdminCreateTeamForm from "@/components/workforce/AdminCreateTeamForm";
import AdminCreateWorkerForm from "@/components/workforce/AdminCreateWorkerForm";
import AdminCreateShiftForm from "@/components/workforce/AdminCreateShiftForm";

export default function AdminWorkforcePage() {
  const { user } = useAuth();

  if (!user) return null;
  if (!user.roles.includes("ADMIN") && !user.roles.includes("HR_ADMIN")) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-4 text-slate-600">
            You do not have permission to manage workforce.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">
            Workforce Admin
          </h1>
          <p className="mt-2 text-slate-600">
            Create workers, departments, teams and shifts.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <AdminCreateWorkerForm />
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <AdminCreateDepartmentForm />
            {/* For team creation we need a departmentId - provide simple input inside component call or instruct user to pass id */}
            <div>
              <p className="text-sm text-slate-600">
                To create a team, open the department and use the department ID
                in the Team form below.
              </p>
              {/* placeholder departmentId input example */}
              <AdminCreateTeamForm departmentId={""} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <AdminCreateShiftForm />
          </section>
        </div>
      </div>
    </div>
  );
}
