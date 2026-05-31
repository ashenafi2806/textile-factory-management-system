"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { UnreadNotificationsPanel } from "@/components/notifications/UnreadNotificationsPanel";

export function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    workers: 0,
    productionOrders: 0,
    inventoryItems: 0,
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [usersRes, workersRes, ordersRes, inventoryRes] =
          await Promise.all([
            api.get("/users"),
            api.get("/workforce/workers"),
            api.get("/production"),
            api.get("/inventory"),
          ]);
        if (alive) {
          setStats({
            users: usersRes.data.length,
            workers: workersRes.data.length,
            productionOrders: ordersRes.data.length,
            inventoryItems: inventoryRes.data.length,
          });
        }
      } catch {
        // keep dashboard usable even if one endpoint fails
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          System Console
        </h2>
        <p className="font-medium text-slate-500">
          Live system overview for access, orders, workers, and inventory.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Users" value={stats.users} />
        <MetricCard title="Workers" value={stats.workers} />
        <MetricCard title="Production Orders" value={stats.productionOrders} />
        <MetricCard title="Inventory Items" value={stats.inventoryItems} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickLink
          href="/admin/users"
          title="User Access Control"
          desc="Manage authentication, roles, and security policies."
        />
        <QuickLink
          href="/admin/logs"
          title="System Audit Logs"
          desc="Review critical actions and system events."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <QuickLink
          href="/inventory"
          title="Inventory Dashboard"
          desc="Monitor low stock, category summaries, and recent inventory movement."
          icon="📦"
        />
        <QuickLink
          href="/inventory/items"
          title="Inventory Items"
          desc="Browse, search, restock, issue, and manage all inventory items."
          icon="🧰"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <QuickLink
          href="/maintenance"
          title="Maintenance Dashboard"
          desc="Track open tasks, critical issues, and failure reports from the factory floor."
          icon="🛠️"
        />
        <QuickLink
          href="/maintenance/my-tasks"
          title="Technician Workbench"
          desc="Review assigned maintenance tasks and complete work orders with spare parts used."
          icon="⚙️"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <QuickLink
          href="/dashboard/notifications"
          title="Notifications Center"
          desc="View unread production, inventory, and maintenance alerts."
          icon="🔔"
        />
      </div>

      <UnreadNotificationsPanel title="Admin Alerts" />
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[.24em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon?: string | React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-200 hover:bg-indigo-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500">{desc}</p>
        </div>
        {icon ? <div className="text-3xl">{icon}</div> : null}
      </div>
    </Link>
  );
}
