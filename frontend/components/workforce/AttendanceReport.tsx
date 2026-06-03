"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  UserX,
  Users,
} from "lucide-react";
import workforceService from "@/services/workforceService";
import { useAuth } from "@/context/auth-context";
import {
  WorkforceButton,
  WorkforceInput,
  WorkforceLabel,
  WorkforceSelect,
} from "@/components/workforce/workforce-ui";

type ReportData = {
  period: { start: string; end: string };
  scope: { department: string | null; shiftId: string | null };
  summary: {
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    totalRecords: number;
    totalWorkers: number;
    attendanceRate: number;
  };
  dailyBreakdown: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
  }>;
  byWorker: Array<{
    workerId: string;
    workerName: string;
    employeeId: string | null;
    department: string | null;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
    total: number;
    attendanceRate: number;
  }>;
  byDepartment: Array<{
    department: string;
    present: number;
    absent: number;
    late: number;
    onLeave: number;
  }>;
};

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function StatCard({
  label,
  value,
  sub,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone: "emerald" | "rose" | "amber" | "violet" | "indigo";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const tones = {
    emerald: "from-emerald-500 to-teal-600",
    rose: "from-rose-500 to-pink-600",
    amber: "from-amber-500 to-orange-600",
    violet: "from-violet-500 to-purple-600",
    indigo: "from-indigo-500 to-blue-600",
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
          {sub ? <p className="mt-1 text-sm text-slate-500">{sub}</p> : null}
        </div>
        <div
          className={`rounded-xl bg-gradient-to-br ${tones[tone]} p-2.5 text-white shadow-lg`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AttendanceReportPage({
  title,
  subtitle,
  showDepartmentFilter = false,
}: {
  title: string;
  subtitle: string;
  showDepartmentFilter?: boolean;
}) {
  const { user } = useAuth();
  const initial = useMemo(() => defaultRange(), []);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [shiftId, setShiftId] = useState("");
  const [department, setDepartment] = useState("");

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await workforceService.getShifts();
      return res.data ?? [];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await workforceService.getDepartments();
      return res.data ?? [];
    },
    enabled: showDepartmentFilter,
  });

  const {
    data: report,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["attendance-report", start, end, shiftId, department],
    queryFn: async () => {
      const res = await workforceService.getAttendanceReport({
        start,
        end,
        shiftId: shiftId || undefined,
        department: department || undefined,
      });
      return res.data as ReportData;
    },
    enabled: !!start && !!end,
  });

  const exportCsv = () => {
    if (!report?.byWorker?.length) return;
    const header =
      "Worker,Employee ID,Department,Present,Absent,Late,On Leave,Total,Rate %";
    const rows = report.byWorker.map(
      (w) =>
        `"${w.workerName}","${w.employeeId ?? ""}","${w.department ?? ""}",${w.present},${w.absent},${w.late},${w.onLeave},${w.total},${w.attendanceRate}`,
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${start}-to-${end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxDaily = Math.max(
    ...(report?.dailyBreakdown ?? []).map(
      (d) => d.present + d.absent + d.late + d.onLeave,
    ),
    1,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 pt-20">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">
              Workforce Analytics
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-500">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <WorkforceButton
              variant="secondary"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Refresh
            </WorkforceButton>
            <WorkforceButton
              variant="secondary"
              onClick={exportCsv}
              disabled={!report?.byWorker?.length}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </WorkforceButton>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-700">
            <Filter className="h-4 w-4 text-indigo-600" />
            <h2 className="font-bold">Filters</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <WorkforceLabel htmlFor="report-start">From</WorkforceLabel>
              <WorkforceInput
                id="report-start"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div>
              <WorkforceLabel htmlFor="report-end">To</WorkforceLabel>
              <WorkforceInput
                id="report-end"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
            <div>
              <WorkforceLabel htmlFor="report-shift">Shift</WorkforceLabel>
              <WorkforceSelect
                id="report-shift"
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
              >
                <option value="">All shifts</option>
                {shifts.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime}–{s.endTime})
                  </option>
                ))}
              </WorkforceSelect>
            </div>
            {showDepartmentFilter ? (
              <div>
                <WorkforceLabel htmlFor="report-dept">Department</WorkforceLabel>
                <WorkforceSelect
                  id="report-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">All departments</option>
                  {departments.map((d: any) => (
                    <option key={d.id ?? d.name} value={d.name ?? d.id}>
                      {d.name ?? d.id}
                    </option>
                  ))}
                </WorkforceSelect>
              </div>
            ) : (
              <div className="flex items-end">
                <p className="rounded-xl bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700">
                  Scoped to{" "}
                  <strong>
                    {(user as any)?.workerProfile?.department ?? "your department"}
                  </strong>
                </p>
              </div>
            )}
          </div>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : report ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatCard
                label="Attendance rate"
                value={`${report.summary.attendanceRate}%`}
                sub={`${report.summary.totalRecords} records`}
                tone="indigo"
                icon={BarChart3}
              />
              <StatCard
                label="Present"
                value={report.summary.present}
                tone="emerald"
                icon={CheckCircle2}
              />
              <StatCard
                label="Late"
                value={report.summary.late}
                tone="amber"
                icon={Clock}
              />
              <StatCard
                label="Absent"
                value={report.summary.absent}
                tone="rose"
                icon={UserX}
              />
              <StatCard
                label="On leave"
                value={report.summary.onLeave}
                sub={`${report.summary.totalWorkers} workers in scope`}
                tone="violet"
                icon={Users}
              />
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="mb-6 flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Daily breakdown
                  </h2>
                </div>
                {report.dailyBreakdown.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No attendance records in this period.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {report.dailyBreakdown.map((day) => {
                      const total =
                        day.present + day.absent + day.late + day.onLeave;
                      const width = Math.round((total / maxDaily) * 100);
                      return (
                        <div key={day.date}>
                          <div className="mb-1 flex justify-between text-xs text-slate-500">
                            <span>{day.date}</span>
                            <span>{total} marked</span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="flex h-full"
                              style={{ width: `${Math.max(width, 4)}%` }}
                            >
                              {day.present > 0 && (
                                <div
                                  className="bg-emerald-500"
                                  style={{
                                    width: `${(day.present / total) * 100}%`,
                                  }}
                                />
                              )}
                              {day.late > 0 && (
                                <div
                                  className="bg-amber-500"
                                  style={{
                                    width: `${(day.late / total) * 100}%`,
                                  }}
                                />
                              )}
                              {day.onLeave > 0 && (
                                <div
                                  className="bg-violet-500"
                                  style={{
                                    width: `${(day.onLeave / total) * 100}%`,
                                  }}
                                />
                              )}
                              {day.absent > 0 && (
                                <div
                                  className="bg-rose-500"
                                  style={{
                                    width: `${(day.absent / total) * 100}%`,
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Present
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Late
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-violet-500" /> On leave
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Absent
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-slate-900">
                  By department
                </h2>
                {report.byDepartment.length === 0 ? (
                  <p className="text-sm text-slate-500">No department data.</p>
                ) : (
                  <ul className="space-y-3">
                    {report.byDepartment.map((d) => {
                      const total = d.present + d.absent + d.late + d.onLeave;
                      const rate =
                        total > 0
                          ? Math.round(((d.present + d.late) / total) * 100)
                          : 0;
                      return (
                        <li
                          key={d.department}
                          className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900">
                              {d.department}
                            </p>
                            <span className="text-sm font-bold text-indigo-600">
                              {rate}%
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            P {d.present} · L {d.late} · A {d.absent} · Leave{" "}
                            {d.onLeave}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Worker summary
                </h2>
                <p className="text-sm text-slate-500">
                  Per-employee totals for the selected period
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Worker</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3 text-center">Present</th>
                      <th className="px-6 py-3 text-center">Late</th>
                      <th className="px-6 py-3 text-center">Absent</th>
                      <th className="px-6 py-3 text-center">Leave</th>
                      <th className="px-6 py-3 text-center">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.byWorker.map((w) => (
                      <tr key={w.workerId} className="hover:bg-slate-50/80">
                        <td className="px-6 py-3">
                          <p className="font-semibold text-slate-900">
                            {w.workerName}
                          </p>
                          {w.employeeId ? (
                            <p className="text-xs text-slate-500">
                              {w.employeeId}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {w.department ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-center text-emerald-700 font-medium">
                          {w.present}
                        </td>
                        <td className="px-6 py-3 text-center text-amber-700 font-medium">
                          {w.late}
                        </td>
                        <td className="px-6 py-3 text-center text-rose-700 font-medium">
                          {w.absent}
                        </td>
                        <td className="px-6 py-3 text-center text-violet-700 font-medium">
                          {w.onLeave}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              w.attendanceRate >= 90
                                ? "bg-emerald-100 text-emerald-700"
                                : w.attendanceRate >= 75
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {w.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
