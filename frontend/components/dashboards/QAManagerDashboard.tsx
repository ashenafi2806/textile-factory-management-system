"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type Stage = {
  stageName: string;
  status: string;
  reviewedBy?: { username?: string } | null;
  reviewedAt?: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  targetQuantity: number;
  status: string;
  stages: Stage[];
  totalDefectiveRecorded?: number;
  netGood?: number;
  remainingGood?: number;
};

export function QAManagerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await api.get("/production");
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

  const qaApproved = useMemo(
    () => orders.filter((order) => order.stages.some((stage) => stage.status === "QA_APPROVED")),
    [orders],
  );
  const qaPending = useMemo(
    () => orders.filter((order) => order.stages.some((stage) => stage.status === "QA_PENDING")),
    [orders],
  );
  const qaRejected = useMemo(
    () => orders.filter((order) => order.stages.some((stage) => stage.status === "QA_REJECTED")),
    [orders],
  );

  const kpis = [
    { title: "QA Pending", value: qaPending.length },
    { title: "QA Approved", value: qaApproved.length },
    { title: "QA Rejected", value: qaRejected.length },
    { title: "Live Orders", value: orders.filter((order) => order.status !== "COMPLETED" && order.status !== "CANCELLED").length },
  ];

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Loading QA manager dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-slate-400">{item.title}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">QA Overview</p>
              <h2 className="text-xl font-black text-slate-900">Orders by QA state</h2>
            </div>
            <Link href="/production/qa" className="text-sm font-black text-indigo-600">
              Open QA queue
            </Link>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 8).map((order) => {
              const qaStage = order.stages.find((stage) => stage.status.startsWith("QA_"));
              return (
                <div key={order.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">{order.orderNumber}</p>
                      <p className="text-sm text-slate-500">{order.productName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">
                        {qaStage ? qaStage.stageName : "No QA stage"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.remainingGood ?? order.targetQuantity} good remaining
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Release Summary</h3>
            <div className="mt-4 space-y-3">
              <SummaryRow label="Ready to release" value={qaApproved.length} />
              <SummaryRow label="Need review" value={qaPending.length} />
              <SummaryRow label="Rejected" value={qaRejected.length} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Quality controls</h3>
            <p className="mt-2 text-sm text-slate-500">
              Use the QA queue to approve or reject stage outputs, and keep the production flow moving with live review status.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}
