"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { maintenanceApi } from "@/lib/api/maintenance";
import { Card } from "@/components/modules/maintenance/ui";

function hasRole(roles: string[] | undefined, allowed: string[]) {
  if (!roles?.length) return false;
  if (roles.includes("ADMIN")) return true;
  return Boolean(roles.some((role) => allowed.includes(role)));
}

function formatMinutes(minutes: number) {
  const total = Math.max(0, Math.round(minutes || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${mins}m`;
}

function groupCount(
  rows:
    | Array<
        { count?: number; _count?: { id?: number } } & Record<string, string>
      >
    | undefined,
  field: string,
  value: string,
) {
  const row = rows?.find((item) => item[field] === value);
  if (!row) return 0;
  return row.count ?? row._count?.id ?? 0;
}

export default function MaintenanceReportsPage() {
  const { user } = useAuth();
  const canManage = hasRole(user?.roles, ["MAINTENANCE_MANAGER", "ADMIN"]);

  const analyticsQuery = useQuery({
    queryKey: ["maintenance-analytics"],
    queryFn: () => maintenanceApi.getAnalytics(),
    enabled: canManage,
  });

  const advancedQuery = useQuery({
    queryKey: ["maintenance-advanced-reports"],
    queryFn: () => maintenanceApi.getAdvancedReports(90),
    enabled: canManage,
  });

  if (!user) return null;

  if (!canManage) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-slate-500">Maintenance reports are for managers only.</p>
      </main>
    );
  }

  const analytics = analyticsQuery.data;
  const advanced = advancedQuery.data;
  const current = advanced?.current;
  const prior = advanced?.prior;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-600">
            Maintenance Reports
          </p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">
            Reliability & cost overview
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            MTTR, MTBF, downtime, and spare-part usage (90-day window).
          </p>
        </div>
        <Link
          href="/maintenance"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"
        >
          ← Dashboard
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total tasks" value={String(analytics?.total ?? 0)} />
        <MetricCard
          label="Completed"
          value={String(analytics?.totalCompleted ?? 0)}
        />
        <MetricCard
          label="Overdue"
          value={String(analytics?.overdueCount ?? 0)}
        />
        <MetricCard
          label="Avg days to complete"
          value={String(Math.round(analytics?.avgDaysToComplete ?? 0))}
        />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-4">
        <MetricCard label="MTTR" value={formatMinutes(current?.mttrMinutes ?? 0)} />
        <MetricCard
          label="MTBF"
          value={`${(current?.mtbfDays ?? 0).toFixed(1)} days`}
        />
        <MetricCard
          label="Downtime"
          value={formatMinutes(current?.totalDowntimeMinutes ?? 0)}
        />
        <MetricCard
          label="Spare cost"
          value={new Intl.NumberFormat("en-ET", {
            style: "currency",
            currency: "ETB",
          }).format(current?.totalSpareCost ?? 0)}
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-black text-slate-900">Tasks by status</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(analytics?.byStatus ?? []).map((row) => (
              <li
                key={row.status}
                className="flex justify-between border-b border-slate-100 py-2"
              >
                <span className="font-semibold">{row.status}</span>
                <span>{row.count ?? groupCount(analytics?.byStatus, "status", row.status)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-black text-slate-900">
            Technician performance
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(analytics?.perTechnician ?? []).map((row) => (
              <li
                key={row.technicianId ?? row.username ?? "unknown"}
                className="flex justify-between border-b border-slate-100 py-2"
              >
                <span>{row.username ?? "Unassigned"}</span>
                <span>
                  {row.completedCount} done · {formatMinutes(row.avgTimeSpentMins)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-black text-slate-900">Top spare parts</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(analytics?.topSpareParts ?? []).map((row) => (
              <li
                key={row.itemId}
                className="flex justify-between border-b border-slate-100 py-2"
              >
                <span>{row.name}</span>
                <span>{row.totalUsed}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-black text-slate-900">Top failing equipment</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(analytics?.topEquipmentFailures ?? []).map((row) => (
              <li
                key={row.equipmentName}
                className="flex justify-between border-b border-slate-100 py-2"
              >
                <span>{row.equipmentName}</span>
                <span>{row.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {prior && current ? (
        <Card className="mt-8 p-6">
          <h2 className="text-lg font-black text-slate-900">Period comparison</h2>
          <p className="mt-1 text-sm text-slate-500">
            Current {advanced?.periodDays ?? 90} days vs prior period
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <p className="text-sm">
              Downtime: {formatMinutes(current.totalDowntimeMinutes)} (was{" "}
              {formatMinutes(prior.totalDowntimeMinutes)})
            </p>
            <p className="text-sm">
              Spare cost:{" "}
              {new Intl.NumberFormat("en-ET", {
                style: "currency",
                currency: "ETB",
              }).format(current.totalSpareCost)}{" "}
              (was{" "}
              {new Intl.NumberFormat("en-ET", {
                style: "currency",
                currency: "ETB",
              }).format(prior.totalSpareCost)}
              )
            </p>
          </div>
        </Card>
      ) : null}
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5 text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </Card>
  );
}
