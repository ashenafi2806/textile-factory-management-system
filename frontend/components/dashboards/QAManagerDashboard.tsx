"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useCanPerform } from "@/hooks/useCanPerform";

type Stage = {
  id: string;
  stageName: string;
  status: string;
  completedAt?: string | null;
  completedBy?: { username?: string } | null;
  reviewedBy?: { username?: string } | null;
  reviewedAt?: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  deadline: string;
  targetQuantity: number;
  assignedSupervisor?: { username?: string };
  stages?: Stage[];
};

export function QAManagerDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [qualityReport, setQualityReport] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const canReleaseOrder = useCanPerform(["QA_MANAGER", "ADMIN"]);

  const load = async () => {
    const [dashRes, thrRes, ordersRes] = await Promise.all([
      api.get("/api/production/qa/dashboard"),
      api.get("/api/production/qa/thresholds"),
      api.get("/api/production"),
    ]);
    const reportRes = await api.get("/api/production/reports/quality");
    setDashboard(dashRes.data);
    setThresholds(thrRes.data);
    setOrders(ordersRes.data);
    setQualityReport(reportRes.data);
  };

  useEffect(() => {
    void load().catch(() => {});
    const timer = window.setInterval(() => void load().catch(() => {}), 10000);
    return () => window.clearInterval(timer);
  }, []);

  const pendingStages = useMemo(
    () =>
      orders.flatMap((order) =>
        (order.stages ?? [])
          .filter((stage) => stage.status === "QA_PENDING")
          .map((stage) => ({
            ...stage,
            orderId: order.id,
            orderNumber: order.orderNumber,
            productName: order.productName,
            supervisor: order.assignedSupervisor?.username || "Not Assigned",
          })),
      ),
    [orders],
  );

  const releaseReadyOrders = useMemo(
    () =>
      orders.filter((order) => {
        const stages = order.stages ?? [];
        return (
          stages.length > 0 &&
          stages.every((stage) => stage.status === "QA_APPROVED") &&
          order.status !== "COMPLETED"
        );
      }),
    [orders],
  );

  const releaseOrder = async (orderId: string) => {
    setBusy(orderId);
    try {
      await api.post(`/production/${orderId}/release`);
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Inspections" value={dashboard?.totalInspections ?? 0} />
        <Metric title="Total Defects" value={dashboard?.totalDefects ?? 0} />
        <Metric
          title="Defect Rate"
          value={`${((dashboard?.defectRate ?? 0) * 100).toFixed(2)}%`}
        />
        <Metric
          title="Stages Tracked"
          value={Object.keys(dashboard?.byStage ?? {}).length}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
                Final release queue
              </p>
              <h2 className="text-xl font-black text-slate-900">
                Release finished orders to inventory
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="text-sm font-black text-indigo-600"
            >
              Open QA staff queue
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[.2em] text-slate-500">
                  <th className="py-3 pr-5">Order #</th>
                  <th className="py-3 pr-5">Product</th>
                  <th className="py-3 pr-5">Deadline</th>
                  <th className="py-3 pr-5">Supervisor</th>
                  <th className="py-3 pl-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {releaseReadyOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-4 pr-5 font-black text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-4 pr-5 text-slate-700">
                      {order.productName}
                    </td>
                    <td className="py-4 pr-5 text-slate-700">
                      {new Date(order.deadline).toLocaleDateString()}
                    </td>
                    <td className="py-4 pr-5 text-slate-700">
                      {order.assignedSupervisor?.username || "Not Assigned"}
                    </td>
                    <td className="py-4 pl-5">
                      {canReleaseOrder ? (
                        <button
                          onClick={() => releaseOrder(order.id)}
                          disabled={busy === order.id}
                          className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-white disabled:opacity-50"
                        >
                          Release
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          View only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
              QA Analytics
            </p>
            <h3 className="text-lg font-black text-slate-900">
              Defect trend by stage
            </h3>
            <div className="mt-4 space-y-3">
              {Object.entries(dashboard?.byStage ?? {}).map(
                ([stage, data]: any) => (
                  <div
                    key={stage}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-black text-slate-900">{stage}</p>
                      <p className="text-sm text-slate-600">
                        {data.defects} defects
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {data.inspections} inspections · {data.passes} passes ·{" "}
                      {data.rejects} rejects
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
              Quality KPI Report
            </p>
            <h3 className="text-lg font-black text-slate-900">
              Pass rate and trend analysis
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
                  Pass Rate
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-600">
                  {qualityReport?.passRate ?? 0}%
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
                  Total Inspections
                </p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {qualityReport?.totalInspections ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {(qualityReport?.defectTrend ?? []).map((item: any) => (
                <div
                  key={item.week}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-black text-slate-900">{item.week}</p>
                    <p className="text-sm text-slate-600">
                      {item.defectRate}% defect rate
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {(qualityReport?.topDefectTypes ?? []).map((item: any) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="font-medium text-slate-700">
                    {item.type}
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">
              Quality thresholds
            </h3>
            <div className="mt-4 space-y-3">
              {thresholds.map((t) => (
                <div key={t.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-black text-slate-900">{t.stageName}</p>
                  <p className="text-sm text-slate-600">
                    Max defects/100: {t.maxDefectsPerHundred}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t.acceptanceCriteria}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">
              Final Release Queue
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Orders with all stages QA-approved and ready for finished goods
              release.
            </p>
            <div className="mt-4 space-y-3">
              {releaseReadyOrders.map((order) => (
                <div key={order.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-slate-500">
                        {order.productName}
                      </p>
                    </div>
                    {canReleaseOrder ? (
                      <button
                        onClick={() => releaseOrder(order.id)}
                        disabled={busy === order.id}
                        className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-white disabled:opacity-50"
                      >
                        Release
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">View only</span>
                    )}
                  </div>
                </div>
              ))}
              {releaseReadyOrders.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No orders ready for release.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[.24em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
