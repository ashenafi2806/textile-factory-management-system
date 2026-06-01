"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { OrderStatusBadge } from "@/components/production/OrderStatusBadge";

type Stage = {
  id: string;
  stageName: string;
  stageOrder: number;
  status: string;
  completedAt?: string | null;
  reviewedAt?: string | null;
  completedBy?: { username?: string } | null;
  reviewedBy?: { username?: string } | null;
};

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  status: string;
  currentStage?: string | null;
  targetQuantity: number;
  assignedSupervisor?: { username?: string } | null;
  stages: Stage[];
  totalDefectiveRecorded?: number;
  remainingGood?: number;
  releaseRequestStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
};

export function ProductionSupervisorDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const res = await api.get("/api/production");
    setOrders(res.data);
    setLoading(false);
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await api.get("/api/production");
      if (alive) {
        setOrders(res.data);
        setLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const assignedOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status !== "COMPLETED" && order.status !== "CANCELLED",
      ),
    [orders],
  );

  const activeOrder = assignedOrders.find((order) =>
    order.stages.some(
      (stage) =>
        stage.status === "IN_PROGRESS" || stage.status === "QA_PENDING",
    ),
  );

  const readyForRelease = assignedOrders.filter(
    (order) =>
      order.status !== "COMPLETED" &&
      order.stages.length > 0 &&
      order.stages.every((stage) => stage.status === "QA_APPROVED") &&
      (order.releaseRequestStatus ?? "NONE") === "NONE",
  ).length;

  const pendingReleaseRequests = assignedOrders.filter(
    (order) => order.releaseRequestStatus === "PENDING",
  ).length;

  const kpis = [
    { title: "Active Orders", value: assignedOrders.length },
    {
      title: "Ready for Release",
      value: readyForRelease,
      tone: readyForRelease > 0 ? "indigo" : "slate",
    },
    {
      title: "Pending Release",
      value: pendingReleaseRequests,
      tone: pendingReleaseRequests > 0 ? "amber" : "slate",
    },
    { title: "Remaining Good", value: activeOrder?.remainingGood ?? 0 },
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
        Loading supervisor dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const tone =
            (item as { tone?: "indigo" | "amber" | "slate" }).tone ?? "slate";
          const toneClass =
            tone === "indigo"
              ? "text-indigo-600"
              : tone === "amber"
                ? "text-amber-600"
                : "text-slate-900";
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-[10px] font-black uppercase tracking-[.24em] text-slate-400">
                {item.title}
              </p>
              <p className={`mt-2 text-2xl font-black ${toneClass}`}>
                {item.value}
              </p>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
              My Orders
            </p>
            <h2 className="text-xl font-black text-slate-900">
              Assigned production orders
            </h2>
          </div>
          <Link
            href="/production"
            className="text-sm font-black text-indigo-600"
          >
            View all
          </Link>
        </div>

        <div className="space-y-4">
          {assignedOrders.map((order) => {
            const activeStage = order.stages.find(
              (stage) =>
                stage.status === "IN_PROGRESS" || stage.status === "QA_PENDING",
            );
            const defects = order.totalDefectiveRecorded ?? 0;
            const remaining = order.remainingGood ?? order.targetQuantity;

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {order.orderNumber}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {order.productName} | Supervisor{" "}
                      {order.assignedSupervisor?.username || "Not assigned"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Current stage:{" "}
                      <span className="font-semibold text-slate-900">
                        {activeStage?.stageName || "Pending"}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Remaining good:{" "}
                      <span className="font-semibold text-emerald-700">
                        {remaining}
                      </span>{" "}
                      | Defects:{" "}
                      <span className="font-semibold text-rose-600">
                        {defects}
                      </span>
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.releaseRequestStatus &&
                  order.releaseRequestStatus !== "NONE" ? (
                    <span
                      className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-wider ${
                        order.releaseRequestStatus === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : order.releaseRequestStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      Release: {order.releaseRequestStatus}
                    </span>
                  ) : null}
                  <Link
                    href={`/production/${order.id}`}
                    className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                  >
                    View
                  </Link>
                  <Link
                    href={`/production/${order.id}/stages`}
                    className="rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700"
                  >
                    Stages
                  </Link>
                  <Link
                    href={`/production/${order.id}/output`}
                    className="rounded-2xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-200"
                  >
                    Output
                  </Link>
                  <Link
                    href={`/production/${order.id}/issues`}
                    className="rounded-2xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-700 hover:bg-amber-200"
                  >
                    Issues
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
