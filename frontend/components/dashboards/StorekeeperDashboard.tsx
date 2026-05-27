"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export function StorekeeperDashboard() {
  const [stats, setStats] = useState({ items: 0, alerts: 0 });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [itemsRes, alertsRes] = await Promise.all([
          api.get("/inventory"),
          api.get("/inventory/alerts"),
        ]);
        if (alive) setStats({ items: itemsRes.data.length, alerts: alertsRes.data.length });
      } catch {
        // ignore
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
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Warehouse Intelligence</h2>
        <p className="font-medium text-slate-500">Live inventory, alerts, and issuance workflows.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <MetricCard title="Inventory Items" value={stats.items} />
        <MetricCard title="Low Stock Alerts" value={stats.alerts} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickLink href="/inventory/dashboard" title="Stock Inventory" desc="Manage raw materials, spare parts, and finished goods." />
        <QuickLink href="/inventory" title="Inventory Records" desc="Review item quantities and recent transactions." />
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[.24em] text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-200 hover:bg-indigo-50">
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{desc}</p>
    </Link>
  );
}
