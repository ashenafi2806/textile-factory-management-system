"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import workforceService from "@/services/workforceService";
import { useWorkers } from "@/hooks/useWorkers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useCanPerform } from "@/hooks/useCanPerform";

const CATEGORIES = [
  "VERBAL_WARNING",
  "WRITTEN_WARNING",
  "SUSPENSION",
  "FINAL_WARNING",
  "TERMINATION",
  "COUNSELING",
];

const SEVERITIES = ["LOW", "MEDIUM", "HIGH"];

const STATUSES = [
  "ISSUED",
  "ACKNOWLEDGED",
  "APPEALED",
  "EXPIRED",
  "REVOKED",
];

export default function SupervisorDisciplinePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: workers } = useWorkers();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["discipline", "list"],
    queryFn: () => workforceService.getDisciplinaryActions().then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: (payload: any) =>
      workforceService.createDisciplinaryAction(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discipline", "list"] });
      toast.success("Disciplinary action recorded");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to create"),
  });

  const acknowledge = useMutation({
    mutationFn: (id: string) => workforceService.acknowledgeDisciplinaryAction(id),
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

  const allowed =
    !!user &&
    (user.roles.includes("SUPERVISOR") ||
      user.roles.includes("ADMIN") ||
      user.roles.includes("HR_ADMIN") ||
      user.roles.includes("MANAGER"));

  if (!user) return null;
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
          <p className="mt-2 text-slate-600">
            Only Supervisors, Managers, HR Admins, and Admins can manage
            disciplinary actions.
          </p>
        </div>
      </div>
    );
  }

  const filtered = (data || []).filter((d: any) =>
    statusFilter ? d.status === statusFilter : true,
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-16">
        <div className="max-w-7xl mx-auto space-y-6">
          <header>
            <p className="text-indigo-600 font-black uppercase tracking-[.3em] text-[10px] mb-2">
              Supervisor Workspace
            </p>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">
              Disciplinary Actions
            </h1>
            <p className="text-slate-500 mt-3 max-w-2xl">
              Record warnings, suspensions, and other disciplinary measures
              against workers.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create form */}
            {canCreate ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.workerId || !form.subject) {
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
              }}
              className="rounded border bg-white p-6 space-y-3"
            >
              <h3 className="font-bold text-slate-900">Record Action</h3>

              <select
                value={form.workerId}
                onChange={(e) => setForm({ ...form, workerId: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">Pick worker…</option>
                {(workers || []).map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.fullName || w.user?.username || w.id}
                  </option>
                ))}
              </select>

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input w-full"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </select>

              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="input w-full"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <input
                placeholder="Subject (required)"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="input w-full"
                required
              />
              <input
                placeholder="Reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="input w-full"
              />
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input w-full"
                rows={2}
              />
              <button
                className="btn btn-primary w-full"
                type="submit"
                disabled={create.isPending}
              >
                {create.isPending ? "Saving…" : "Record Action"}
              </button>
            </form>
            ) : (
              <div className="rounded border bg-white p-6 text-sm text-slate-500">
                Your role can view disciplinary actions but cannot record new ones.
              </div>
            )}

            {/* List + filter */}
            <div className="rounded border bg-white p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">All Actions</h3>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input w-auto"
                >
                  <option value="">All statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {isLoading ? (
                <div className="text-slate-400 text-sm">Loading…</div>
              ) : isError ? (
                <div className="text-rose-600 text-sm">Failed to load</div>
              ) : filtered.length === 0 ? (
                <div className="text-slate-500 text-sm">No actions found.</div>
              ) : (
                <ul className="divide-y">
                  {filtered.map((d: any) => (
                    <li key={d.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900">
                          {d.subject}
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                            d.status === "ISSUED"
                              ? "bg-amber-100 text-amber-700"
                              : d.status === "ACKNOWLEDGED"
                                ? "bg-emerald-100 text-emerald-700"
                                : d.status === "REVOKED"
                                  ? "bg-slate-200 text-slate-600"
                                  : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {d.category.replace(/_/g, " ")} · Severity{" "}
                        {d.severity} ·{" "}
                        {new Date(d.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        Worker:{" "}
                        {d.worker?.fullName ||
                          d.worker?.user?.username ||
                          d.workerId}
                      </div>
                      <div className="text-xs text-slate-500">
                        Issued by: {d.issuedBy?.username || d.issuedById}
                      </div>
                      {d.reason && (
                        <div className="text-xs text-slate-600 italic">
                          “{d.reason}”
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        {d.status === "ISSUED" && canAcknowledge && (
                          <button
                            type="button"
                            onClick={() => acknowledge.mutate(d.id)}
                            className="text-xs text-emerald-600 font-bold"
                          >
                            Acknowledge
                          </button>
                        )}
                        {d.status !== "REVOKED" &&
                          d.status !== "EXPIRED" &&
                          canRevoke && (
                            <button
                              type="button"
                              onClick={() => revoke.mutate(d.id)}
                              className="text-xs text-rose-600 font-bold"
                            >
                              Revoke
                            </button>
                          )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
