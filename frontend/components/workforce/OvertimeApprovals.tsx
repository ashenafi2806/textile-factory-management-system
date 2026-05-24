"use client";
import React from "react";
import { usePendingOvertime, useApproveOvertime } from "@/hooks/useOvertime";
import { useAuth } from "@/context/auth-context";

export default function OvertimeApprovals() {
  const { user } = useAuth();
  const pending = usePendingOvertime();
  const approve = useApproveOvertime();

  const isManager =
    user?.roles?.includes("MANAGER") || user?.roles?.includes("HR_ADMIN");

  if (pending.isLoading) return <div>Loading overtime...</div>;
  if (pending.isError)
    return <div className="text-rose-600">Failed to load overtime</div>;

  return (
    <div className="space-y-2">
      {pending.data?.map((o: any) => (
        <div
          key={o.id}
          className="rounded border p-3 flex justify-between items-center"
        >
          <div>
            <div className="font-bold">{o.workerName}</div>
            <div className="text-sm text-slate-500">
              {o.date} • {o.hours} hrs • {o.reason}
            </div>
          </div>
          <div>
            {isManager ? (
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => approve.mutate(o.id)}
              >
                Approve
              </button>
            ) : (
              <div className="text-sm text-slate-400">Awaiting manager</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
