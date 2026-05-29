"use client";
import React from "react";
import { useAuth } from "@/context/auth-context";
import { useTeamAttendance, usePostAttendance } from "@/hooks/useAttendance";
import { useWorkers } from "@/hooks/useWorkers";

export default function AttendanceSupervisor({ teamId }: { teamId?: string }) {
  const { user } = useAuth();
  const { data: attendanceData, isLoading, isError } = useTeamAttendance(teamId);
  const post = usePostAttendance();
  const { data: workers } = useWorkers();

  const todayStr = new Date().toISOString().split("T")[0];

  // Build a map of attendance by workerId for today's date
  const attendanceByWorker: Record<string, any> = {};
  (attendanceData || []).forEach((a: any) => {
    if (!a || !a.workerId) return;
    attendanceByWorker[a.workerId] = a;
  });

  if (!teamId) return <div className="p-4">No team selected</div>;
  if (isLoading) return <div className="p-4">Loading attendance...</div>;
  if (isError) return <div className="p-4 text-rose-600">Failed to load attendance</div>;

  const teamWorkers = (workers || []).filter(
    (w: any) => !teamId || (w.team && w.team.id === teamId),
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Date</div>
          <div className="font-bold">{todayStr}</div>
        </div>
      </div>

      {teamWorkers.map((w: any) => {
        const att = attendanceByWorker[w.id];
        const checkIn = att?.checkIn ? new Date(att.checkIn).toLocaleTimeString() : null;
        const checkOut = att?.checkOut ? new Date(att.checkOut).toLocaleTimeString() : null;
        return (
          <div key={w.id} className="flex items-center justify-between rounded border p-3">
            <div>
              <div className="font-bold">{w.name ?? w.user?.username ?? w.employeeId}</div>
              <div className="text-sm text-slate-500">{w.position}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                {checkIn ? <div>In: {checkIn}</div> : <div className="text-xs text-slate-400">Not checked in</div>}
                {checkOut ? <div>Out: {checkOut}</div> : null}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost"
                  disabled={Boolean(checkIn) || post.isLoading}
                  onClick={() =>
                    post.mutate({
                      workerId: w.id,
                      date: todayStr,
                      checkIn: new Date().toISOString(),
                    })
                  }
                >
                  Check-in
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={!checkIn || Boolean(checkOut) || post.isLoading}
                  onClick={() =>
                    post.mutate({
                      workerId: w.id,
                      date: todayStr,
                      checkOut: new Date().toISOString(),
                    })
                  }
                >
                  Check-out
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
