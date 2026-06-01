"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";

type Stage = {
  id: string;
  stageName: string;
  stageOrder: number;
  status: string;
};

type ProductionOrder = {
  id: string;
  orderNumber: string;
  productName: string;
  targetQuantity: number;
  status: string;
  currentStage?: string | null;
  stages?: Stage[];
};

export default function ProductionStagesPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const loadOrders = async () => {
      try {
        const res = await api.get("/api/production");
        if (!alive) return;
        const activeOrders = (res.data as ProductionOrder[]).filter(
          (order) => order.status !== "COMPLETED",
        );
        setOrders(activeOrders);
      } finally {
        if (alive) setLoading(false);
      }
    };

    void loadOrders();
    const timer = window.setInterval(() => void loadOrders(), 5000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const activeCount = useMemo(
    () => orders.filter((order) => order.status !== "COMPLETED").length,
    [orders],
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
              Production Floor
            </p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Active Production Orders
            </h1>
            <p className="mt-2 text-slate-500">
              Showing every order that is not completed yet, so supervisors can
              manage the live stage flow.
            </p>
          </div>

          {loading ? (
            <div className="rounded-4xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
              Loading active orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-4xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
              <h3 className="text-xl font-black text-slate-900">
                No active production orders
              </h3>
              <p className="mt-2 text-slate-500">
                All orders are completed right now.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm font-black uppercase tracking-[.24em] text-slate-400">
                {activeCount} active order(s)
              </div>
              <div className="grid gap-6">
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[.24em] text-indigo-500">
                          {order.orderNumber}
                        </div>
                        <Link
                          href={`/production/${order.id}`}
                          className="mt-1 block text-2xl font-black text-slate-900 hover:text-indigo-600"
                        >
                          {order.productName}
                        </Link>
                        <p className="mt-1 text-sm text-slate-500">
                          Target quantity: {order.targetQuantity} units
                        </p>
                      </div>
                      <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black uppercase tracking-[.2em] text-slate-700">
                        {order.status.replace(/_/g, " ")}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                      {(order.stages ?? []).map((stage) => (
                        <div
                          key={stage.id}
                          className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
                            Stage {stage.stageOrder}
                          </p>
                          <p className="mt-2 font-black text-slate-900">
                            {stage.stageName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {stage.status.replace(/_/g, " ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
