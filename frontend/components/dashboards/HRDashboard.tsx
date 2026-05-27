"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export function HRDashboard() {
  const [stats, setStats] = useState({ workers: 0, departments: 0, pendingLeaves: 0 });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [workersRes, leavesRes] = await Promise.all([
          api.get("/workforce/workers"),
          api.get("/workforce/leave/pending"),
        ]);
        if (alive) {
          setStats({
            workers: workersRes.data.length,
            departments: 1,
            pendingLeaves: leavesRes.data.length,
          });
        }
      } catch {
        // keep page resilient
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">HR Workspace</h2>
        <p className="font-medium text-slate-500">Live workforce records and leave approvals.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard title="Workers" value={stats.workers} />
        <MetricCard title="Departments" value={stats.departments} />
        <MetricCard title="Pending Leaves" value={stats.pendingLeaves} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickLink href="/hr-admin/worker-directory" title="Worker Directory" desc="Manage worker records and employment details." />
        <QuickLink href="/manager/leave-approvals" title="Leave Approvals" desc="Review requests and staffing changes." />
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
