"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type DashboardState = {
  production: { total: number; inProgress: number; completed: number; openIssues: number };
  workforce: { totalWorkers: number; pendingLeaves: number; overtimeRequests: number };
  inventory: { totalItems: number; lowStockAlerts: number };
};

export function ManagerDashboard() {
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productionRes, workforceRes, inventoryRes, pendingLeavesRes, alertsRes] =
          await Promise.all([
            api.get("/production/reports/summary"),
            api.get("/workforce/workers"),
            api.get("/inventory"),
            api.get("/workforce/leave/pending"),
            api.get("/inventory/alerts"),
          ]);

        if (!alive) return;

        setData({
          production: productionRes.data,
          workforce: {
            totalWorkers: workforceRes.data.length,
            pendingLeaves: pendingLeavesRes.data.length,
            overtimeRequests: 0,
          },
          inventory: {
            totalItems: inventoryRes.data.length,
            lowStockAlerts: alertsRes.data.length,
          },
        });
      } catch (err) {
        console.error("Failed to load manager dashboard", err);
        if (alive) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || "Unable to load live manager metrics.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const production = data?.production ?? { total: 0, inProgress: 0, completed: 0, openIssues: 0 };
  const workforce = data?.workforce ?? { totalWorkers: 0, pendingLeaves: 0, overtimeRequests: 0 };
  const inventory = data?.inventory ?? { totalItems: 0, lowStockAlerts: 0 };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Executive Dashboard</h2>
        <p className="font-medium text-slate-500">Live production, workforce, and inventory metrics.</p>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-500">Loading manager metrics...</div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard title="Production Orders" value={production.total} />
        <MetricCard title="In Progress" value={production.inProgress} />
        <MetricCard title="Workers" value={workforce.totalWorkers} />
        <MetricCard title="Inventory Items" value={inventory.totalItems} />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard title="Completed" value={production.completed} />
        <MetricCard title="Open Issues" value={production.openIssues} />
        <MetricCard title="Pending Leaves" value={workforce.pendingLeaves} />
        <MetricCard title="Low Stock Alerts" value={inventory.lowStockAlerts} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickLink href="/production" title="Production Planning" desc="Assign supervisors and manage production schedules." />
        <QuickLink href="/manager/leave-approvals" title="Operations Queue" desc="Approve leave, overtime, and staffing requests." />
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
