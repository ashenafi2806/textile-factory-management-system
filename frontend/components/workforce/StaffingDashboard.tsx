"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { useStaffingDashboard, useDepartments } from "@/hooks/useStaffing";
import { useAuth } from "@/context/auth-context";

type PositionGap = {
  position: string;
  approved: number;
  current: number;
  gap: number;
  department?: string;
};

type DeptSummary = {
  department: string;
  headcount: number;
  openRequisitions: number;
  approvedToHire: number;
  gaps: PositionGap[];
};

type StaffingData = {
  scope?: "organization" | "department";
  message?: string;
  department?: string | null;
  headcount: number;
  openRequisitions?: number;
  approvedToHire?: number;
  workersByPosition?: Record<string, number>;
  approvedPositions?: Array<{ position: string; count: number }>;
  pendingByRole?: Array<{ position: string; count: number }>;
  gaps?: PositionGap[];
  departments?: DeptSummary[];
  recommendations?: string[];
};

function formatRole(role: string) {
  return role.replace(/_/g, " ");
}

export default function StaffingDashboard() {
  const { user } = useAuth();
  const isAdmin =
    user?.roles?.includes("ADMIN") || user?.roles?.includes("HR_ADMIN");
  const [selectedDept, setSelectedDept] = useState<string>("");

  const { data: departmentsList = [] } = useDepartments();
  const { data, isLoading, isError } = useStaffingDashboard(
    isAdmin && selectedDept ? selectedDept : undefined,
  );

  const staffing = data as StaffingData | undefined;

  const isOrgView = staffing?.scope === "organization" && !selectedDept;

  const gapCount = useMemo(() => {
    if (!staffing?.gaps) return 0;
    return staffing.gaps.reduce((sum, g) => sum + g.gap, 0);
  }, [staffing]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (isError || !staffing) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        Failed to load staffing data. Please try again later.
      </div>
    );
  }

  if (staffing.message && !staffing.department && !isOrgView) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h3 className="font-bold text-amber-900">Setup required</h3>
        <p className="mt-2 text-sm text-amber-800">{staffing.message}</p>
        <Link
          href="/admin/workforce"
          className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Go to workforce admin →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">
              {isOrgView
                ? "Organization-wide staffing overview"
                : `Department: ${selectedDept}`}
            </p>
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            <option value="">All departments</option>
            {departmentsList.map((d: { id: string; name: string }) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Current headcount"
          value={staffing.headcount}
          hint="Active employee profiles in scope"
        />
        <MetricCard
          icon={<Clock className="h-5 w-5" />}
          label="Pending requisitions"
          value={staffing.openRequisitions ?? 0}
          hint="Awaiting HR approval"
          variant={(staffing.openRequisitions ?? 0) > 0 ? "amber" : "default"}
        />
        <MetricCard
          icon={<Briefcase className="h-5 w-5" />}
          label="Approved to hire"
          value={staffing.approvedToHire ?? gapCount}
          hint="Positions approved, not yet filled"
          variant={(staffing.approvedToHire ?? 0) > 0 ? "indigo" : "default"}
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Hiring gaps"
          value={staffing.gaps?.length ?? 0}
          hint="Roles with approved headcount backlog"
          variant={(staffing.gaps?.length ?? 0) > 0 ? "danger" : "green"}
        />
      </section>

      {isOrgView && staffing.departments ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Department breakdown
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Headcount and hiring pipeline by department.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {staffing.departments.map((dept) => (
              <button
                key={dept.department}
                type="button"
                onClick={() => setSelectedDept(dept.department)}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-slate-900">
                    {dept.department}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{dept.headcount}</p>
                    <p className="text-slate-400">Staff</p>
                  </div>
                  <div>
                    <p className="font-bold text-amber-700">
                      {dept.openRequisitions}
                    </p>
                    <p className="text-slate-400">Pending</p>
                  </div>
                  <div>
                    <p className="font-bold text-indigo-700">
                      {dept.approvedToHire}
                    </p>
                    <p className="text-slate-400">To hire</p>
                  </div>
                </div>
                {dept.gaps.length > 0 ? (
                  <p className="mt-2 text-xs font-medium text-rose-600">
                    {dept.gaps.length} role gap(s)
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-medium text-emerald-600">
                    Fully staffed
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Headcount by position" subtitle="Current team composition">
          <PositionList
            items={Object.entries(staffing.workersByPosition ?? {})
              .map(([position, count]) => ({ position, count }))
              .sort((a, b) => b.count - a.count)}
            empty="No workers in this scope yet."
          />
        </Panel>

        <Panel
          title="Pending approval"
          subtitle="Open hiring requisitions by role"
        >
          <PositionList
            items={staffing.pendingByRole ?? []}
            empty="No requisitions awaiting approval."
            valueClass="text-amber-700"
          />
        </Panel>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Approved hiring gaps
            </h2>
            <p className="text-sm text-slate-500">
              Positions HR has approved — recruitment should proceed for these
              roles.
            </p>
          </div>
        </div>

        {!staffing.gaps || staffing.gaps.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6">
            <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800">
                No approved hiring backlog
              </p>
              <p className="text-sm text-emerald-700">
                All approved positions are either filled or no requisitions have
                been approved yet.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {staffing.gaps.map((g) => (
              <li
                key={`${g.department ?? ""}-${g.position}`}
                className="rounded-xl border border-rose-100 bg-rose-50/50 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">
                      {formatRole(g.position)}
                    </p>
                    {g.department ? (
                      <p className="text-xs text-slate-500">{g.department}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-slate-600">
                      {g.current} currently employed · {g.approved} approved to
                      hire
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-rose-600 px-3 py-1 text-sm font-bold text-white">
                      Hire {g.gap}
                    </span>
                    <Link
                      href="/manager/hiring-requests"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      View reqs →
                    </Link>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(100, g.current > 0 ? (g.current / (g.current + g.gap)) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {staffing.recommendations && staffing.recommendations.length > 0 ? (
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 sm:p-6">
          <h2 className="font-bold text-indigo-900">Recommendations</h2>
          <ul className="mt-3 space-y-2">
            {staffing.recommendations.map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-indigo-800"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                {rec}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  variant?: "default" | "amber" | "indigo" | "danger" | "green";
}) {
  const styles = {
    default: "border-slate-200 bg-white",
    amber: "border-amber-200 bg-amber-50/60",
    indigo: "border-indigo-200 bg-indigo-50/60",
    danger: "border-rose-200 bg-rose-50/60",
    green: "border-emerald-200 bg-emerald-50/60",
  };
  const iconStyles = {
    default: "bg-slate-100 text-slate-600",
    amber: "bg-amber-100 text-amber-600",
    indigo: "bg-indigo-100 text-indigo-600",
    danger: "bg-rose-100 text-rose-600",
    green: "bg-emerald-100 text-emerald-600",
  };

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${styles[variant]}`}>
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconStyles[variant]}`}
      >
        {icon}
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PositionList({
  items,
  empty,
  valueClass = "text-slate-900",
}: {
  items: Array<{ position: string; count: number }>;
  empty: string;
  valueClass?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }

  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.position}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-slate-700">
              {formatRole(item.position)}
            </span>
            <span className={`font-bold ${valueClass}`}>{item.count}</span>
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
  );
}
