"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import api from "@/lib/api";

type ProductionOrder = {
  id: string;
  orderNumber: string;
  productName: string;
  targetQuantity: number;
  status: string;
  deadline: string;
  assignedSupervisor?: { username: string } | null;
  stages?: Array<{ stageName: string; status: string }>;
};

export function ProductionManagerDashboard() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [supervisorFilter, setSupervisorFilter] = useState("ALL");
  const [status, setStatus] = useState(statusFilter);
  const [supervisor, setSupervisor] = useState(supervisorFilter);
  const [dateRange, setDateRange] = useState("30d");

  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [ordersRes, summaryRes, perfRes] = await Promise.all([
          api.get("/production"),
          api.get("/production/reports/summary"),
          api.get("/production/reports/performance"),
        ]);
        setOrders(ordersRes.data);
        setSummary(summaryRes.data);
        setPerformance(perfRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;
      const matchesSupervisor =
        supervisorFilter === "ALL" || (order.assignedSupervisor?.username === supervisorFilter);
      return matchesStatus && matchesSupervisor;
    });
  }, [orders, statusFilter, supervisorFilter]);

  // Derived outputs per stage (for the chart)
  const outputData = useMemo(() => {
    if (!performance || !performance.byStage) return [];
    return Object.keys(performance.byStage).map((stageName) => ({
      stageName,
      good: performance.byStage[stageName].good,
      defective: performance.byStage[stageName].defective,
    }));
  }, [performance]);

  if (loading) {
    return <div className="p-10 text-slate-500 font-bold">Loading dashboard...</div>;
  }

  const statusBreakdown = summary ? [
    { status: "Completed", value: summary.completed, color: "bg-emerald-500" },
    { status: "In Progress", value: summary.inProgress, color: "bg-indigo-600" },
    { status: "Total Open Issues", value: summary.openIssues, color: "bg-rose-500" },
    { status: "Cancelled", value: summary.cancelled, color: "bg-amber-500" },
  ] : [];

  return (
    <div className="space-y-10">
      <section>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Active Orders"
            value={summary ? summary.inProgress.toString() : "0"}
            note="Orders currently IN_PROGRESS"
          />
          <MetricCard
            title="Completed Orders"
            value={summary ? summary.completed.toString() : "0"}
            note="Successfully completed"
          />
          <MetricCard
            title="Overall Output"
            value={performance ? performance.totalGood.toString() : "0"}
            note={`${performance ? performance.totalDefective : 0} defective items recorded`}
          />
          <MetricCard
            title="Open Issues"
            value={summary ? summary.openIssues.toString() : "0"}
            note="Issues needing attention"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <ChartCard title="Total Output by Stage">
            <div className="space-y-4">
              {outputData.length > 0 ? outputData.map((item) => {
                const total = item.good + item.defective;
                const goodPct = total > 0 ? (item.good / total) * 100 : 0;
                const defPct = total > 0 ? (item.defective / total) * 100 : 0;
                return (
                  <div key={item.stageName} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>{item.stageName}</span>
                      <span>{total} items</span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 float-left"
                        style={{ width: `${goodPct}%` }}
                      />
                      <div
                        className="h-full bg-rose-500 float-left"
                        style={{ width: `${defPct}%` }}
                      />
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-slate-400">No output recorded yet.</p>
              )}
            </div>
          </ChartCard>

          <ChartCard title="Overall Status Overview">
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
                  Defect Rate Insights
                </h3>
                <p className="text-sm text-slate-500">
                  Current production quality
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="font-black text-slate-900">Overall Defect Rate</h4>
                <p className="text-2xl font-black mt-2 text-rose-600">
                  {performance && performance.defectRate !== undefined ? (performance.defectRate * 100).toFixed(2) : 0}%
                </p>
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
              All active orders, progress, and assignments.
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
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-5 text-center text-slate-400">No orders found.</td>
                </tr>
              ) : filteredOrders.map((order) => {
                const completedStages = order.stages?.filter(s => s.status === 'COMPLETED' || s.status === 'QA_APPROVED').length || 0;
                const totalStages = order.stages?.length || 4;
                const progressPct = Math.round((completedStages / totalStages) * 100);
                const currentStageName = order.stages?.find(s => s.status === "IN_PROGRESS")?.stageName || "Pending";

                return (
                  <tr key={order.id}>
                    <td className="py-5 pr-6 font-bold">{order.orderNumber}</td>
                    <td className="py-5 pr-6">{order.productName}</td>
                    <td className="py-5 pr-6">{order.targetQuantity}</td>
                    <td className="py-5 pr-6 w-72">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[.24em] text-slate-400">
                        {progressPct}%
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-5 pr-6 text-xs">{currentStageName}</td>
                    <td className="py-5 pr-6">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[.24em] ${statusBadge(order.status)}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-5 pr-6">{order.assignedSupervisor?.username || "Unassigned"}</td>
                    <td className="py-5 pr-6">{new Date(order.deadline).toLocaleDateString()}</td>
                    <td className="py-5 pl-6">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/production/${order.id}`}
                          className="rounded-3xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
