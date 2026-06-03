"use client";

import React, { useMemo, useState } from "react";
import { useWorkers } from "@/hooks/useWorkers";
import { Mail, RefreshCw, Search } from "lucide-react";

function normalizeDept(dept: unknown): string {
  if (!dept) return "Unassigned";
  if (typeof dept === "string") return dept;
  if (typeof dept === "object" && dept !== null && "name" in dept) {
    return String((dept as { name?: string }).name ?? "Unassigned");
  }
  return String(dept);
}

export function getWorkerName(w: {
  fullName?: string | null;
  name?: string | null;
  user?: { username?: string; email?: string };
}): string {
  return (
    w.fullName?.trim() ||
    w.name?.trim() ||
    w.user?.username ||
    w.user?.email ||
    "Unknown"
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function WorkersTable() {
  const { data, isLoading, isError, isFetching, refetch } = useWorkers();
  const [q, setQ] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const rows = useMemo(() => {
    if (!data) return [];
    return data.filter((w: Record<string, unknown>) => {
      const name = getWorkerName(w as Parameters<typeof getWorkerName>[0]);
      const matchQ = q
        ? `${name} ${w.employeeId} ${w.position} ${normalizeDept(w.department)}`
            .toLowerCase()
            .includes(q.toLowerCase())
        : true;
      const matchDept = filterDept
        ? normalizeDept(w.department) === filterDept
        : true;
      return matchQ && matchDept;
    });
  }, [data, q, filterDept]);

  const departments = useMemo(() => {
    if (!data) return [];
    return Array.from(
      new Set(
        data.map((d: Record<string, unknown>) => normalizeDept(d.department)),
      ),
    ).filter((d) => d !== "Unassigned" || data.some((w) => !w.department));
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Failed to load workers. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-bold text-slate-900">{data?.length ?? 0}</span>{" "}
          employees registered
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, ID, role, department…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
          No workers match your search.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((w: Record<string, unknown>) => {
                    const name = getWorkerName(
                      w as Parameters<typeof getWorkerName>[0],
                    );
                    const user = w.user as
                      | { username?: string; email?: string }
                      | undefined;
                    return (
                      <tr key={String(w.id)} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                              {initials(name)}
                            </div>
                            <span className="font-semibold text-slate-900">
                              {name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {String(w.employeeId ?? "—")}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {String(w.position ?? "—")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {normalizeDept(w.department)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {user?.email ?? user?.username ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / tablet cards */}
          <ul className="space-y-3 lg:hidden">
            {rows.map((w: Record<string, unknown>) => {
              const name = getWorkerName(
                w as Parameters<typeof getWorkerName>[0],
              );
              const user = w.user as
                | { username?: string; email?: string }
                | undefined;
              return (
                <li
                  key={String(w.id)}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                      {initials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900">{name}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">
                        {String(w.employeeId ?? "—")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                          {String(w.position ?? "No role")}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {normalizeDept(w.department)}
                        </span>
                      </div>
                      {(user?.email || user?.username) && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {user.email ?? user.username}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
