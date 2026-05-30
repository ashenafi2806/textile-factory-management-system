"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import workforceService from "@/services/workforceService";
import { useAuth } from "@/context/auth-context";

export default function ShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    workforceService
      .getShifts()
      .then((res) => setShifts(res.data || res))
      .catch(() => {});
  }, []);

  const loadAssignments = (id?: string) => {
    const wid = id ?? workerId;
    if (!wid) return;
    workforceService
      .getWorkerAssignments(wid)
      .then((res) => setAssignments(res.data || res))
      .catch(() => {});
  };

  const handleAssign = async () => {
    if (!workerId || !shiftId || !date) return;
    try {
      await workforceService.assignShift({ workerId, shiftId, date });
      loadAssignments();
      setDate("");
    } catch (e) {
      // ignore
    }
  };

  const handleUnassign = async (id: string) => {
    try {
      await workforceService.unassignShift(id);
      setAssignments((a) => a.filter((x) => x.id !== id));
    } catch (e) {}
  };

  if (!user) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-2xl font-black">Shift Management</h1>

        <section className="mt-6 rounded-3xl border bg-white p-6">
          <h2 className="font-bold">Create Assignment</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              placeholder="Worker Profile ID"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="rounded-md border px-3 py-2"
            />
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="rounded-md border px-3 py-2"
            >
              <option value="">Select shift</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border px-3 py-2"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadAssignments()}
                className="rounded bg-slate-800 px-4 py-2 text-white"
              >
                Load
              </button>
              <button
                onClick={handleAssign}
                className="rounded bg-amber-500 px-4 py-2 text-white"
              >
                Assign
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border bg-white p-6">
          <h2 className="font-bold">Assignments</h2>
          <div className="mt-4 space-y-3">
            {assignments.length === 0 ? (
              <div className="text-sm text-slate-500">No assignments</div>
            ) : (
              assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div>
                    <div className="font-semibold">{a.shift?.name}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(a.date).toLocaleDateString()} —{" "}
                      {a.shift?.startTime} - {a.shift?.endTime}
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => handleUnassign(a.id)}
                      className="rounded bg-rose-500 px-3 py-1 text-white"
                    >
                      Unassign
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
