"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import AttendanceSupervisor from "@/components/workforce/AttendanceSupervisor";
import { useAuth } from "@/context/auth-context";

export default function AttendanceLogging() {
  const { user } = useAuth();
  const teamId = (user as any)?.team?.id ?? undefined;

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
            <AttendanceSupervisor teamId={teamId} />
          </div>
        </div>
      </div>
    </>
  );
}
