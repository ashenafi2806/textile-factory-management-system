"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";

export function ProductionManagerDashboard() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [supervisorFilter, setSupervisorFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState("30d");

  const orders = useMemo(
    () => [
      {
        id: "PO-9981",
        product: "Denim Jackets",
        target: 1800,
        progress: 72,
        stage: "Sewing",
        status: "IN_PROGRESS",
        supervisor: "Amina",
        deadline: "May 27",
      },
      {
        id: "PO-9976",
        product: "Workwear Pants",
        target: 1200,
        progress: 100,
        stage: "Packing",
        status: "COMPLETED",
        supervisor: "Daniel",
        deadline: "May 22",
      },
      {
        id: "PO-9932",
        product: "Uniform Shirts",
        target: 950,
        progress: 45,
        stage: "Cutting",
        status: "IN_PROGRESS",
        supervisor: "Amina",
        deadline: "May 29",
      },
      {
        id: "PO-9918",
        product: "Safety Vests",
        target: 650,
        progress: 12,
        stage: "Cutting",
        status: "STOPPED",
        supervisor: "Mary",
        deadline: "May 25",
      },
    ],
    [],
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;
      const matchesSupervisor =
        supervisorFilter === "ALL" || order.supervisor === supervisorFilter;
      return matchesStatus && matchesSupervisor;
    });
  }, [orders, statusFilter, supervisorFilter]);

  const alerts = [
    {
      title: "Material Shortage",
      message: "Cotton fabric running low for Denim Jackets",
      badge: "Critical",
    },
    {
      title: "Stopped Order",
      message: "PO-9918 halted on Cutting due to machine fault",
      badge: "High",
    },
    {
      title: "Machine Issue",
      message: "Sewing Line 2 requires maintenance",
      badge: "Critical",
    },
  ];

  const outputData = [
    { order: "PO-9981", good: 1280, defective: 45 },
    { order: "PO-9976", good: 1200, defective: 18 },
    { order: "PO-9932", good: 430, defective: 12 },
    { order: "PO-9918", good: 78, defective: 4 },
  ];

  const dailyTrend = [
    { label: "May 9", value: 180 },
    { label: "May 10", value: 240 },
    { label: "May 11", value: 210 },
    { label: "May 12", value: 310 },
    { label: "May 13", value: 265 },
    { label: "May 14", value: 320 },
    { label: "May 15", value: 295 },
  ];

  const statusBreakdown = [
    { status: "Planned", value: 6, color: "bg-slate-500" },
    { status: "In Progress", value: 8, color: "bg-indigo-600" },
    { status: "Completed", value: 12, color: "bg-emerald-500" },
    { status: "Stopped", value: 2, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-10">
      <section>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Active Orders"
            value="18"
            note="+3 from last week"
          />
          <MetricCard
            title="On Track vs Delayed"
            value="14 / 4"
            note="78% on track"
          />
          <MetricCard
            title="Today's Output"
            value="1,022"
            note="1,000 good / 22 defective"
          />
          <MetricCard
            title="Shortage Alerts"
            value="4"
            note="Material alerts to resolve"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <ChartCard title="Output per Order">
            <div className="space-y-4">
              {outputData.map((item) => (
                <div key={item.order} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{item.order}</span>
                    <span>{item.good + item.defective}</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${(item.good / (item.good + item.defective)) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-rose-500"
                      style={{
                        width: `${(item.defective / (item.good + item.defective)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Daily Production Trend (Last 7 days)">
            <div className="flex items-end gap-3 h-52">
              {dailyTrend.map((item) => (
                <div key={item.label} className="flex-1">
                  <div className="relative h-full rounded-3xl bg-slate-100 flex items-end">
                    <div
                      className="w-full rounded-t-3xl bg-indigo-600"
                      style={{ height: `${(item.value / 340) * 100}%` }}
                    />
                  </div>
                  <p className="mt-3 text-center text-[11px] uppercase tracking-[.24em] text-slate-400">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Orders by Status">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] items-center">
              <div className="relative h-48 w-48 mx-auto">
                <div className="absolute inset-0 rounded-full bg-slate-100" />
                <div className="absolute inset-6 rounded-full bg-white" />
                <div className="absolute inset-0 rounded-full bg-linear-to-r from-indigo-600 via-emerald-500 to-amber-500 opacity-30" />
              </div>
              <div className="space-y-3">
                {statusBreakdown.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between gap-3 text-sm text-slate-600"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full ${item.color}`}
                      />
                      <span>{item.status}</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

        <aside className="space-y-6">
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Alerts Panel
                </h3>
                <p className="text-sm text-slate-500">
                  Open issues that need attention.
                </p>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-black uppercase tracking-[.24em] text-rose-700">
                Critical
              </span>
            </div>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.title}
                  title={alert.title}
                  message={alert.message}
                  badge={alert.badge}
                />
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-4">
              Material Readiness
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Track the top material shortage that may delay upcoming
              production.
            </p>
            <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm text-slate-500 uppercase tracking-[.24em] mb-3">
                Priority shortage
              </p>
              <h4 className="text-xl font-black text-slate-900">
                Cotton fabric for Denim Jackets
              </h4>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                  Remaining stock: 120m
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Required: 200m
                </span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Production Orders
            </h3>
            <p className="text-sm text-slate-500">
              All active orders, progress, and assignment actions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="STOPPED">Stopped</option>
            </select>
            <select
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              value={supervisorFilter}
              onChange={(e) => setSupervisorFilter(e.target.value)}
            >
              <option value="ALL">All Supervisors</option>
              <option value="Amina">Amina</option>
              <option value="Daniel">Daniel</option>
              <option value="Mary">Mary</option>
            </select>
            <select
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="30d">Last 30 Days</option>
              <option value="14d">Last 14 Days</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-[.2em] text-[10px]">
                <th className="py-4 pr-6">Order #</th>
                <th className="py-4 pr-6">Product</th>
                <th className="py-4 pr-6">Target Qty</th>
                <th className="py-4 pr-6">Progress</th>
                <th className="py-4 pr-6">Stage</th>
                <th className="py-4 pr-6">Status</th>
                <th className="py-4 pr-6">Supervisor</th>
                <th className="py-4 pr-6">Deadline</th>
                <th className="py-4 pl-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="py-5 pr-6 font-bold">{order.id}</td>
                  <td className="py-5 pr-6">{order.product}</td>
                  <td className="py-5 pr-6">{order.target}</td>
                  <td className="py-5 pr-6 w-72">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[.24em] text-slate-400">
                      {order.progress}%
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-5 pr-6">{order.stage}</td>
                  <td className="py-5 pr-6">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[.24em] ${statusBadge(order.status)}`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-5 pr-6">{order.supervisor}</td>
                  <td className="py-5 pr-6">{order.deadline}</td>
                  <td className="py-5 pl-6">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="#"
                        className="rounded-3xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        View
                      </Link>
                      <Link
                        href="#"
                        className="rounded-3xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Edit
                      </Link>
                      <Link
                        href="#"
                        className="rounded-3xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                      >
                        Assign
                      </Link>
                      <button className="rounded-3xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-200">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[.24em] text-slate-400 mb-3">
        {title}
      </p>
      <h3 className="text-4xl font-black text-slate-900 mb-2">{value}</h3>
      <p className="text-sm text-slate-500">{note}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[.24em] text-slate-500">
          Live
        </span>
      </div>
      {children}
    </div>
  );
}

function AlertCard({
  title,
  message,
  badge,
}: {
  title: string;
  message: string;
  badge: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h4 className="font-black text-slate-900">{title}</h4>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-black uppercase tracking-[.2em] text-rose-700">
          {badge}
        </span>
      </div>
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-indigo-100 text-indigo-700";
    case "STOPPED":
      return "bg-amber-100 text-amber-700";
    case "PLANNED":
    default:
      return "bg-slate-100 text-slate-700";
  }
}
