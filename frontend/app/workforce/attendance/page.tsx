"use client";
import React from "react";
import AttendanceSupervisor from "@/components/workforce/AttendanceSupervisor";
import { useAuth } from "@/context/auth-context";

export default function AttendancePage() {
  const { user } = useAuth();
  const teamId = user?.teamId || user?.id; // fallback

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Attendance</h1>
      <div className="card p-4">
        <AttendanceSupervisor teamId={teamId} />
      </div>
    </div>
  );
}
