"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import workforceService from "@/services/workforceService";
import toast from "react-hot-toast";
import { useCanPerform } from "@/hooks/useCanPerform";
import {
  Calendar,
  Clock,
  Pencil,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  WorkforceButton,
  WorkforceInput,
  WorkforceLabel,
} from "@/components/workforce/workforce-ui";

type Shift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  assignments?: Array<{
    id: string;
    workerId: string;
    worker?: { fullName?: string | null; employeeId?: string | null };
  }>;
};

type Worker = {
  id: string;
  fullName?: string | null;
  department?: string | null;
  user?: { username?: string };
};

export default function SupervisorShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignShiftId, setAssignShiftId] = useState<string | null>(null);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [editShift, setEditShift] = useState<Shift | null>(null);

  const canManage = useCanPerform(["SUPERVISOR", "ADMIN", "HR_ADMIN"]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([
        workforceService.getShifts(),
        workforceService.getWorkers(),
      ]);
      setShifts(s.data || []);
      setWorkers(w.data || []);
    } catch {
      toast.error("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleBulkAssign = async () => {
    if (!assignShiftId || selectedWorkers.length === 0) return;
    try {
      await workforceService.bulkAssignShift(assignShiftId, selectedWorkers);
      toast.success("Workers assigned");
      setAssignShiftId(null);
      setSelectedWorkers([]);
      void load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to assign");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shift and all assignments?")) return;
    try {
      await workforceService.deleteShift(id);
      toast.success("Shift deleted");
      void load();
    } catch {
      toast.error("Failed to delete shift");
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    try {
      await workforceService.unassignShift(assignmentId);
      toast.success("Worker removed from shift");
      void load();
    } catch {
      toast.error("Failed to remove worker");
    }
  };

  if (!user) return null;

  if (!canManage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10 pt-20">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">
            Supervisor
          </p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">
            Shift Management
          </h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            Create shifts with date ranges and daily hours, assign workers, and
            manage schedules shown on the worker dashboard.
          </p>
        </header>

        <CreateShiftCard onCreated={load} />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : shifts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Clock className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-600">No shifts yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shifts.map((shift) => (
              <article
                key={shift.id}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {shift.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {shift.startTime} – {shift.endTime} daily
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(shift.startDate).toLocaleDateString()} –{" "}
                      {new Date(shift.endDate).toLocaleDateString()}
                    </p>
                    {shift.description ? (
                      <p className="mt-2 text-sm text-slate-600">
                        {shift.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <WorkforceButton
                      variant="secondary"
                      onClick={() => {
                        setAssignShiftId(shift.id);
                        setSelectedWorkers([]);
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Assign workers
                    </WorkforceButton>
                    <WorkforceButton
                      variant="ghost"
                      onClick={() => setEditShift(shift)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </WorkforceButton>
                    <WorkforceButton
                      variant="ghost"
                      onClick={() => handleDelete(shift.id)}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </WorkforceButton>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    Assigned ({shift.assignments?.length ?? 0})
                  </p>
                  {!shift.assignments?.length ? (
                    <p className="text-sm text-slate-400">No workers assigned.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {shift.assignments.map((a) => (
                        <li
                          key={a.id}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm"
                        >
                          <span>
                            {a.worker?.fullName ??
                              a.worker?.employeeId ??
                              a.workerId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUnassign(a.id)}
                            className="text-rose-600 hover:text-rose-800"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {assignShiftId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900">Assign workers</h3>
              <p className="mt-1 text-sm text-slate-500">
                Select employees for this shift period.
              </p>
              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                {workers.map((w) => {
                  const on = selectedWorkers.includes(w.id);
                  return (
                    <label
                      key={w.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 ${
                        on
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          setSelectedWorkers((prev) =>
                            on
                              ? prev.filter((id) => id !== w.id)
                              : [...prev, w.id],
                          )
                        }
                      />
                      <span className="text-sm font-medium">
                        {w.fullName ?? w.user?.username ?? w.id}
                      </span>
                      {w.department ? (
                        <span className="text-xs text-slate-500">
                          {w.department}
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <WorkforceButton
                  variant="ghost"
                  onClick={() => setAssignShiftId(null)}
                >
                  Cancel
                </WorkforceButton>
                <WorkforceButton onClick={handleBulkAssign}>
                  Assign {selectedWorkers.length} worker(s)
                </WorkforceButton>
              </div>
            </div>
          </div>
        ) : null}

        {editShift ? (
          <EditShiftModal
            shift={editShift}
            onClose={() => setEditShift(null)}
            onSaved={() => {
              setEditShift(null);
              void load();
            }}
          />
        ) : null}
      </main>
    </div>
  );
}

function CreateShiftCard({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    startTime: "08:00",
    endTime: "17:00",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().slice(0, 10);
    })(),
    description: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workforceService.createShift(form);
      toast.success("Shift created");
      setForm({
        name: "",
        startTime: "08:00",
        endTime: "17:00",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: form.endDate,
        description: "",
      });
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create shift");
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
    >
      <h3 className="font-bold text-slate-900">Create new shift</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <WorkforceLabel>Name</WorkforceLabel>
          <WorkforceInput
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Morning"
            required
          />
        </div>
        <div>
          <WorkforceLabel>Start time</WorkforceLabel>
          <WorkforceInput
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          />
        </div>
        <div>
          <WorkforceLabel>End time</WorkforceLabel>
          <WorkforceInput
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          />
        </div>
        <div>
          <WorkforceLabel>Period start</WorkforceLabel>
          <WorkforceInput
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <WorkforceLabel>Period end</WorkforceLabel>
          <WorkforceInput
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
          />
        </div>
        <div>
          <WorkforceLabel>Description</WorkforceLabel>
          <WorkforceInput
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Optional"
          />
        </div>
      </div>
      <WorkforceButton type="submit" className="mt-4">
        Create shift
      </WorkforceButton>
    </form>
  );
}

function EditShiftModal({
  shift,
  onClose,
  onSaved,
}: {
  shift: Shift;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: shift.name,
    startTime: shift.startTime,
    endTime: shift.endTime,
    startDate: shift.startDate.slice(0, 10),
    endDate: shift.endDate.slice(0, 10),
    description: shift.description ?? "",
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workforceService.updateShift(shift.id, form);
      toast.success("Shift updated");
      onSaved();
    } catch {
      toast.error("Failed to update shift");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={save}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-bold">Edit shift</h3>
        <div className="mt-4 space-y-3">
          <WorkforceInput
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
          />
          <div className="grid grid-cols-2 gap-2">
            <WorkforceInput
              type="time"
              value={form.startTime}
              onChange={(e) =>
                setForm({ ...form, startTime: e.target.value })
              }
            />
            <WorkforceInput
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <WorkforceInput
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm({ ...form, startDate: e.target.value })
              }
            />
            <WorkforceInput
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <WorkforceButton variant="ghost" type="button" onClick={onClose}>
            Cancel
          </WorkforceButton>
          <WorkforceButton type="submit">Save</WorkforceButton>
        </div>
      </form>
    </div>
  );
}
