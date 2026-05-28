"use client";
import React from "react";
import ScheduleCalendar from "@/components/workforce/ScheduleCalendar";
import { useAuth } from "@/context/auth-context";

export default function SchedulePage() {
  const { user } = useAuth();
  const teamId = (user as any)?.team?.id || user?.id;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Schedule</h1>
      <div className="card p-4">
        <ScheduleCalendar teamId={teamId} />
      </div>
    </div>
  );
}
