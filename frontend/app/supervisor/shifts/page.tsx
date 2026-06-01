"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import workforceService from "@/services/workforceService";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useCanPerform } from "@/hooks/useCanPerform";

type Shift = {
  id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  description?: string;
};

type Worker = {
  id: string;
  user?: { username?: string; email?: string };
  fullName?: string | null;
  department?: string | null;
};

type Assignment = {
  id: string;
  workerId: string;
  shiftId: string;
  date: string;
  shift?: Shift;
};

export default function SupervisorShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [department, setDepartment] = useState<string>(
    (user as any)?.workerProfile?.department ?? "",
  );
  const [schedule, setSchedule] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  // assign form state
  const [assignForm, setAssignForm] = useState({
    workerId: "",
    shiftId: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [rotationForm, setRotationForm] = useState<{
    workerId: string;
    pattern: string[];
  }>({ workerId: "", pattern: [] });

  useEffect(() => {
    const load = async () => {
      try {
        const [s, w] = await Promise.all([
          workforceService.getShifts(),
          workforceService.getWorkers(),
        ]);
        setShifts(s.data || []);
        setWorkers(w.data || []);
        if (!department && w.data?.[0]?.department) {
          setDepartment(w.data[0].department);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load shifts/workers");
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    if (!department) return;
    setLoading(true);
    try {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 7);
      const res = await workforceService.getDepartmentSchedule(
        department,
        start.toISOString(),
        end.toISOString(),
      );
      setSchedule(res.data || []);

      // collect assignments from each worker
      const all: Assignment[] = [];
      for (const w of workers) {
        try {
          const a = await workforceService.getWorkerAssignments(
            w.id,
            start.toISOString(),
            end.toISOString(),
          );
          (a.data || []).forEach((x: Assignment) => all.push(x));
        } catch {
          // ignore
        }
      }
      setAssignments(all);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, workers.length]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workforceService.assignShift(assignForm);
      toast.success("Shift assigned");
      setAssignForm({ ...assignForm, workerId: "", shiftId: "" });
      void refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to assign shift");
    }
  };

  const handleUnassign = async (id: string) => {
    if (!confirm("Remove this shift assignment?")) return;
    try {
      await workforceService.unassignShift(id);
      toast.success("Assignment removed");
      void refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove");
    }
  };

  const handleRotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rotationForm.workerId || rotationForm.pattern.length === 0) {
      toast.error("Pick a worker and at least one shift");
      return;
    }
    try {
      await workforceService.updateRotationPattern(
        rotationForm.workerId,
        rotationForm.pattern,
      );
      toast.success("Rotation pattern updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update rotation");
    }
  };

  const togglePattern = (shiftName: string) => {
    setRotationForm((p) => ({
      ...p,
      pattern: p.pattern.includes(shiftName)
        ? p.pattern.filter((s) => s !== shiftName)
        : [...p.pattern, shiftName],
    }));
  };

  const canCreateShift = useCanPerform([
    "SUPERVISOR",
    "ADMIN",
    "HR_ADMIN",
  ]);
  const canAssignWorker = useCanPerform([
    "SUPERVISOR",
    "ADMIN",
    "HR_ADMIN",
  ]);

  const allowed =
    !!user &&
    (user.roles.includes("SUPERVISOR") ||
      user.roles.includes("ADMIN") ||
      user.roles.includes("HR_ADMIN"));

  if (!user) return null;

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
          <p className="mt-2 text-slate-600">
            Only Supervisors, HR Admins, and Admins can manage shifts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-16">
        <div className="max-w-7xl mx-auto space-y-6">
          <header>
            <p className="text-indigo-600 font-black uppercase tracking-[.3em] text-[10px] mb-2">
              Supervisor Workspace
            </p>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">
              Shifts & Rotations
            </h1>
            <p className="text-slate-500 mt-3 max-w-2xl">
              Create shift definitions, assign shifts to workers, and manage
              rotation patterns.
            </p>
          </header>

          {/* Department selector */}
          <div className="rounded border bg-white p-4 flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Department:
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="input"
            >
              <option value="">Select…</option>
              {[...new Set(workers.map((w) => w.department).filter(Boolean))].map(
                (d) => (
                  <option key={d as string} value={d as string}>
                    {d}
                  </option>
                ),
              )}
            </select>
            {loading && (
              <span className="text-xs text-slate-400">Refreshing…</span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create shift */}
            {canCreateShift ? (
              <CreateShiftCard onCreated={async () => {
                const r = await workforceService.getShifts();
                setShifts(r.data || []);
              }} />
            ) : (
              <div className="rounded border bg-white p-6 text-sm text-slate-500">
                Your role can view shifts but cannot create new ones.
              </div>
            )}

            {/* Assign shift */}
            {canAssignWorker ? (
            <form
              onSubmit={handleAssign}
              className="rounded border bg-white p-6 space-y-3"
            >
              <h3 className="font-bold text-slate-900">Assign Shift</h3>
              <select
                value={assignForm.workerId}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, workerId: e.target.value })
                }
                className="input w-full"
                required
              >
                <option value="">Pick worker…</option>
                {workers
                  .filter((w) => !department || w.department === department)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.fullName || w.user?.username || w.id}
                    </option>
                  ))}
              </select>
              <select
                value={assignForm.shiftId}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, shiftId: e.target.value })
                }
                className="input w-full"
                required
              >
                <option value="">Pick shift…</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.startTime ? ` (${s.startTime}–${s.endTime})` : ""}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={assignForm.date}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, date: e.target.value })
                }
                className="input w-full"
                required
              />
              <button className="btn btn-primary w-full" type="submit">
                Assign
              </button>
            </form>
            ) : (
              <div className="rounded border bg-white p-6 text-sm text-slate-500">
                Your role can view shifts but cannot assign workers.
              </div>
            )}

            {/* Rotation pattern */}
            <form
              onSubmit={handleRotation}
              className="rounded border bg-white p-6 space-y-3 lg:col-span-2"
            >
              <h3 className="font-bold text-slate-900">Rotation Pattern</h3>
              <select
                value={rotationForm.workerId}
                onChange={(e) =>
                  setRotationForm({ ...rotationForm, workerId: e.target.value })
                }
                className="input w-full"
                required
              >
                <option value="">Pick worker…</option>
                {workers
                  .filter((w) => !department || w.department === department)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.fullName || w.user?.username || w.id}
                    </option>
                  ))}
              </select>
              <div className="flex flex-wrap gap-2">
                {shifts.map((s) => {
                  const on = rotationForm.pattern.includes(s.name);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => togglePattern(s.name)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                        on
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                Order: {rotationForm.pattern.join(" → ") || "(none)"}
              </p>
              <button className="btn btn-primary" type="submit">
                Save Rotation
              </button>
            </form>
          </div>

          {/* Schedule (next 7 days) */}
          <div className="rounded border bg-white p-6">
            <h3 className="font-bold text-slate-900 mb-3">
              Department Schedule (next 7 days)
            </h3>
            {schedule.length === 0 ? (
              <p className="text-slate-500 text-sm">No schedule items.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2">Date</th>
                      <th className="py-2">Worker</th>
                      <th className="py-2">Shift</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((s: any) => (
                      <tr key={s.id} className="border-t">
                        <td className="py-2">
                          {new Date(s.date).toLocaleDateString()}
                        </td>
                        <td className="py-2">
                          {s.worker?.fullName ||
                            s.worker?.user?.username ||
                            s.workerId}
                        </td>
                        <td className="py-2">{s.shift?.name || s.shiftId}</td>
                        <td className="py-2">
                          {canAssignWorker ? (
                            <button
                              type="button"
                              onClick={() => handleUnassign(s.id)}
                              className="text-rose-600 text-xs font-bold"
                            >
                              Remove
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All assignments */}
          <div className="rounded border bg-white p-6">
            <h3 className="font-bold text-slate-900 mb-3">
              All Assignments ({assignments.length})
            </h3>
            {assignments.length === 0 ? (
              <p className="text-slate-500 text-sm">No assignments yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {assignments.map((a) => {
                  const w = workers.find((x) => x.id === a.workerId);
                  return (
                    <li
                      key={a.id}
                      className="flex justify-between border-b py-1"
                    >
                      <span>
                        {w?.fullName || w?.user?.username || a.workerId} →{" "}
                        {a.shift?.name || a.shiftId} on{" "}
                        {new Date(a.date).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUnassign(a.id)}
                        className="text-rose-600 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function CreateShiftCard({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    startTime: "",
    endTime: "",
    description: "",
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/workforce/shifts", form);
      toast.success("Shift created");
      setForm({ name: "", startTime: "", endTime: "", description: "" });
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create shift");
    }
  };
  return (
    <form onSubmit={submit} className="rounded border bg-white p-6 space-y-3">
      <h3 className="font-bold text-slate-900">Create Shift Definition</h3>
      <input
        placeholder="Name (e.g. Morning, Night)"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="input w-full"
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="time"
          value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          className="input w-full"
        />
        <input
          type="time"
          value={form.endTime}
          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          className="input w-full"
        />
      </div>
      <input
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="input w-full"
      />
      <button className="btn btn-primary w-full" type="submit">
        Create Shift
      </button>
    </form>
  );
}
