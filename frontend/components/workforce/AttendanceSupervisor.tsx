"use client";
import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import {
  useAttendanceByDate,
  usePostAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from "@/hooks/useAttendance";
import toast from "react-hot-toast";
import { useWorkers } from "@/hooks/useWorkers";

type Status = "Present" | "Absent" | "On Leave" | "Late";

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
  const d = new Date(dateStr);
  d.setHours(parseInt(hh || "0", 10), parseInt(mm || "0", 10), 0, 0);
  return d.toISOString();
}

export default function AttendanceSupervisor({ department }: { department?: string }) {
  const { user } = useAuth();
  // attendance for a specific date is fetched below (see selectedDate)
  const post = usePostAttendance();
  const updateMut = useUpdateAttendance();
  const deleteMut = useDeleteAttendance();
  const qc = useQueryClient();
  const {
    data: workers,
    isLoading: workersLoading,
    isError: workersError,
  } = useWorkers();

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // date selected by the user for which to view/edit attendance
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const {
    data: attendanceDataForAll,
    isLoading: attendanceLoadingForAll,
    isError: attendanceErrorForAll,
    error: attendanceErrorAllObject,
  } = useAttendanceByDate(selectedDate);

  const attendanceByWorker = React.useMemo(() => {
    const map: Record<string, any> = {};
    (attendanceDataForAll || []).forEach(
      (a: any) => {
        if (!a || !a.workerId) return;
        // The new response shape wraps the record under `attendance`.
        // Keep backward compatibility with the old shape (flat record).
        const record = a.attendance ?? a;
        const status = a.status as Status | undefined;
        map[a.workerId] = { ...record, status };
      },
    );
    return map;
  }, [attendanceDataForAll]);

  // local editable state per worker — initialize empty and populate in effect to keep hooks order stable
  // Declare state here (before any early returns) so hooks order stays constant across renders.
  const [rows, setRows] = useState<any[]>([]);
  const [isSavingAll, setIsSavingAll] = React.useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // memoize workers so its identity only changes when inputs change
  const myWorkers = React.useMemo(
    () =>
      (workers || []).filter((w: any) => {
        if (!department) return true; // include all when no department
        return w.department === department;
      }),
    [workers, department],
  );

  // If workers or attendance for the selected date change, reset rows
  React.useEffect(() => {
    console.debug("AttendanceSupervisor: fetching attendance", {
      department,
      selectedDate,
    });
    console.debug(
      "AttendanceSupervisor: attendanceData (raw)",
      attendanceDataForAll,
    );
      // basic runtime type validation to help diagnose mismatches
    if (attendanceDataForAll && attendanceDataForAll.length > 0) {
      (attendanceDataForAll || []).slice(0, 5).forEach((a: any) => {
        if (!a.workerId)
          console.warn("AttendanceSupervisor: record missing workerId", a);
        if (a.checkIn && typeof a.checkIn !== "string")
          console.warn(
            "AttendanceSupervisor: unexpected checkIn type (expected ISO string)",
            typeof a.checkIn,
            a.checkIn,
          );
        if (a.checkOut && typeof a.checkOut !== "string")
          console.warn(
            "AttendanceSupervisor: unexpected checkOut type (expected ISO string)",
            typeof a.checkOut,
            a.checkOut,
          );
      });
    }
    setRows(
      myWorkers.map((w: any) => {
        const att = attendanceByWorker[w.id];
        const baseStatus: Status = att?.status ?? "Present";
        return {
          workerId: w.id,
          name: w.name ?? w.user?.username ?? w.employeeId,
          position: w.position || "",
          status: baseStatus,
          checkIn: timeToInputVal(att?.checkIn) || "08:00",
          checkOut: timeToInputVal(att?.checkOut) || "17:00",
          existingAttendance: att,
        };
      }),
    );
    const attendanceData = attendanceDataForAll;
    if (attendanceData && attendanceData.length > 0) {
      const present = attendanceData.filter(
        (r: any) => r?.status === "Present",
      ).length;
      const absent = attendanceData.filter(
        (r: any) => r?.status === "Absent",
      ).length;
      const onLeave = attendanceData.filter(
        (r: any) => r?.status === "On Leave",
      ).length;
      console.info(
        `AttendanceSupervisor: loaded ${attendanceData.length} workers for ${selectedDate} (Present=${present}, Absent=${absent}, OnLeave=${onLeave})`,
      );
    } else {
      console.info(
        `AttendanceSupervisor: no workers returned for ${selectedDate}; using defaults`,
      );
    }
    // only depends on workers and attendance for the selected date
  }, [myWorkers, attendanceDataForAll]);
  // debug log when selected date or attendance data changes
  React.useEffect(() => {
    console.debug("AttendanceSupervisor: selectedDate=", selectedDate);
    console.debug(
      "AttendanceSupervisor: attendanceData=",
      attendanceDataForAll,
    );
  }, [selectedDate, attendanceDataForAll]);
  if (attendanceErrorForAll) {
    const reqUrl = `http://localhost:5000/workforce/attendance?date=${selectedDate}`;
    // show structured error in console for easier debugging
    // eslint-disable-next-line no-console
    console.error("AttendanceSupervisor: Failed to load attendance", {
      url: reqUrl,
      department,
      date: selectedDate,
      error: attendanceErrorAllObject,
    });
    return (
      <div className="p-4 text-rose-600">
        Failed to load attendance for date. See console for details.
      </div>
    );
  }

  if (workersLoading) return <div className="p-4">Loading workers...</div>;
  if (attendanceLoadingForAll)
    return <div className="p-4">Loading attendance...</div>;
  if (workersError)
    return <div className="p-4 text-rose-600">Failed to load workers</div>;

  // debug: if no workers are returned, help identify why
  if (!workers || (Array.isArray(workers) && workers.length === 0)) {
    // Keep this visible to the developer — the frontend may be authorized but backend returned no workers
    return (
      <div className="p-4">
        No workers found. Ensure the logged-in user has permission and the
        backend has worker records.
      </div>
    );
  }

  const updateRow = (workerId: string, patch: Partial<any>) => {
    setRows((prev) =>
      prev.map((r: any) => (r.workerId === workerId ? { ...r, ...patch } : r)),
    );
  };

  const handleSave = async (row: any) => {
    // determine payload
    if (row.status === "Absent") {
      // if Absent and there is an existing attendance record, delete it
      if (row.existingAttendance && row.existingAttendance.id) {
        deleteMut.mutate(row.existingAttendance.id, {
          onSuccess: () => {
            toast.success(`${row.name} marked Absent and attendance removed`);
          },
          onError: () => {
            toast.error("Failed to remove attendance");
          },
        });
      } else {
        toast(`${row.name} marked Absent`);
      }
      return;
    }

    const payload: any = {
      workerId: row.workerId,
      date: selectedDate,
    };

    // if present, ensure checkIn exists
    if (row.checkIn) {
      payload.checkIn = combineDateAndTime(selectedDate, row.checkIn)!;
    } else if (row.existingAttendance && row.existingAttendance.checkIn) {
      payload.checkIn = row.existingAttendance.checkIn;
    } else {
      // default to now
      payload.checkIn = new Date().toISOString();
    }

    if (row.checkOut) {
      payload.checkOut = combineDateAndTime(selectedDate, row.checkOut);
    }

    if (row.existingAttendance && row.existingAttendance.id) {
      // update existing record
      updateMut.mutate(
        { id: row.existingAttendance.id, payload },
        {
          onSuccess: () => toast.success(`${row.name} attendance updated`),
          onError: () => toast.error("Failed to update attendance"),
        },
      );
    } else {
      post.mutate(payload, {
        onSuccess: () => toast.success(`${row.name} attendance recorded`),
        onError: () => toast.error("Failed to record attendance"),
      });
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    const loadingToastId = toast.loading("Saving attendances...");
    try {
      for (const r of rows) {
        // determine action similar to handleSave
        if (r.status === "Absent") {
          if (r.existingAttendance && r.existingAttendance.id) {
            await deleteMut.mutateAsync(r.existingAttendance.id);
          }
          continue;
        }

        const payload: any = {
          workerId: r.workerId,
          date: selectedDate,
        };

        if (r.checkIn)
          payload.checkIn = combineDateAndTime(selectedDate, r.checkIn)!;
        else if (r.existingAttendance && r.existingAttendance.checkIn)
          payload.checkIn = r.existingAttendance.checkIn;
        else payload.checkIn = new Date().toISOString();

        if (r.checkOut)
          payload.checkOut = combineDateAndTime(selectedDate, r.checkOut);

        if (r.existingAttendance && r.existingAttendance.id) {
          await updateMut.mutateAsync({ id: r.existingAttendance.id, payload });
        } else {
          await post.mutateAsync(payload);
        }
      }
      toast.success("All attendances saved");
      // ensure attendance queries are refetched for the team+date
      try {
        await qc.invalidateQueries({
          queryKey: ["attendance", "all", selectedDate],
          exact: false,
        });
      } catch (e) {
        console.debug("AttendanceSupervisor: error invalidating queries", e);
      }
    } catch (err) {
      toast.error("Failed to save some attendances");
    } finally {
      toast.dismiss(loadingToastId);
      setIsSavingAll(false);
    }
  };
  return (
    <div className="w-full overflow-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Date</div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {attendanceDataForAll && attendanceDataForAll.length > 0 ? (
        <div className="mb-3 p-2 bg-green-50 text-green-800 rounded">
          Loaded {attendanceDataForAll.length} attendance record(s) from DB for{" "}
          {selectedDate}
        </div>
      ) : (
        <div className="mb-3 p-2 bg-slate-50 text-slate-600 rounded">
          No attendance records found in DB for {selectedDate}; showing
          defaults.
        </div>
      )}

      <table className="min-w-full table-auto divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
          <tr>
            <th className="px-4 py-3 text-left">Worker</th>
            <th className="px-4 py-3 text-left">Position</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Check-in</th>
            <th className="px-4 py-3">Check-out</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((r: any) => (
            <tr
              key={r.workerId}
              className="hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <td className="px-4 py-3">{r.name}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{r.position}</td>
              <td className="px-4 py-3">
                <select
                  value={r.status}
                  onChange={(e) =>
                    updateRow(r.workerId, { status: e.target.value })
                  }
                  className="rounded border px-3 py-2"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Late">Late</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <input
                  type="time"
                  value={r.checkIn}
                  onChange={(e) =>
                    updateRow(r.workerId, { checkIn: e.target.value })
                  }
                  className="input"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="time"
                  value={r.checkOut}
                  onChange={(e) =>
                    updateRow(r.workerId, { checkOut: e.target.value })
                  }
                  className="input"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {(() => {
                    const existing = r.existingAttendance;
                    const existingIn = timeToInputVal(existing?.checkIn);
                    const existingOut = timeToInputVal(existing?.checkOut);
                    const isDirty =
                      (existing
                        ? r.status !== "Present"
                          ? true
                          : false
                        : r.status !== "Absent") ||
                      r.checkIn !== existingIn ||
                      r.checkOut !== existingOut;

                    return (
                      <button
                        className="btn"
                        disabled={
                          post.isLoading ||
                          updateMut.isLoading ||
                          deleteMut.isLoading ||
                          !isDirty
                        }
                        onClick={() => handleSave(r)}
                      >
                        Save
                      </button>
                    );
                  })()}
                  <button
                    className="btn btn-ghost"
                    onClick={() =>
                      updateRow(r.workerId, {
                        status: r.existingAttendance ? "Present" : "Absent",
                        checkIn: timeToInputVal(r.existingAttendance?.checkIn),
                        checkOut: timeToInputVal(
                          r.existingAttendance?.checkOut,
                        ),
                      })
                    }
                  >
                    Reset
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-end">
        <button
          className="btn"
          onClick={handleSaveAll}
          disabled={
            isSavingAll ||
            post.isLoading ||
            updateMut.isLoading ||
            deleteMut.isLoading
          }
        >
          {isSavingAll ? "Saving..." : "Save All"}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {attendanceLoadingForAll ? (
            <span>Loading attendance for {selectedDate}...</span>
          ) : (
            <span>Showing attendance for {selectedDate}</span>
          )}
        </div>
        <div>
          <button
            className="btn btn-ghost"
            onClick={() => setShowDebug((s) => !s)}
          >
            {showDebug ? "Hide debug" : "Show debug"}
          </button>
        </div>
      </div>
      {showDebug && (
        <div className="mt-3 p-3 bg-slate-50 rounded border dark:bg-slate-800">
          <div className="text-sm font-medium mb-2">Debug Info</div>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(
              {
                selectedDate,
                department,
                attendanceCount: (attendanceDataForAll || []).length,
                workersCount: (workers || []).length,
                rowsCount: rows.length,
                attendanceData: attendanceDataForAll,
              },
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
