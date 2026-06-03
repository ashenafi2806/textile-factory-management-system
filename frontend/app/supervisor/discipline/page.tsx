"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";
import workforceService from "@/services/workforceService";
import { useWorkers } from "@/hooks/useWorkers";
import { getWorkerName } from "@/components/workforce/WorkersTable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useCanPerform } from "@/hooks/useCanPerform";
import {
  FormSection,
  WorkforceButton,
  WorkforceInput,
  WorkforceLabel,
  WorkforceSelect,
  WorkforceTextarea,
} from "@/components/workforce/workforce-ui";
import { AlertOctagon, FileWarning, Gavel, Plus } from "lucide-react";

const CATEGORIES = [
  "VERBAL_WARNING",
  "WRITTEN_WARNING",
  "SUSPENSION",
  "FINAL_WARNING",
  "TERMINATION",
  "COUNSELING",
];

const SEVERITIES = ["LOW", "MEDIUM", "HIGH"];

const STATUSES = ["ISSUED", "ACKNOWLEDGED", "APPEALED", "EXPIRED", "REVOKED"];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function statusStyle(status: string) {
  switch (status) {
    case "ISSUED":
      return "bg-amber-100 text-amber-800";
    case "ACKNOWLEDGED":
      return "bg-emerald-100 text-emerald-800";
    case "REVOKED":
      return "bg-slate-200 text-slate-600";
    case "APPEALED":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function severityStyle(severity: string) {
  switch (severity) {
    case "HIGH":
      return "text-rose-700";
    case "MEDIUM":
      return "text-amber-700";
    default:
      return "text-slate-600";
  }
}

export default function SupervisorDisciplinePage() {
  const { user } = useAuth();
  const { contentOffset, isDesktop } = useSidebar();
  const qc = useQueryClient();
  const { data: workers } = useWorkers();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["discipline", "list"],
    queryFn: () =>
      workforceService.getDisciplinaryActions().then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      workforceService.createDisciplinaryAction(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discipline", "list"] });
      toast.success("Disciplinary action recorded");
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message || "Failed to create"),
  });

  const acknowledge = useMutation({
    mutationFn: (id: string) =>
      workforceService.acknowledgeDisciplinaryAction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discipline", "list"] });
      toast.success("Acknowledged");
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) =>
      workforceService.updateDisciplinaryAction(id, { status: "REVOKED" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discipline", "list"] });
      toast.success("Revoked");
    },
  });

  const [form, setForm] = useState({
    workerId: "",
    category: "WRITTEN_WARNING",
    severity: "MEDIUM",
    subject: "",
    reason: "",
    notes: "",
  });
  const [statusFilter, setStatusFilter] = useState("");

  const canCreate = useCanPerform([
    "SUPERVISOR",
    "MANAGER",
    "HR_ADMIN",
    "ADMIN",
  ]);
  const canRevoke = useCanPerform([
    "SUPERVISOR",
    "MANAGER",
    "HR_ADMIN",
    "ADMIN",
  ]);
  const canAcknowledge = useCanPerform([
    "WORKER",
    "SUPERVISOR",
    "MANAGER",
    "HR_ADMIN",
    "ADMIN",
  ]);

  const allowed = useCanPerform([
    "SUPERVISOR",
    "MANAGER",
    "HR_ADMIN",
    "ADMIN",
  ]);

  const filtered = useMemo(
    () =>
      (data || []).filter((d: { status: string }) =>
        statusFilter ? d.status === statusFilter : true,
      ),
    [data, statusFilter],
  );

  const stats = useMemo(
    () => ({
      total: (data || []).length,
      issued: (data || []).filter((d: { status: string }) => d.status === "ISSUED").length,
      high: (data || []).filter((d: { severity: string }) => d.severity === "HIGH").length,
    }),
    [data],
  );

  if (!user) return null;

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">Access denied</h1>
          <p className="mt-2 text-slate-600">
            Only supervisors, managers, HR, and admins can manage disciplinary
            actions.
          </p>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.workerId || !form.subject.trim()) {
      toast.error("Worker and subject are required");
      return;
    }
    create.mutate(form);
    setForm({
      workerId: "",
      category: "WRITTEN_WARNING",
      severity: "MEDIUM",
      subject: "",
      reason: "",
      notes: "",
    });
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white pt-20 md:pt-16"
      style={isDesktop ? { paddingLeft: contentOffset } : undefined}
    >
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-700 p-6 text-white shadow-xl shadow-orange-200/40 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-100">
            Supervisor workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
            Disciplinary actions
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-orange-50 sm:text-base">
            Record warnings, suspensions, and counseling. Track acknowledgment
            and maintain compliance records.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Gavel className="h-5 w-5" />} label="Total actions" value={stats.total} />
          <StatCard icon={<FileWarning className="h-5 w-5" />} label="Awaiting ack" value={stats.issued} variant="amber" />
          <StatCard icon={<AlertOctagon className="h-5 w-5" />} label="High severity" value={stats.high} variant="rose" />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          {canCreate ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <FormSection
                icon={<Plus className="h-5 w-5" />}
                title="Record action"
                description="Issue a formal disciplinary measure against a worker."
              >
                <form onSubmit={submit} className="mt-4 space-y-4">
                  <div>
                    <WorkforceLabel htmlFor="d-worker">Worker</WorkforceLabel>
                    <WorkforceSelect
                      id="d-worker"
                      value={form.workerId}
                      onChange={(e) =>
                        setForm({ ...form, workerId: e.target.value })
                      }
                      required
                    >
                      <option value="">Select employee…</option>
                      {(workers || []).map((w: Record<string, unknown>) => (
                        <option key={String(w.id)} value={String(w.id)}>
                          {getWorkerName(
                            w as Parameters<typeof getWorkerName>[0],
                          )}{" "}
                          ({String(w.employeeId ?? "—")})
                        </option>
                      ))}
                    </WorkforceSelect>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <WorkforceLabel htmlFor="d-cat">Category</WorkforceLabel>
                      <WorkforceSelect
                        id="d-cat"
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {formatLabel(c)}
                          </option>
                        ))}
                      </WorkforceSelect>
                    </div>
                    <div>
                      <WorkforceLabel htmlFor="d-sev">Severity</WorkforceLabel>
                      <WorkforceSelect
                        id="d-sev"
                        value={form.severity}
                        onChange={(e) =>
                          setForm({ ...form, severity: e.target.value })
                        }
                      >
                        {SEVERITIES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </WorkforceSelect>
                    </div>
                  </div>
                  <div>
                    <WorkforceLabel htmlFor="d-subject">Subject</WorkforceLabel>
                    <WorkforceInput
                      id="d-subject"
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      placeholder="e.g. Repeated tardiness"
                      required
                    />
                  </div>
                  <div>
                    <WorkforceLabel htmlFor="d-reason">Reason</WorkforceLabel>
                    <WorkforceInput
                      id="d-reason"
                      value={form.reason}
                      onChange={(e) =>
                        setForm({ ...form, reason: e.target.value })
                      }
                      placeholder="Brief reason for this action"
                    />
                  </div>
                  <div>
                    <WorkforceLabel htmlFor="d-notes">Notes (optional)</WorkforceLabel>
                    <WorkforceTextarea
                      id="d-notes"
                      rows={2}
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      placeholder="Additional context for HR records"
                    />
                  </div>
                  <WorkforceButton
                    type="submit"
                    disabled={create.isPending}
                    className="w-full"
                  >
                    {create.isPending ? "Saving…" : "Record action"}
                  </WorkforceButton>
                </form>
              </FormSection>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              Your role can view disciplinary records but cannot create new
              ones.
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Action history</h2>
                <p className="text-sm text-slate-500">
                  {filtered.length} record{filtered.length === 1 ? "" : "s"}
                </p>
              </div>
              <WorkforceSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-44"
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatLabel(s)}
                  </option>
                ))}
              </WorkforceSelect>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Failed to load disciplinary actions.
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                No disciplinary actions found.
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.map(
                  (d: {
                    id: string;
                    subject: string;
                    status: string;
                    category: string;
                    severity: string;
                    createdAt: string;
                    reason?: string;
                    workerId: string;
                    issuedById?: string;
                    worker?: {
                      fullName?: string;
                      user?: { username?: string };
                    };
                    issuedBy?: { username?: string };
                  }) => (
                    <li
                      key={d.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900">{d.subject}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle(d.status)}`}
                            >
                              {d.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {formatLabel(d.category)} ·{" "}
                            <span className={`font-semibold ${severityStyle(d.severity)}`}>
                              {d.severity}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Worker:{" "}
                            {d.worker?.fullName ||
                              getWorkerName(
                                (d.worker ?? {
                                  fullName: null,
                                  user: { username: d.workerId },
                                }) as Parameters<typeof getWorkerName>[0],
                              )}{" "}
                            · Issued by {d.issuedBy?.username ?? d.issuedById ?? "—"} ·{" "}
                            {new Date(d.createdAt).toLocaleDateString()}
                          </p>
                          {d.reason ? (
                            <p className="mt-2 text-sm italic text-slate-600">
                              “{d.reason}”
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {d.status === "ISSUED" && canAcknowledge ? (
                            <button
                              type="button"
                              onClick={() => acknowledge.mutate(d.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Acknowledge
                            </button>
                          ) : null}
                          {d.status !== "REVOKED" &&
                            d.status !== "EXPIRED" &&
                            canRevoke && (
                              <button
                                type="button"
                                onClick={() => revoke.mutate(d.id)}
                                className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                              >
                                Revoke
                              </button>
                            )}
                        </div>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant?: "default" | "amber" | "rose";
}) {
  const iconBg = {
    default: "bg-indigo-100 text-indigo-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconBg[variant]}`}>
        {icon}
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </article>
  );
}
