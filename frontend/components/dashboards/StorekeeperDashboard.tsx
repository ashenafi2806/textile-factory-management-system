"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { UnreadNotificationsPanel } from "@/components/notifications/UnreadNotificationsPanel";
import { inventoryApi, type AlertItem } from "@/lib/api/inventory";

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  productCode: string;
  status: string;
  targetQuantity: number;
  deadline: string;
  assignedSupervisor?: { username?: string } | null;
  stages?: Array<{ id: string; status: string }>;
};

export function StorekeeperDashboard() {
  const [stats, setStats] = useState({ items: 0, alerts: 0 });
  const [spareAlerts, setSpareAlerts] = useState<AlertItem[]>([]);
  const [releaseReady, setReleaseReady] = useState<Order[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      const res = await inventoryApi.getAlerts({ category: "SPARE_PART" });
      setSpareAlerts(res.alerts);
      setStats((prev) => ({ ...prev, alerts: res.count }));
    } catch {
      // ignore
    }
  };

  const loadOverview = async () => {
    try {
      const res = await api.get("/production");
      const ready = ((res.data ?? []) as Order[]).filter((order) => {
        const stages = order.stages ?? [];
        return (
          stages.length > 0 &&
          stages.every((stage) => stage.status === "QA_APPROVED") &&
          order.status !== "COMPLETED"
        );
      });
      setReleaseReady(ready);
    } catch {
      // ignore
    }
  };

  const loadItems = async () => {
    try {
      const res = await api.get("/inventory/items?limit=1");
      const total = res.data?.total ?? res.data?.length ?? 0;
      setStats((prev) => ({ ...prev, items: total }));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let alive = true;
    void Promise.all([loadItems(), loadAlerts(), loadOverview()]).catch(
      () => {},
    );
    const timer = window.setInterval(() => {
      if (alive) {
        void loadAlerts();
        void loadOverview();
      }
    }, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const releaseOrder = async (orderId: string) => {
    setBusy(orderId);
    try {
      await api.post(`/production/${orderId}/release`);
      await loadOverview();
    } finally {
      setBusy(null);
    }
  };

  const criticalSpareAlerts = useMemo(
    () => spareAlerts.filter((a) => a.severity === "critical").length,
    [spareAlerts],
  );

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          Warehouse Intelligence
        </h2>
        <p className="font-medium text-slate-500">
          Live inventory, alerts, finished-goods release, and issuance
          workflows.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Inventory Items"
          value={String(stats.items)}
          href="/inventory"
        />
        <MetricCard
          title="Spare-Part Reorder Alerts"
          value={String(spareAlerts.length)}
          accent={spareAlerts.length > 0 ? "amber" : "slate"}
          href="/dashboard/inventory/reorder-alerts"
        />
        <MetricCard
          title="Critical (out of stock)"
          value={String(criticalSpareAlerts)}
          accent={criticalSpareAlerts > 0 ? "rose" : "slate"}
          href="/dashboard/inventory/reorder-alerts"
        />
        <MetricCard
          title="Ready for storage"
          value={String(releaseReady.length)}
          accent={releaseReady.length > 0 ? "indigo" : "slate"}
          href="/dashboard/inventory/release-queue"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickLink
          href="/inventory"
          title="Stock Inventory"
          desc="Manage raw materials, spare parts, accessories, and finished goods."
        />
        <QuickLink
          href="/dashboard/inventory/requisitions"
          title="Material Requisitions"
          desc="Review pending requests for production and maintenance."
        />
        <QuickLink
          href="/dashboard/inventory/reorder-alerts"
          title="Reorder Alerts"
          desc="Machine spare parts and other items at or below their threshold."
        />
        <QuickLink
          href="/dashboard/inventory/release-queue"
          title="Finished Goods Release"
          desc="Approve fully QA-inspected orders to add produced quantity to finished-goods inventory."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
                Reorder alerts
              </p>
              <h3 className="text-lg font-black text-slate-900">
                Machine spare parts below threshold
              </h3>
            </div>
            <Link
              href="/dashboard/inventory/reorder-alerts"
              className="text-xs font-black uppercase tracking-[.18em] text-indigo-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {spareAlerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-6 text-sm font-medium text-emerald-700">
              All spare parts are above their minimum threshold.
            </div>
          ) : (
            <div className="space-y-3">
              {spareAlerts.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-black text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.sku}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      On hand {item.quantity} {item.unit} · threshold{" "}
                      {item.minThreshold} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xs font-black uppercase tracking-[.18em] ${
                        item.severity === "critical"
                          ? "text-rose-600"
                          : "text-amber-600"
                      }`}
                    >
                      {item.severity}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      Reorder {item.suggestedReorderQuantity ?? item.shortage}{" "}
                      {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
                Finished goods
              </p>
              <h3 className="text-lg font-black text-slate-900">
                Orders ready for storage
              </h3>
            </div>
            <Link
              href="/dashboard/inventory/release-queue"
              className="text-xs font-black uppercase tracking-[.18em] text-indigo-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {releaseReady.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-500">
              No orders are currently waiting for storage approval.
            </div>
          ) : (
            <div className="space-y-3">
              {releaseReady.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-black text-slate-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.productName} · target {order.targetQuantity}{" "}
                      {order.productCode}
                    </p>
                  </div>
                  <button
                    onClick={() => releaseOrder(order.id)}
                    disabled={busy === order.id}
                    className="rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-black uppercase tracking-[.18em] text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {busy === order.id ? "Releasing…" : "Release"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <UnreadNotificationsPanel title="Storekeeper Alerts" />
    </div>
  );
}

function MetricCard({
  title,
  value,
  accent = "slate",
  href,
}: {
  title: string;
  value: string;
  accent?: "slate" | "amber" | "rose" | "indigo";
  href?: string;
}) {
  const styles: Record<string, string> = {
    slate: "border-slate-200 bg-white text-slate-900",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };
  const content = (
    <div className={`rounded-2xl border p-5 shadow-sm ${styles[accent]}`}>
      <p className="text-[10px] font-black uppercase tracking-[.24em] opacity-80">
        {title}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-200 hover:bg-indigo-50"
    >
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{desc}</p>
    </Link>
  );
}
