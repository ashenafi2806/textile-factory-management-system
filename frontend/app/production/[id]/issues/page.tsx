"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

type Issue = {
  id: string;
  issueType: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  reportedBy?: { username?: string };
  stage?: { stageName?: string };
};

type Stage = { id: string; stageName: string; stageOrder: number };

export default function OrderIssuesPage() {
  const params = useParams();
  const id = params.id as string;
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    stageId: "",
    issueType: "OTHER",
    priority: "NORMAL",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [issuesRes, orderRes] = await Promise.all([
        api.get(`/production/${id}/issues`),
        api.get(`/production/${id}`),
      ]);
      setIssues(issuesRes.data);
      setStages(orderRes.data.stages || []);
      setError(null);
      if (!form.stageId && orderRes.data.stages?.length) {
        setForm((current) => ({
          ...current,
          stageId: orderRes.data.stages[0].id,
        }));
      }
    } catch {
      setError("Failed to load issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      await fetchData();
    };
    void load();
    const timer = window.setInterval(() => void fetchData(), 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [id]);

  const submitIssue = async () => {
    if (!form.stageId || !form.description.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/production/${id}/issues`, {
        stageId: form.stageId,
        issueType: form.issueType,
        priority: form.priority,
        description: form.description,
      });
      setForm((current) => ({ ...current, description: "" }));
      await fetchData();
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Unable to submit issue.");
    } finally {
      setSubmitting(false);
    }
  };

  const issueCounts = useMemo(
    () => ({
      open: issues.filter((issue) => issue.status === "OPEN").length,
      critical: issues.filter((issue) => issue.priority === "CRITICAL").length,
    }),
    [issues],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[.3em] text-slate-400">
          Issues
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Order {id}</h1>
        <p className="mt-2 text-slate-500">
          Production supervisor and QA staff can log issues per stage, and the
          backend will keep the stage attached.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="Total Issues" value={issues.length} />
          <Metric label="Open Issues" value={issueCounts.open} />
          <Metric label="Critical" value={issueCounts.critical} />
        </div>
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">Report Issue</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[.24em] text-slate-500">
              Stage
            </span>
            <select
              value={form.stageId}
              onChange={(e) =>
                setForm((current) => ({ ...current, stageId: e.target.value }))
              }
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.stageOrder}. {stage.stageName}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[.24em] text-slate-500">
              Issue Type
            </span>
            <select
              value={form.issueType}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  issueType: e.target.value,
                }))
              }
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="OTHER">Other</option>
              <option value="QUALITY_DEFECT">Quality Defect</option>
              <option value="MACHINE_FAILURE">Machine Failure</option>
              <option value="MATERIAL_SHORTAGE">Material Shortage</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[.24em] text-slate-500">
              Priority
            </span>
            <select
              value={form.priority}
              onChange={(e) =>
                setForm((current) => ({ ...current, priority: e.target.value }))
              }
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="NORMAL">Normal</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.24em] text-slate-500">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
              rows={4}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Describe the issue, notes, or what QA observed..."
            />
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end">
          <button
            disabled={submitting}
            onClick={submitIssue}
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Issue"}
          </button>
        </div>
        {error ? (
          <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>
        ) : null}
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
        <h2 className="text-2xl font-black text-slate-900">Issue Log</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">
            Loading live issue data...
          </p>
        ) : null}
        <table className="mt-6 min-w-full text-left text-sm text-slate-700">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[.2em] text-slate-500">
              <th className="py-4 pr-6">Stage</th>
              <th className="py-4 pr-6">Type</th>
              <th className="py-4 pr-6">Priority</th>
              <th className="py-4 pr-6">Reported By</th>
              <th className="py-4 pr-6">Date</th>
              <th className="py-4 pl-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {issues.map((issue) => (
              <tr key={issue.id}>
                <td className="py-5 pr-6">{issue.stage?.stageName || "—"}</td>
                <td className="py-5 pr-6 font-bold">
                  {issue.issueType.replace(/_/g, " ")}
                </td>
                <td className="py-5 pr-6">{issue.priority}</td>
                <td className="py-5 pr-6">
                  {issue.reportedBy?.username || "—"}
                </td>
                <td className="py-5 pr-6">
                  {new Date(issue.createdAt).toLocaleString()}
                </td>
                <td className="py-5 pl-6">{issue.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
