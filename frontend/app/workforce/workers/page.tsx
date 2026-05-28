"use client";
import React from "react";
import WorkersTable from "@/components/workforce/WorkersTable";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";
import { useWorkers } from "@/hooks/useWorkers";

export default function WorkersPage() {
  const { contentOffset, isDesktop } = useSidebar();
  const { data } = useWorkers();

  // compute simple aggregates for cards
  const deptCounts = React.useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.forEach((w: any) => {
      const name =
        (w.department &&
          (typeof w.department === "string"
            ? w.department
            : w.department.name)) ||
        "Unassigned";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).map(([k, v]) => ({ name: k, count: v }));
  }, [data]);

  const roleCounts = React.useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.forEach((w: any) => {
      const r = w.position || "Unknown";
      map.set(r, (map.get(r) || 0) + 1);
    });
    return Array.from(map.entries()).map(([k, v]) => ({ name: k, count: v }));
  }, [data]);

  return (
    <div
      className="pt-20 md:pt-16 min-h-screen"
      style={isDesktop ? { paddingLeft: contentOffset } : undefined}
    >
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Workers</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
            {deptCounts.slice(0, 4).map((d) => (
              <div
                key={d.name}
                className="card p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm text-slate-500">Department</div>
                  <div className="text-lg font-bold">{d.name}</div>
                </div>
                <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                  {d.count}
                </div>
              </div>
            ))}
          </div>

          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
            {roleCounts.slice(0, 4).map((r) => (
              <div
                key={r.name}
                className="card p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm text-slate-500">Role</div>
                  <div className="text-lg font-bold">{r.name}</div>
                </div>
                <div className="bg-emerald-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold">
                  {r.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <WorkersTable />
          </div>
        </div>
      </div>
    </div>
  );
}
