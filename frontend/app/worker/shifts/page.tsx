"use client";
import React, { useEffect, useState } from "react";
import workforceService from "@/services/workforceService";

export default function Page() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workforceService
      .getMyShifts()
      .then((r: any) => setShifts(r.data || []))
      .catch((e) => console.error("Failed to load shifts", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading shifts...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Upcoming Shifts</h2>
      {shifts.length === 0 ? (
        <div>No upcoming shifts found.</div>
      ) : (
        <ul className="space-y-3">
          {shifts.map((s) => (
            <li key={s.id} className="p-3 border rounded">
              <div className="font-medium">{s.name || "Shift"}</div>
              <div className="text-sm text-slate-600">
                {new Date(s.start).toLocaleString()} -{" "}
                {new Date(s.end).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
