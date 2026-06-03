"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ShieldAlert,
} from "lucide-react";
import {
  useIncidents,
  useCreateIncident,
  useApproveIncident,
} from "@/hooks/useIncidents";
import { useCanPerform } from "@/hooks/useCanPerform";
import {
  FormSection,
  WorkforceButton,
  WorkforceInput,
  WorkforceLabel,
  WorkforceSelect,
  WorkforceTextarea,
} from "@/components/workforce/workforce-ui";

function severityStyle(severity: string) {
  switch (severity) {
    case "HIGH":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "MEDIUM":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function statusStyle(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-amber-100 text-amber-700";
    case "APPROVED":
    case "CLOSED":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function Incidents() {
  const { data, isLoading, isError } = useIncidents();
  const create = useCreateIncident();
  const approve = useApproveIncident();
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "LOW",
  });
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "APPROVED">("ALL");

  const canCreate = useCanPerform(["SUPERVISOR", "ADMIN"]);
  const canApprove = useCanPerform(["MANAGER", "HR_ADMIN", "ADMIN"]);

  const incidents = data ?? [];

  const filtered = useMemo(() => {
    if (filter === "ALL") return incidents;
    return incidents.filter((inc: { status: string }) => inc.status === filter);
  }, [incidents, filter]);

  const stats = useMemo(
    () => ({
      total: incidents.length,
      open: incidents.filter((i: { status: string }) => i.status === "OPEN").length,
      high: incidents.filter((i: { severity: string }) => i.severity === "HIGH").length,
    }),
    [incidents],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    create.mutate(form, {
      onSuccess: () => {
        toast.success("Incident reported");
        setForm({ title: "", description: "", severity: "LOW" });
      },
      onError: () => toast.error("Failed to report incident"),
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<ShieldAlert className="h-5 w-5" />} label="Total reported" value={stats.total} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Open" value={stats.open} variant="amber" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="High severity" value={stats.high} variant="rose" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Incident log</h2>
              <p className="text-sm text-slate-500">
                Workplace safety and conduct reports.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["ALL", "OPEN", "APPROVED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    filter === s
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Failed to load incidents.
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">No incidents found</p>
              <p className="mt-1 text-sm text-slate-500">
                {filter === "ALL"
                  ? "No incidents have been reported yet."
                  : `No ${filter.toLowerCase()} incidents.`}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((inc: {
                id: string;
                title: string;
                description?: string;
                severity: string;
                status: string;
                reportedBy?: string;
                createdAt?: string;
              }) => (
                <li
                  key={inc.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-indigo-100"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/supervisor/incidents/${inc.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600"
                        >
                          {inc.title}
                        </Link>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${severityStyle(inc.severity)}`}
                        >
                          {inc.severity}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle(inc.status)}`}
                        >
                          {inc.status}
                        </span>
                      </div>
                      {inc.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {inc.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-400">
                        Reported by {inc.reportedBy ?? "Unknown"}
                        {inc.createdAt
                          ? ` · ${new Date(inc.createdAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    {canApprove && inc.status === "OPEN" ? (
                      <WorkforceButton
                        type="button"
                        className="shrink-0 self-start"
                        onClick={() =>
                          approve.mutate(inc.id, {
                            onSuccess: () => toast.success("Incident approved"),
                            onError: () => toast.error("Approval failed"),
                          })
                        }
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        Approve
                      </WorkforceButton>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canCreate ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <FormSection
              icon={<Plus className="h-5 w-5" />}
              title="Report incident"
              description="Document safety, conduct, or operational issues."
            >
              <form onSubmit={submit} className="mt-4 space-y-4">
                <div>
                  <WorkforceLabel htmlFor="inc-title">Title</WorkforceLabel>
                  <WorkforceInput
                    id="inc-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Brief summary of the incident"
                    required
                  />
                </div>
                <div>
                  <WorkforceLabel htmlFor="inc-sev">Severity</WorkforceLabel>
                  <WorkforceSelect
                    id="inc-sev"
                    value={form.severity}
                    onChange={(e) =>
                      setForm({ ...form, severity: e.target.value })
                    }
                  >
                    <option value="LOW">Low — minor issue</option>
                    <option value="MEDIUM">Medium — needs attention</option>
                    <option value="HIGH">High — urgent / safety risk</option>
                  </WorkforceSelect>
                </div>
                <div>
                  <WorkforceLabel htmlFor="inc-desc">Description</WorkforceLabel>
                  <WorkforceTextarea
                    id="inc-desc"
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="What happened, when, who was involved, immediate actions taken…"
                  />
                </div>
                <WorkforceButton
                  type="submit"
                  disabled={create.isPending}
                  className="w-full"
                >
                  {create.isPending ? "Submitting…" : "Submit report"}
                </WorkforceButton>
              </form>
            </FormSection>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Only supervisors and admins can report new incidents.
          </section>
        )}
      </div>
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
