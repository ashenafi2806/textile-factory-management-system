"use client";
import React, { useMemo, useState } from "react";
import { useWorkers } from "@/hooks/useWorkers";
import { useAuth } from "@/context/auth-context";

export default function WorkersTable() {
  const { data, isLoading, isError } = useWorkers();
  const [q, setQ] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const rows = useMemo(() => {
    if (!data) return [];
    return data.filter((w: any) => {
      const matchQ = q
        ? `${w.name} ${w.employeeId} ${w.position} ${w.department}`
            .toLowerCase()
            .includes(q.toLowerCase())
        : true;
      const matchDept = filterDept ? w.department === filterDept : true;
      return matchQ && matchDept;
    });
  }, [data, q, filterDept]);

  const departments = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.map((d: any) => d.department))).filter(
      Boolean,
    );
  }, [data]);

  if (isLoading) return <div className="p-4">Loading workers...</div>;
  if (isError)
    return <div className="p-4 text-rose-600">Failed to load workers</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, id, role..."
          className="input w-full"
        />
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="select"
        >
          <option value="">All depts</option>
          {departments.map((d: any) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-auto rounded-lg border">
        <table className="min-w-full divide-y table-fixed">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Employee ID</th>
              <th className="p-2 text-left">Position</th>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map((w: any) => (
              <tr key={w.id} className="border-t">
                <td className="p-2">{w.name}</td>
                <td className="p-2">{w.employeeId}</td>
                <td className="p-2">{w.position}</td>
                <td className="p-2">{w.department}</td>
                <td className="p-2">{w.status || "active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
