"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import AttendanceSupervisor from "@/components/workforce/AttendanceSupervisor";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function SupervisorAttendancePage() {
  const { user } = useAuth();

  if (
    !user ||
    (!user.roles.includes("SUPERVISOR") &&
      !user.roles.includes("ADMIN") &&
      !user.roles.includes("HR_ADMIN"))
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Access denied.</p>
      </div>
    );
  }

  const department = (user as any)?.workerProfile?.department ?? undefined;
  const isAdmin =
    user.roles.includes("ADMIN") || user.roles.includes("HR_ADMIN");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10 pt-20">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">
              Supervisor
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">
              Daily Attendance
            </h1>
            <p className="mt-2 text-slate-500">
              Mark present, late, absent, or on leave. Times default from each
              worker&apos;s assigned shift.
            </p>
          </div>
          {isAdmin ? (
            <Link
              href="/admin/attendance/report"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              View report
            </Link>
          ) : null}
        </header>
        <AttendanceSupervisor department={department} />
      </main>
    </div>
  );
}
