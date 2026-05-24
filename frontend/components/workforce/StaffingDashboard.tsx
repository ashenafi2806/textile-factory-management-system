"use client";
import React from "react";
import { useStaffingDashboard } from "@/hooks/useStaffing";

export default function StaffingDashboard() {
  const { data, isLoading, isError } = useStaffingDashboard();

  if (isLoading)
    return <div className="p-4">Loading staffing dashboard...</div>;
  if (isError)
    return (
      <div className="p-4 text-rose-600">Failed to load staffing data</div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded border p-4">
        <div className="text-sm text-slate-500">Headcount</div>
        <div className="text-2xl font-bold">{data?.headcount ?? "-"}</div>
      </div>

      <div className="rounded border p-4">
        <div className="text-sm text-slate-500">Staffing Gaps</div>
        <div className="text-2xl font-bold text-rose-600">
          {data?.gaps ?? 0}
        </div>
        <ul className="mt-2 text-sm">
          {(data?.gapDetails || []).map((g: any) => (
            <li key={g.role}>
              {g.role}: {g.holes}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded border p-4">
        <div className="text-sm text-slate-500">Hiring Recommendations</div>
        <ul className="mt-2 text-sm">
          {(data?.recommendations || []).map((r: any, i: number) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
