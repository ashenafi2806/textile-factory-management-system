"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAttendanceByDate,
  usePostAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from "@/hooks/useAttendance";
import workforceService from "@/services/workforceService";
import toast from "react-hot-toast";
import {
  WorkforceButton,
  WorkforceInput,
  WorkforceLabel,
  WorkforceSelect,
} from "@/components/workforce/workforce-ui";
import { Calendar, CheckCircle2, Clock, Save, UserX } from "lucide-react";

type Status = "Present" | "Absent" | "On Leave" | "Late";

const STATUS_API: Record<Status, string> = {
  Present: "PRESENT",
  Absent: "ABSENT",
  Late: "LATE",
  "On Leave": "ON_LEAVE",
};

function timeToInputVal(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function combineDateAndTime(dateStr: string, timeVal: string) {
  if (!timeVal) return undefined;
  const [hh, mm] = timeVal.split(":");
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCHours(parseInt(hh || "0", 10), parseInt(mm || "0", 10), 0, 0);
  return d.toISOString();
}

function statusBadge(status: Status) {
  const styles: Record<Status, string> = {
    Present: "bg-emerald-100 text-emerald-800",
    Late: "bg-amber-100 text-amber-800",
    Absent: "bg-rose-100 text-rose-800",
    "On Leave": "bg-violet-100 text-violet-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function AttendanceSupervisor({
  department,
}: {
  department?: string;
}) {
  const qc = useQueryClient();
  const post = usePostAttendance();
  const updateMut = useUpdateAttendance();
  const deleteMut = useDeleteAttendance();

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [shiftId, setShiftId] = useState("");
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await workforceService.getShifts();
      return res.data ?? [];
    },
  });

  const {
    data: attendanceDataForAll = [],
    isLoading,
    isError,
  } = useAttendanceByDate(selectedDate, shiftId || undefined);

  const attendanceByWorker = useMemo(() => {
    const map: Record<string, any> = {};
    attendanceDataForAll.forEach((a: any) => {
      if (!a?.workerId) return;
      map[a.workerId] = {
        ...(a.attendance ?? {}),
        status: a.status,
        shift: a.shift,
      };
    });
    return map;
  }, [attendanceDataForAll]);

  useEffect(() => {
    setRows(
      attendanceDataForAll.map((entry: any) => {
        const w = entry.worker ?? {};
        const att = attendanceByWorker[entry.workerId];
        const baseStatus: Status = att?.status ?? "Present";
        const shift = entry.shift ?? att?.shift ?? null;
        const defaultStart = shift?.startTime ?? "08:00";
        const defaultEnd = shift?.endTime ?? "17:00";
        return {
          workerId: entry.workerId,
          name: w.fullName ?? w.user?.username ?? w.employeeId ?? entry.workerId,
          department: w.department ?? "",
          position: w.jobTitle ?? w.position ?? "",
          status: baseStatus,
          checkIn: timeToInputVal(att?.checkIn) || defaultStart,
          checkOut: timeToInputVal(att?.checkOut) || defaultEnd,
          shiftName: shift?.name ?? "—",
          existingAttendance: att?.id ? att : null,
        };
      }),
    );
  }, [attendanceDataForAll, attendanceByWorker]);

  const summary = useMemo(() => {
    const counts = { Present: 0, Late: 0, Absent: 0, "On Leave": 0 };
    rows.forEach((r) => {
      counts[r.status as Status] = (counts[r.status as Status] ?? 0) + 1;
    });
    return counts;
  }, [rows]);

  const updateRow = (workerId: string, patch: Partial<any>) => {
    setRows((prev) =>
      prev.map((r) => (r.workerId === workerId ? { ...r, ...patch } : r)),
    );
  };

  const buildPayload = (row: any) => {
    const status = STATUS_API[row.status as Status];
    const payload: any = {
      workerId: row.workerId,
      date: selectedDate,
      status,
    };
    if (row.status === "Absent" || row.status === "On Leave") return payload;
    if (row.checkIn) payload.checkIn = combineDateAndTime(selectedDate, row.checkIn);
    if (row.checkOut) payload.checkOut = combineDateAndTime(selectedDate, row.checkOut);
    return payload;
  };

  const handleSave = async (row: any) => {
    try {
      const payload = buildPayload(row);
      if (row.existingAttendance?.id) {
        await updateMut.mutateAsync({
          id: row.existingAttendance.id,
          payload,
        });
      } else {
        await post.mutateAsync(payload);
      }
      toast.success(`${row.name} saved`);
      await qc.invalidateQueries({ queryKey: ["attendance"], exact: false });
    } catch {
      toast.error(`Failed to save ${row.name}`);
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    const loadingId = toast.loading("Saving attendance…");
    try {
      for (const row of rows) {
        const payload = buildPayload(row);
        if (row.existingAttendance?.id) {
          await updateMut.mutateAsync({
            id: row.existingAttendance.id,
            payload,
          });
        } else {
          await post.mutateAsync(payload);
        }
      }
      toast.success("All attendance saved");
      await qc.invalidateQueries({ queryKey: ["attendance"], exact: false });
    } catch {
      toast.error("Some records failed to save");
    } finally {
      toast.dismiss(loadingId);
      setIsSavingAll(false);
    }
  };

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        Failed to load attendance. Check that the backend is running.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            ["Present", summary.Present, "emerald", CheckCircle2],
            ["Late", summary.Late, "amber", Clock],
            ["Absent", summary.Absent, "rose", UserX],
            ["On Leave", summary["On Leave"], "violet", Calendar],
          ] as const
        ).map(([label, count, tone, Icon]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <Icon
                className={`h-4 w-4 text-${tone}-600`}
              />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{count}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div className="flex-1">
          <WorkforceLabel htmlFor="att-date">Date</WorkforceLabel>
          <WorkforceInput
            id="att-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <WorkforceLabel htmlFor="att-shift">Shift filter</WorkforceLabel>
          <WorkforceSelect
            id="att-shift"
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
          >
            <option value="">All workers{department ? ` in ${department}` : ""}</option>
            {shifts.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.startTime}–{s.endTime})
              </option>
            ))}
          </WorkforceSelect>
        </div>
        <WorkforceButton onClick={handleSaveAll} disabled={isSavingAll || isLoading}>
          <Save className="h-4 w-4" />
          {isSavingAll ? "Saving…" : "Save all"}
        </WorkforceButton>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500">
          No workers found for this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.workerId}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{r.name}</p>
                  <p className="text-sm text-slate-500">
                    {r.position || r.department || "Worker"} · Shift: {r.shiftName}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <WorkforceSelect
                    value={r.status}
                    onChange={(e) =>
                      updateRow(r.workerId, { status: e.target.value })
                    }
                    className="w-36"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                  </WorkforceSelect>
                  {r.status !== "Absent" && r.status !== "On Leave" ? (
                    <>
                      <WorkforceInput
                        type="time"
                        value={r.checkIn}
                        onChange={(e) =>
                          updateRow(r.workerId, { checkIn: e.target.value })
                        }
                        className="w-32"
                      />
                      <WorkforceInput
                        type="time"
                        value={r.checkOut}
                        onChange={(e) =>
                          updateRow(r.workerId, { checkOut: e.target.value })
                        }
                        className="w-32"
                      />
                    </>
                  ) : (
                    statusBadge(r.status as Status)
                  )}
                  <WorkforceButton
                    variant="secondary"
                    onClick={() => handleSave(r)}
                    disabled={post.isPending || updateMut.isPending}
                  >
                    Save
                  </WorkforceButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
