"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";
import { useAuth } from "@/context/auth-context";
import { ReportFailureModal } from "@/components/modules/maintenance/ReportFailureModal";
import {
  maintenanceApi,
  type MaintenancePriority,
  type MaintenanceStatus,
  type MaintenanceTask,
} from "@/lib/api/maintenance";
import { Badge } from "@/components/modules/maintenance/ui";

function hasRole(roles: string[] | undefined, allowed: string[]) {
  if (!roles?.length) return false;
  if (roles.includes("ADMIN")) return true;
  return Boolean(roles.some((role) => allowed.includes(role)));
}

const STATUS_FILTERS: Array<{
  value: "" | MaintenanceStatus;
  label: string;
}> = [
  { value: "", label: "All statuses" },
  { value: "PENDING_APPROVAL", label: "Awaiting manager" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "PENDING_COMPLETION", label: "Pending approval" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "OPEN", label: "Open" },
];

const PRIORITY_FILTERS: Array<{
  value: "" | MaintenancePriority;
  label: string;
}> = [
  { value: "", label: "All priorities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "NORMAL", label: "Normal" },
];

function statusLabel(status: MaintenanceStatus) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Awaiting manager";
    case "IN_PROGRESS":
      return "In progress";
    case "PENDING_COMPLETION":
      return "Pending completion";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "OPEN":
      return "Open";
    default:
      return status;
  }
}

function statusBadgeVariant(status: MaintenanceStatus) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "amber" as const;
    case "IN_PROGRESS":
      return "blue" as const;
    case "PENDING_COMPLETION":
      return "amber" as const;
    case "COMPLETED":
      return "green" as const;
    case "CANCELLED":
      return "slate" as const;
    default:
      return "slate" as const;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FailureCard({ task }: { task: MaintenanceTask }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-slate-900">
            {task.equipmentName}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
            {task.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge variant={statusBadgeVariant(task.status)}>
            {statusLabel(task.status)}
          </Badge>
          <Badge variant={task.priority === "CRITICAL" ? "red" : "slate"}>
            {task.priority}
          </Badge>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="uppercase tracking-wider text-slate-400">Reported</dt>
          <dd className="mt-0.5 text-slate-700">
            {formatDate(task.failureReport?.createdAt ?? task.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-slate-400">Reporter</dt>
          <dd className="mt-0.5 text-slate-700">
            {task.reportedBy?.username ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-slate-400">Technician</dt>
          <dd className="mt-0.5 text-slate-700">
            {task.assignedTo?.user?.username ?? "Not assigned yet"}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-slate-400">Completed</dt>
          <dd className="mt-0.5 text-slate-700">
            {formatDate(task.completedAt)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export default function SupervisorReportFailurePage() {
  const { user } = useAuth();
  const { contentOffset, isDesktop } = useSidebar();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"" | MaintenanceStatus>("");
  const [priorityFilter, setPriorityFilter] = useState<
    "" | MaintenancePriority
  >("");
  const [search, setSearch] = useState("");

  const canReport = hasRole(user?.roles, [
    "SUPERVISOR",
    "PRODUCTION_SUPERVISOR",
    "PRODUCTION_MANAGER",
    "ADMIN",
  ]);

  const reportsQuery = useQuery({
    queryKey: ["failure-reports", statusFilter, priorityFilter],
    queryFn: () =>
      maintenanceApi.listFailureReports({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      }),
    enabled: !!user && canReport,
  });

  const filteredReports = useMemo(() => {
    const items = reportsQuery.data?.data ?? [];
    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter(
      (task) =>
        task.equipmentName.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term) ||
        task.reportedBy?.username?.toLowerCase().includes(term) ||
        task.assignedTo?.user?.username?.toLowerCase().includes(term),
    );
  }, [reportsQuery.data?.data, search]);

  const summary = reportsQuery.data?.summary ?? [];
  const totalCount = reportsQuery.data?.total ?? filteredReports.length;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["failure-reports"] });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white pt-20 transition-all duration-300 md:pt-16"
        style={isDesktop ? { paddingLeft: contentOffset } : undefined}
      >
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {!canReport ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-slate-500">
                You do not have permission to report equipment failures.
              </p>
            </div>
          ) : (
            <>
              <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-600">
                    Supervisor · Maintenance
                  </p>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
                    Equipment failure reports
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
                    Report machine issues and track status until maintenance
                    closes the work order.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 sm:w-auto"
                >
                  <Plus className="h-5 w-5" />
                  Report new failure
                </button>
              </header>

              {summary.length > 0 ? (
                <section className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("")}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      statusFilter === ""
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Total
                    </p>
                    <p className="mt-1 text-xl font-black text-slate-900">
                      {summary.reduce((n, s) => n + s.count, 0)}
                    </p>
                  </button>
                  {summary.map((row) => (
                    <button
                      key={row.status}
                      type="button"
                      onClick={() =>
                        setStatusFilter(row.status as MaintenanceStatus)
                      }
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        statusFilter === row.status
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 line-clamp-2">
                        {statusLabel(row.status as MaintenanceStatus)}
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-900">
                        {row.count}
                      </p>
                    </button>
                  ))}
                </section>
              ) : null}

              <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search equipment, description, people…"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value as "" | MaintenanceStatus,
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 sm:w-auto"
                    >
                      {STATUS_FILTERS.map((opt) => (
                        <option key={opt.label} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={priorityFilter}
                      onChange={(e) =>
                        setPriorityFilter(
                          e.target.value as "" | MaintenancePriority,
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 sm:w-auto"
                    >
                      {PRIORITY_FILTERS.map((opt) => (
                        <option key={opt.label} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  Showing {filteredReports.length} of {totalCount} report
                  {totalCount === 1 ? "" : "s"}
                  {statusFilter
                    ? ` · ${statusLabel(statusFilter)}`
                    : ""}
                  {priorityFilter ? ` · ${priorityFilter}` : ""}
                </p>
              </section>

              {reportsQuery.isError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  Failed to load reports. Ensure you are signed in and the API
                  is running.
                </div>
              ) : null}

              {reportsQuery.isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-40 animate-pulse rounded-2xl bg-white shadow-sm"
                    />
                  ))}
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                  <AlertTriangle className="h-12 w-12 text-amber-500" />
                  <h2 className="mt-4 text-xl font-black text-slate-900">
                    No failure reports found
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    {search || statusFilter || priorityFilter
                      ? "Try clearing filters or search terms."
                      : "When you report a machine failure, it will appear here with live status updates."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                  >
                    Report first failure
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredReports.map((task) => (
                    <FailureCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <ReportFailureModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={async () => {
          setModalOpen(false);
          await refresh();
        }}
      />
    </>
  );
}
