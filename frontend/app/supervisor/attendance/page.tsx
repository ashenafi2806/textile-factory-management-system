"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import AttendanceSupervisor from "@/components/workforce/AttendanceSupervisor";
import { useAuth } from "@/context/auth-context";

export default function AttendanceLogging() {
  const { user } = useAuth();
  if (
    !user ||
    (!user.roles.includes("SUPERVISOR") && !user.roles.includes("ADMIN") && !user.roles.includes("HR_ADMIN"))
  ) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        <p className="mt-2 text-slate-600">
          Only Supervisors and Admins can access this page.
        </p>
      </div>
    );
  }

  const department = (user as any)?.workerProfile?.department ?? undefined;

  return (
    <>
      <Navbar />
      <div className="p-8 bg-slate-50 min-h-screen pt-12">
        <div className="max-w-5xl mx-auto">
          <header className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Supervisor Dashboard
            </h1>
            <p className="text-slate-500 mt-2">Daily Attendance Logging</p>
          </header>

          <div className="card p-4">
            <AttendanceSupervisor department={department} />
          </div>
        </div>
      </div>
    </>
  );
}
