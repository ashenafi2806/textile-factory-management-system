"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export function SupervisorDashboard() {
  const [stats, setStats] = useState({
    orders: 0,
    inProgress: 0,
    pendingQA: 0,
    issues: 0,
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [ordersRes] = await Promise.all([api.get("/api/production")]);
        const orders = ordersRes.data;
        if (alive) {
          setStats({
            orders: orders.length,
            inProgress: orders.filter((o: any) => o.status === "IN_PROGRESS")
              .length,
            pendingQA: orders.filter((o: any) =>
              o.stages?.some((s: any) => s.status === "QA_PENDING"),
            ).length,
            issues: orders.reduce(
              (acc: number, o: any) => acc + (o.issues?.length || 0),
              0,
            ),
          });
        }
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
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          Supervisor Ops
        </h2>
        <p className="font-medium text-slate-500">
          Live orders, QA handoff, and issue tracking.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard title="Orders" value={stats.orders} />
        <MetricCard title="In Progress" value={stats.inProgress} />
        <MetricCard title="Pending QA" value={stats.pendingQA} />
        <MetricCard title="Issues" value={stats.issues} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickLink
          href="/supervisor/attendance"
          title="Attendance Log"
          desc="Record attendance and track shifts."
        />
        <QuickLink
          href="/production"
          title="Production Orders"
          desc="Review assigned production orders and stage status."
        />
      </div>
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
