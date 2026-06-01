"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useCanPerform } from "@/hooks/useCanPerform";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";
import {
  Badge,
  Button,
} from "@/components/modules/inventory/ui";
import toast from "react-hot-toast";

type Stage = {
  id: string;
  stageName: string;
  status: string;
  completedAt?: string | null;
  reviewedBy?: { username?: string } | null;
};

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  productCode: string;
  deadline: string;
  status: string;
  targetQuantity: number;
  assignedSupervisor?: { username?: string } | null;
  stages?: Stage[];
};

export default function StorekeeperReleaseQueuePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { contentOffset, isDesktop } = useSidebar();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"RELEASABLE" | "ALL">("RELEASABLE");

  const canView = useCanPerform([
    "STOREKEEPER",
    "QA_MANAGER",
    "ADMIN",
  ]);
  const canRelease = useCanPerform([
    "STOREKEEPER",
    "QA_MANAGER",
    "ADMIN",
  ]);

  const ordersQuery = useQuery({
    queryKey: ["storekeeper-release-orders"],
    queryFn: async () => {
      const res = await api.get("/production");
      return (res.data ?? []) as Order[];
    },
    enabled: canView,
    refetchInterval: 15000,
  });

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

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

  const displayedOrders =
    filter === "RELEASABLE" ? releaseReadyOrders : orders;

  const releaseOrder = async (order: Order) => {
    if (
      !window.confirm(
        `Approve ${order.orderNumber} (${order.productName}) for storage? This will add the produced quantity to finished-goods inventory.`,
      )
    ) {
      return;
    }
    setBusy(order.id);
    try {
      await api.post(`/production/${order.id}/release`);
      toast.success(`${order.orderNumber} released to finished goods`);
      await queryClient.invalidateQueries({
        predicate: (q) =>
          String(q.queryKey[0]).startsWith("storekeeper") ||
          String(q.queryKey[0]).startsWith("inventory"),
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        e?.response?.data?.message || e?.message || "Release failed";
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-slate-900" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8">
            <h1 className="text-3xl font-black tracking-tight text-rose-800">
              Access Denied
            </h1>
            <p className="mt-2 text-sm font-medium text-rose-700">
              The finished-goods release queue is restricted to Storekeepers,
              QA Managers, and Admins.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <main
        style={
          isDesktop
            ? {
                marginLeft: contentOffset,
                width: `calc(100% - ${contentOffset}px)`,
              }
            : undefined
        }
        className="w-full px-4 pt-20 md:pt-24 pb-8 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-indigo-600">
                Storekeeper
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                Finished Goods Release Queue
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
                Approve fully QA-inspected production orders to add the produced
                quantity into finished-goods inventory.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "RELEASABLE" ? "primary" : "secondary"}
                onClick={() => setFilter("RELEASABLE")}
              >
                Ready to release ({releaseReadyOrders.length})
              </Button>
              <Button
                variant={filter === "ALL" ? "primary" : "secondary"}
                onClick={() => setFilter("ALL")}
              >
                All orders ({orders.length})
              </Button>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Awaiting release" value={String(releaseReadyOrders.length)} accent="indigo" />
            <KpiCard
              title="QA-approved orders"
              value={String(
                orders.filter((o) =>
                  (o.stages ?? []).some((s) => s.status === "QA_APPROVED"),
                ).length,
              )}
            />
            <KpiCard
              title="Completed"
              value={String(
                orders.filter((o) => o.status === "COMPLETED").length,
              )}
            />
            <KpiCard
              title="In production"
              value={String(
                orders.filter((o) => o.status === "IN_PROGRESS").length,
              )}
            />
          </section>

          <section className="mt-8 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            {ordersQuery.isLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-3xl bg-slate-100"
                  />
                ))}
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm font-medium text-slate-500">
                {filter === "RELEASABLE"
                  ? "No orders are currently ready for release. Once QA approves every stage, they will appear here."
                  : "No production orders found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="py-3 pr-5">Order #</th>
                      <th className="py-3 pr-5">Product</th>
                      <th className="py-3 pr-5">Target Qty</th>
                      <th className="py-3 pr-5">Supervisor</th>
                      <th className="py-3 pr-5">Stage Status</th>
                      <th className="py-3 pl-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedOrders.map((order) => {
                      const stages = order.stages ?? [];
                      const allApproved =
                        stages.length > 0 &&
                        stages.every((s) => s.status === "QA_APPROVED");
                      const isCompleted = order.status === "COMPLETED";
                      return (
                        <tr key={order.id}>
                          <td className="py-4 pr-5 font-black text-slate-900">
                            {order.orderNumber}
                          </td>
                          <td className="py-4 pr-5">
                            <div className="font-semibold text-slate-900">
                              {order.productName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {order.productCode}
                            </div>
                          </td>
                          <td className="py-4 pr-5 text-slate-700">
                            {order.targetQuantity}
                          </td>
                          <td className="py-4 pr-5 text-slate-700">
                            {order.assignedSupervisor?.username || "—"}
                          </td>
                          <td className="py-4 pr-5">
                            {isCompleted ? (
                              <Badge variant="green">Released</Badge>
                            ) : allApproved ? (
                              <Badge variant="green">All stages QA-approved</Badge>
                            ) : (
                              <Badge variant="amber">Awaiting QA approval</Badge>
                            )}
                          </td>
                          <td className="py-4 pl-5 text-right">
                            {isCompleted ? (
                              <span className="text-xs text-slate-400">
                                In finished-goods inventory
                              </span>
                            ) : allApproved && canRelease ? (
                              <button
                                onClick={() => releaseOrder(order)}
                                disabled={busy === order.id}
                                className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-white hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {busy === order.id
                                  ? "Releasing…"
                                  : "Approve for storage"}
                              </button>
                            ) : (
                              <Link
                                href={`/production/${order.id}`}
                                className="text-xs font-black uppercase tracking-[.24em] text-indigo-600 hover:underline"
                              >
                                View order
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function KpiCard({
  title,
  value,
  accent = "slate",
}: {
  title: string;
  value: string;
  accent?: "slate" | "indigo";
}) {
  const styles: Record<string, string> = {
    slate: "border-slate-200 bg-white text-slate-900",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };
  return (
    <div className={`rounded-[2rem] border p-6 shadow-sm ${styles[accent]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-70">
        {title}
      </p>
      <p className="mt-3 text-4xl font-black tracking-tight">{value}</p>
    </div>
  );
}
