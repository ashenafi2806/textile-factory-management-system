"use client";

import React, { useMemo } from "react";
import { Building2, Briefcase, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";
import WorkersTable from "@/components/workforce/WorkersTable";
import { useWorkers } from "@/hooks/useWorkers";

export default function WorkersPage() {
  const { contentOffset, isDesktop } = useSidebar();
  const { data } = useWorkers();

  const stats = useMemo(() => {
    if (!data?.length) {
      return { total: 0, departments: 0, positions: 0 };
    }
    const depts = new Set<string>();
    const positions = new Set<string>();
    data.forEach((w: Record<string, unknown>) => {
      const dept =
        typeof w.department === "string"
          ? w.department
          : w.department
            ? "Assigned"
            : "Unassigned";
      depts.add(dept);
      if (w.position) positions.add(String(w.position));
    });
    return {
      total: data.length,
      departments: depts.size,
      positions: positions.size,
    };
  }, [data]);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white pt-20 md:pt-16"
      style={isDesktop ? { paddingLeft: contentOffset } : undefined}
    >
      <Navbar />

      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white shadow-xl shadow-indigo-200/40 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
            Workforce directory
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">All employees</h1>
          <p className="mt-2 max-w-2xl text-sm text-indigo-100">
            Search and browse registered workers across departments and roles.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatPill icon={<Users className="h-4 w-4" />} label="Total staff" value={stats.total} />
            <StatPill icon={<Building2 className="h-4 w-4" />} label="Departments" value={stats.departments} />
            <StatPill icon={<Briefcase className="h-4 w-4" />} label="Positions" value={stats.positions} />
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <WorkersTable />
        </section>
      </div>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
        {icon}
      </div>
      <div>
        <p className="text-xs text-indigo-200">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
