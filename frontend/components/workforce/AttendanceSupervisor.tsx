"use client";
import React from "react";
import { useAuth } from "@/context/auth-context";
import { useTeamAttendance, usePostAttendance } from "@/hooks/useAttendance";

export default function AttendanceSupervisor({ teamId }: { teamId?: string }) {
  const { user } = useAuth();
  const { data, isLoading, isError } = useTeamAttendance(teamId);
  const post = usePostAttendance();

  if (!teamId) return <div className="p-4">No team selected</div>;
  if (isLoading) return <div className="p-4">Loading attendance...</div>;
  if (isError)
    return <div className="p-4 text-rose-600">Failed to load attendance</div>;

  return (
    <div className="space-y-3">
      {data?.map((m: any) => (
        <div
          key={m.id}
          className="flex items-center justify-between rounded border p-3"
        >
          <div>
            <div className="font-bold">{m.name}</div>
            <div className="text-sm text-slate-500">{m.position}</div>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost"
              onClick={() =>
                post.mutate({ workerId: m.id, action: "checkin", by: user?.id })
              }
            >
              Check-in
            </button>
            <button
              className="btn btn-ghost"
              onClick={() =>
                post.mutate({
                  workerId: m.id,
                  action: "checkout",
                  by: user?.id,
                })
              }
            >
              Check-out
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
