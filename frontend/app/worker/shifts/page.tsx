"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Clock, Moon, Sun } from "lucide-react";
import workforceService from "@/services/workforceService";

type WorkerShift = {
  assignmentId: string;
  shiftId: string;
  name: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  description?: string | null;
};

export default function WorkerShiftsPage() {
  const [shifts, setShifts] = useState<WorkerShift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workforceService
      .getMyShifts(60)
      .then((r: any) => setShifts(r.data || []))
      .catch((e) => console.error("Failed to load shifts", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h2 className="text-2xl font-black text-slate-900">My Shifts</h2>
      <p className="mt-1 text-slate-500">
        Your assigned shift periods from the workforce schedule.
      </p>

      {shifts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-600">No shifts assigned</p>
          <p className="text-sm text-slate-500">
            Contact your supervisor if you expect a schedule.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {shifts.map((s) => {
            const isNight = parseInt(s.startTime.split(":")[0], 10) >= 18;
            return (
              <li
                key={s.assignmentId}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-xl p-3 ${
                      isNight
                        ? "bg-violet-100 text-violet-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {isNight ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Sun className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
                    {s.description ? (
                      <p className="text-sm text-slate-500">{s.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4 text-indigo-500" />
                        {s.startTime} – {s.endTime}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        {new Date(s.startDate).toLocaleDateString()} –{" "}
                        {new Date(s.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
