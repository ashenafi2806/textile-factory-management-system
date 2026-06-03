"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  CalendarOff,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";
import { useCanPerform } from "@/hooks/useCanPerform";

type LeaveAnalytics = {
  totalWorkers: number;
  activeLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  availableWorkers: number;
  utilizationRate?: number;
  scopeDepartment?: string | null;
  monthlyLeaves?: Array<{ month: string; count: number }>;
};

type GroupByRow = {
  _count: number | { _all?: number };
};

function groupByCount(row: GroupByRow): number {
  if (typeof row._count === "number") return row._count;
  return row._count._all ?? 0;
}

type WorkerAnalytics = {
  todayAttendance?: number;
  workersByPosition?: Array<{ position: string } & GroupByRow>;
  workersBySkillLevel?: Array<{ skillLevel: string | null } & GroupByRow>;
};

export default function WorkforceAnalyticsPage() {
  const { contentOffset, isDesktop } = useSidebar();
  const [leaveData, setLeaveData] = useState<LeaveAnalytics | null>(null);
  const [workerData, setWorkerData] = useState<WorkerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canView = useCanPerform(["MANAGER", "ADMIN", "HR_ADMIN"]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [leaveRes, workerRes] = await Promise.all([
          api.get("/workforce/leave/analytics"),
          api.get("/workforce/workers/analytics").catch(() => ({ data: null })),
        ]);
        setLeaveData(leaveRes.data);
        setWorkerData(workerRes.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
        setError("Could not load workforce analytics.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [canView]);

  const utilization = useMemo(() => {
    if (!leaveData?.totalWorkers) return 0;
    return (
      leaveData.utilizationRate ??
      Math.round(
        (leaveData.availableWorkers / leaveData.totalWorkers) * 100,
      )
    );
  }, [leaveData]);

  if (!canView) {
    return (
      <div
        className="min-h-screen bg-slate-50 pt-20 md:pt-16"
        style={isDesktop ? { paddingLeft: contentOffset } : undefined}
      >
        <Navbar />
        <div className="mx-auto max-w-2xl p-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-xl font-bold text-rose-800">Access denied</h1>
            <p className="mt-2 text-sm text-rose-700">
              Workforce analytics is restricted to Managers, HR Admins, and
              Admins.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 pt-20 md:pt-16"
      style={isDesktop ? { paddingLeft: contentOffset } : undefined}
    >
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Manager insights
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Workforce analytics
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
            Track headcount, leave impact, and staffing availability.
            {leaveData?.scopeDepartment
              ? ` Showing data for the ${leaveData.scopeDepartment} department.`
              : " Showing organization-wide workforce data."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/manager/leave-approvals"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Review leave requests
            </Link>
            <Link
              href="/workforce/workers"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View all workers
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : error || !leaveData ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error || "No analytics data available."}
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<Users className="h-5 w-5 text-indigo-600" />}
                label="Total workforce"
                value={leaveData.totalWorkers}
                hint="Registered employee profiles in scope"
              />
              <MetricCard
                icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
                label="Available today"
                value={leaveData.availableWorkers}
                hint="Workers not currently on approved leave"
                tone="emerald"
              />
              <MetricCard
                icon={<CalendarOff className="h-5 w-5 text-amber-600" />}
                label="On leave now"
                value={leaveData.activeLeaves}
                hint="Approved leave covering today"
                tone="amber"
              />
              <MetricCard
                icon={<Clock className="h-5 w-5 text-blue-600" />}
                label="Pending approvals"
                value={leaveData.pendingLeaves}
                hint="Leave requests awaiting manager action"
                tone="blue"
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Staffing capacity
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Percentage of workers available for production allocation
                  right now.
                </p>
                <div className="mt-6 flex items-end gap-4">
                  <p className="text-5xl font-bold text-indigo-600">
                    {utilization}%
                  </p>
                  <p className="pb-2 text-sm text-slate-600">
                    {leaveData.availableWorkers} of {leaveData.totalWorkers}{" "}
                    workers ready
                  </p>
                </div>
                <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                    style={{ width: `${Math.min(100, utilization)}%` }}
                  />
                </div>
                {typeof workerData?.todayAttendance === "number" && (
                  <p className="mt-4 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {workerData.todayAttendance}
                    </span>{" "}
                    attendance records logged today.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">
                  Leave summary
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  All-time leave decisions in your scope.
                </p>
                <ul className="mt-4 space-y-3">
                  <SummaryRow
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    label="Approved (all time)"
                    value={leaveData.approvedLeaves}
                  />
                  <SummaryRow
                    icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
                    label="Pending review"
                    value={leaveData.pendingLeaves}
                  />
                  <SummaryRow
                    icon={<XCircle className="h-4 w-4 text-rose-600" />}
                    label="Rejected"
                    value={leaveData.rejectedLeaves}
                  />
                  <SummaryRow
                    icon={<CalendarOff className="h-4 w-4 text-indigo-600" />}
                    label="Active today"
                    value={leaveData.activeLeaves}
                  />
                </ul>
              </div>
            </section>

            {(leaveData.monthlyLeaves?.length ?? 0) > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Leave requests (last 6 months)
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Number of leave requests submitted each month.
                </p>
                <div className="mt-6 flex items-end gap-3 overflow-x-auto pb-2">
                  {leaveData.monthlyLeaves!.map((item) => {
                    const max = Math.max(
                      ...leaveData.monthlyLeaves!.map((m) => m.count),
                      1,
                    );
                    const height = Math.max(12, (item.count / max) * 120);
                    return (
                      <div
                        key={item.month}
                        className="flex min-w-[3rem] flex-col items-center gap-2"
                      >
                        <span className="text-sm font-bold text-slate-800">
                          {item.count}
                        </span>
                        <div
                          className="w-10 rounded-t-lg bg-indigo-500"
                          style={{ height }}
                        />
                        <span className="text-xs font-medium text-slate-500">
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {(workerData?.workersByPosition?.length ?? 0) > 0 && (
              <section className="grid gap-6 md:grid-cols-2">
                <BreakdownCard
                  title="Workers by position"
                  description="Headcount grouped by job title."
                  items={(workerData?.workersByPosition ?? []).map((row) => ({
                    label: row.position,
                    count: groupByCount(row),
                  }))}
                />
                {(workerData?.workersBySkillLevel?.length ?? 0) > 0 && (
                  <BreakdownCard
                    title="Workers by skill level"
                    description="Experience distribution across the team."
                    items={(workerData?.workersBySkillLevel ?? []).map(
                      (row) => ({
                        label: row.skillLevel || "Not set",
                        count: groupByCount(row),
                      }),
                    )}
                  />
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  tone?: "default" | "emerald" | "amber" | "blue";
}) {
  const valueClass =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "amber"
        ? "text-amber-600"
        : tone === "blue"
          ? "text-blue-600"
          : "text-slate-900";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">{icon}</div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold ${valueClass}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </article>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-slate-700">
        {icon}
        {label}
      </span>
      <span className="text-base font-bold text-slate-900">{value}</span>
    </li>
  );
}

function BreakdownCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ label: string; count: number }>;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="font-bold text-slate-900">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
