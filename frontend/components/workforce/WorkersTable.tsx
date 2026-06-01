"use client";
import React, { useMemo, useState } from "react";
import { useWorkers } from "@/hooks/useWorkers";
import { useAuth } from "@/context/auth-context";

export default function WorkersTable() {
  const { data, isLoading, isError, isFetching, refetch } = useWorkers();
  const [q, setQ] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const normalize = (dept: any) => {
    if (!dept) return "";
    if (typeof dept === "string") return dept;
    if (typeof dept === "object") return dept.name ?? String(dept.id ?? "");
    return String(dept);
  };

  const getWorkerName = (w: any) =>
    w.fullName || w.name || w.user?.username || w.user?.email || "Unknown";

  const rows = useMemo(() => {
    if (!data) return [];
    return data.filter((w: any) => {
      const matchQ = q
        ? `${getWorkerName(w)} ${w.employeeId} ${w.position} ${normalize(
            w.department,
          )}`
            .toLowerCase()
            .includes(q.toLowerCase())
        : true;
      // department normalization is handled by the top-level `normalize` helper
      const matchDept = filterDept
        ? normalize(w.department) === filterDept
        : true;
      return matchQ && matchDept;
    });
  }, [data, q, filterDept]);

  const departments = useMemo(() => {
    if (!data) return [];
    return Array.from(
      new Set(data.map((d: any) => normalize(d.department))),
    ).filter(Boolean);
  }, [data]);

  if (isLoading) return <div className="p-4">Loading workers...</div>;
  if (isError)
    return <div className="p-4 text-rose-600">Failed to load workers</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500">Total</div>
          <div className="font-bold">{data?.length ?? 0}</div>
          <div className="text-xs text-slate-400">workers</div>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-3">
          <span>
            {isLoading
              ? "Loading..."
              : isError
                ? "Error"
                : "Fetched from server"}
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700/40 text-slate-800 dark:text-slate-100"
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-col md:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, id, role..."
          className="input w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
        />
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="select bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
        >
          <option value="">All depts</option>
          {departments.map((d: any) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="p-4 text-center text-slate-500 hidden md:block">
          No workers found.
        </div>
      ) : (
        <div className="hidden md:block overflow-auto rounded-lg border bg-white dark:bg-slate-800">
          <table className="min-w-full divide-y table-fixed">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="p-2 text-left text-slate-700 dark:text-slate-200">
                  Name
                </th>
                <th className="p-2 text-left text-slate-700 dark:text-slate-200">
                  Employee ID
                </th>
                <th className="p-2 text-left text-slate-700 dark:text-slate-200">
                  Position
                </th>
                <th className="p-2 text-left text-slate-700 dark:text-slate-200">
                  Department
                </th>
                <th className="p-2 text-left text-slate-700 dark:text-slate-200">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {rows.map((w: any) => (
                <tr
                  key={w.id}
                  className="border-t border-slate-100 dark:border-slate-700"
                >
                  <td className="p-2 text-slate-900 dark:text-slate-100">
                    {w.name}
                  </td>
                  <td className="p-2 text-slate-900 dark:text-slate-100">
                    {w.employeeId}
                  </td>
                  <td className="p-2 text-slate-900 dark:text-slate-100">
                    {w.position}
                  </td>
                  <td className="p-2 text-slate-900 dark:text-slate-100">
                    {normalize(w.department)}
                  </td>
                  <td className="p-2 text-slate-900 dark:text-slate-100">
                    {w.status || "active"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-2">
        {rows.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            No workers found.
          </div>
        ) : (
          rows.map((w: any) => (
            <div
              key={`card-${w.id}`}
              className="p-2 border rounded-lg bg-white dark:bg-slate-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400">Name</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {getWorkerName(w)}
                  </div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-300">
                  {w.status || "active"}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                <div>
                  <div className="text-xs text-slate-400">Employee ID</div>
                  <div>{w.employeeId}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Position</div>
                  <div className="text-slate-900 dark:text-slate-100">
                    {w.position}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-400">Department</div>
                  <div className="text-slate-900 dark:text-slate-100">
                    {normalize(w.department)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
