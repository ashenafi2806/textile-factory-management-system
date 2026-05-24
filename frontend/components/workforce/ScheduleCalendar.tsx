"use client";
import React from "react";
import { useTeamSchedule } from "@/hooks/useSchedule";

export default function ScheduleCalendar({ teamId }: { teamId?: string }) {
  const { data, isLoading, isError } = useTeamSchedule(teamId);

  if (!teamId) return <div className="p-4">No team selected</div>;
  if (isLoading) return <div className="p-4">Loading schedule...</div>;
  if (isError)
    return <div className="p-4 text-rose-600">Failed to load schedule</div>;

  // Minimal weekly view: show days as columns and shifts per worker
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="overflow-auto border rounded">
      <div className="grid grid-cols-8">
        <div className="p-2 bg-slate-50">Worker</div>
        {days.map((d) => (
          <div key={d} className="p-2 text-center bg-slate-50">
            {d}
          </div>
        ))}
      </div>
      <div>
        {data?.map((row: any) => (
          <div key={row.workerId} className="grid grid-cols-8 border-t">
            <div className="p-2">{row.workerName}</div>
            {days.map((d) => (
              <div key={d} className="p-2 text-sm">
                {(row.shifts || []).find((s: any) => s.day === d)?.label || "-"}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
