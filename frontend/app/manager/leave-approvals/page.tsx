"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import workforceService from "@/services/workforceService";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/auth-context";
import { useCanPerform } from "@/hooks/useCanPerform";

type LeaveRequest = {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  worker?: {
    position?: string;
    department?: string;
    user?: { username?: string; email?: string };
  };
};

type OvertimeRequest = {
  id: string;
  workerName?: string;
  hours?: number;
  reason?: string;
  date?: string;
  status?: string;
  createdBy?: { username?: string };
  worker?: { user?: { username?: string } };
};

type HiringRequest = {
  id: string;
  role: string;
  headcount: number;
  notes?: string;
  department?: string;
  requiredBy?: string;
  status: string;
  requestedBy?: { username?: string };
  createdAt?: string;
};

type LeaveAnalytics = {
  totalWorkers: number;
  activeLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  availableWorkers: number;
  monthlyLeaves?: Array<{ month: string; count: number }>;
};

type StaffingDashboard = {
  message?: string;
  department?: string;
  headcount: number;
  approvedPositions?: Array<{ position: string; count: number }>;
  gaps: Array<{
    position: string;
    approved: number;
    current: number;
    gap: number;
  }>;
  workersByPosition?: Record<string, number>;
  recommendations?: string[];
};

type Tab = "overview" | "leaves" | "overtime" | "hiring" | "staffing";

export default function ManagerConsolePage() {
  const { user } = useAuth();
  const isManager = useCanPerform(["MANAGER", "ADMIN"]);

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRequest[]>([]);
  const [hiring, setHiring] = useState<HiringRequest[]>([]);
  const [analytics, setAnalytics] = useState<LeaveAnalytics | null>(null);
  const [staffing, setStaffing] = useState<StaffingDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);

  const [hiringForm, setHiringForm] = useState({
    role: "",
    headcount: 1,
    notes: "",
    department: "",
    requiredBy: "",
  });
  const [creating, setCreating] = useState(false);
  const [hiringError, setHiringError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        workforceService.getPendingLeaves(),
        workforceService.getOvertimePending(),
        workforceService.getHiringRequests(),
        workforceService.getLeaveAnalytics(),
        workforceService.getStaffingDashboard(),
      ]);
      if (results[0].status === "fulfilled")
        setLeaves((results[0].value.data ?? []) as LeaveRequest[]);
      if (results[1].status === "fulfilled")
        setOvertime((results[1].value.data ?? []) as OvertimeRequest[]);
      if (results[2].status === "fulfilled")
        setHiring((results[2].value.data ?? []) as HiringRequest[]);
      if (results[3].status === "fulfilled")
        setAnalytics(results[3].value.data ?? null);
      if (results[4].status === "fulfilled")
        setStaffing(results[4].value.data ?? null);
    } catch (e) {
      console.error(e);
      setError("Failed to load some workforce data. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isManager) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isManager]);

  const decideLeave = async (
    id: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    setBusyId(id);
    try {
      await workforceService.approveLeave(id, status);
      setLeaves((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      console.error(e);
      setError("Unable to update leave request.");
    } finally {
      setBusyId(null);
    }
  };

  const decideOvertime = async (
    id: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    setBusyId(id);
    try {
      if (status === "APPROVED") {
        await workforceService.approveOvertime(id);
      } else {
        await workforceService.rejectOvertime(id);
      }
      setOvertime((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      console.error(e);
      setError("Unable to update overtime request.");
    } finally {
      setBusyId(null);
    }
  };

  const submitHiring = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setHiringError(null);
    try {
      const payload: any = {
        role: hiringForm.role,
        headcount: Number(hiringForm.headcount),
      };
      if (hiringForm.notes) payload.notes = hiringForm.notes;
      if (hiringForm.department) payload.department = hiringForm.department;
      if (hiringForm.requiredBy) payload.requiredBy = hiringForm.requiredBy;
      const res = await workforceService.createHiringRequest(payload);
      setHiring((prev) => [res.data, ...prev]);
      setHiringForm({
        role: "",
        headcount: 1,
        notes: "",
        department: "",
        requiredBy: "",
      });
    } catch (e: any) {
      console.error(e);
      setHiringError(
        e?.response?.data?.message || "Unable to create hiring requisition.",
      );
    } finally {
      setCreating(false);
    }
  };

  const tabs = useMemo<Array<{ key: Tab; label: string; count?: number }>>(
    () => [
      { key: "overview", label: "Overview" },
      { key: "leaves", label: "Leaves", count: leaves.length },
      { key: "overtime", label: "Overtime", count: overtime.length },
      { key: "hiring", label: "Hiring", count: hiring.length },
      {
        key: "staffing",
        label: "Staffing",
        count: staffing?.gaps?.length ?? 0,
      },
    ],
    [leaves.length, overtime.length, hiring.length, staffing?.gaps?.length],
  );

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-slate-900" />
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-20">
          <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-2xl font-bold text-rose-800">Access Denied</h1>
            <p className="mt-2 text-rose-700">
              Only Managers can use the Manager Console. The
              {" "}<code className="rounded bg-rose-100 px-1 text-sm">/manager/leave-approvals</code>{" "}
              route is reserved for the Manager role.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-20">
        <div className="mx-auto max-w-7xl space-y-6">
          <header>
            <p className="text-xs font-black uppercase tracking-[.3em] text-indigo-600">
              Manager Console
            </p>
            <h1 className="mt-2 text-4xl font-black text-slate-900">
              Workforce & Approvals
            </h1>
            <p className="mt-2 max-w-3xl text-slate-500">
              View workforce analytics, approve leave and overtime requests, and
              manage hiring requisitions and staffing levels. Restricted to the
              Manager role.
            </p>
          </header>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    "rounded-xl px-4 py-2 text-sm font-black transition-colors " +
                    (isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100")
                  }
                >
                  {tab.label}
                  {typeof tab.count === "number" ? (
                    <span
                      className={
                        "ml-2 rounded-full px-2 py-0.5 text-[10px] font-black " +
                        (isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-700")
                      }
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
            <div className="ml-auto flex items-center pr-2">
              <button
                onClick={() => void load()}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </nav>

          {activeTab === "overview" ? (
            <Overview
              analytics={analytics}
              staffing={staffing}
              leaves={leaves}
              overtime={overtime}
              hiring={hiring}
            />
          ) : null}

          {activeTab === "leaves" ? (
            <LeavesTab
              leaves={leaves}
              onDecide={decideLeave}
              busyId={busyId}
            />
          ) : null}

          {activeTab === "overtime" ? (
            <OvertimeTab
              items={overtime}
              onDecide={decideOvertime}
              busyId={busyId}
            />
          ) : null}

          {activeTab === "hiring" ? (
            <HiringTab
              items={hiring}
              form={hiringForm}
              setForm={setHiringForm}
              onSubmit={submitHiring}
              creating={creating}
              formError={hiringError}
            />
          ) : null}

          {activeTab === "staffing" ? <StaffingTab data={staffing} /> : null}
        </div>
      </main>
    </div>
  );
}

function Overview({
  analytics,
  staffing,
  leaves,
  overtime,
  hiring,
}: {
  analytics: LeaveAnalytics | null;
  staffing: StaffingDashboard | null;
  leaves: LeaveRequest[];
  overtime: OvertimeRequest[];
  hiring: HiringRequest[];
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Total workers"
          value={analytics?.totalWorkers ?? 0}
        />
        <Metric
          label="Available now"
          value={analytics?.availableWorkers ?? 0}
          tone="emerald"
        />
        <Metric
          label="Pending leaves"
          value={analytics?.pendingLeaves ?? leaves.length}
          tone="amber"
        />
        <Metric
          label="Staffing gaps"
          value={staffing?.gaps?.length ?? 0}
          tone="rose"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Pending decisions"
          subtitle="Requests waiting for your action"
        >
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-slate-600">Leave requests</span>
              <span className="font-black text-slate-900">{leaves.length}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-600">Overtime requests</span>
              <span className="font-black text-slate-900">
                {overtime.length}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-600">Hiring requisitions</span>
              <span className="font-black text-slate-900">
                {hiring.filter((h) => h.status === "PENDING").length} pending
                of {hiring.length}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-600">Staffing gaps</span>
              <span className="font-black text-rose-700">
                {staffing?.gaps?.length ?? 0}
              </span>
            </li>
          </ul>
        </Panel>

        <Panel
          title="Workforce analytics"
          subtitle="Snapshot of your department"
        >
          {analytics ? (
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-600">Total workers</span>
                <span className="font-black text-slate-900">
                  {analytics.totalWorkers}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600">On leave (active)</span>
                <span className="font-black text-slate-900">
                  {analytics.activeLeaves}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600">Available</span>
                <span className="font-black text-emerald-700">
                  {analytics.availableWorkers}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600">Approved leaves</span>
                <span className="font-black text-slate-900">
                  {analytics.approvedLeaves}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600">Rejected leaves</span>
                <span className="font-black text-slate-900">
                  {analytics.rejectedLeaves}
                </span>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No analytics available.</p>
          )}
        </Panel>
      </section>

      {staffing?.department ? (
        <Panel
          title={`Department: ${staffing.department}`}
          subtitle="Staffing headcount and gap analysis"
        >
          <p className="text-sm text-slate-500">
            Current headcount:{" "}
            <span className="font-black text-slate-900">
              {staffing.headcount}
            </span>{" "}
            | Approved positions:{" "}
            <span className="font-black text-slate-900">
              {staffing.approvedPositions?.reduce(
                (sum, p) => sum + p.count,
                0,
              ) ?? 0}
            </span>
          </p>
          {staffing.gaps.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm">
              {staffing.gaps.map((g) => (
                <li
                  key={g.position}
                  className="flex justify-between rounded-lg bg-rose-50 px-3 py-2"
                >
                  <span className="text-slate-700">{g.position}</span>
                  <span className="font-black text-rose-700">
                    Short by {g.gap} ({g.current}/{g.approved})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-emerald-700 font-bold">
              All positions fully staffed.
            </p>
          )}
        </Panel>
      ) : null}
    </div>
  );
}

function LeavesTab({
  leaves,
  onDecide,
  busyId,
}: {
  leaves: LeaveRequest[];
  onDecide: (id: string, status: "APPROVED" | "REJECTED") => void;
  busyId: string | null;
}) {
  if (leaves.length === 0) {
    return (
      <Panel title="Leave requests" subtitle="Pending approvals">
        <p className="text-sm text-slate-500">
          No pending leave requests.
        </p>
      </Panel>
    );
  }
  return (
    <Panel title="Leave requests" subtitle={`${leaves.length} pending`}>
      <ul className="space-y-3">
        {leaves.map((l) => (
          <li
            key={l.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-black text-slate-900">
                  {l.worker?.user?.username ?? "—"}
                </p>
                <p className="text-xs uppercase tracking-[.2em] text-slate-500">
                  {l.worker?.position ?? "Worker"} ·{" "}
                  {l.worker?.department ?? "Department"}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {new Date(l.startDate).toLocaleDateString()} –{" "}
                  {new Date(l.endDate).toLocaleDateString()}
                </p>
                {l.reason ? (
                  <p className="mt-1 text-sm italic text-slate-600">
                    "{l.reason}"
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onDecide(l.id, "APPROVED")}
                  disabled={busyId === l.id}
                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => onDecide(l.id, "REJECTED")}
                  disabled={busyId === l.id}
                  className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function OvertimeTab({
  items,
  onDecide,
  busyId,
}: {
  items: OvertimeRequest[];
  onDecide: (id: string, status: "APPROVED" | "REJECTED") => void;
  busyId: string | null;
}) {
  if (items.length === 0) {
    return (
      <Panel title="Overtime requests" subtitle="Pending approvals">
        <p className="text-sm text-slate-500">
          No pending overtime requests.
        </p>
      </Panel>
    );
  }
  return (
    <Panel title="Overtime requests" subtitle={`${items.length} pending`}>
      <ul className="space-y-3">
        {items.map((o) => {
          const name =
            o.workerName ??
            o.worker?.user?.username ??
            o.createdBy?.username ??
            "—";
          return (
            <li
              key={o.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-black text-slate-900">{name}</p>
                  <p className="text-xs uppercase tracking-[.2em] text-slate-500">
                    {o.date
                      ? new Date(o.date).toLocaleDateString()
                      : "Pending date"}
                    {typeof o.hours === "number"
                      ? ` · ${o.hours} hrs`
                      : ""}
                  </p>
                  {o.reason ? (
                    <p className="mt-1 text-sm italic text-slate-600">
                      "{o.reason}"
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onDecide(o.id, "APPROVED")}
                    disabled={busyId === o.id}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onDecide(o.id, "REJECTED")}
                    disabled={busyId === o.id}
                    className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function HiringTab({
  items,
  form,
  setForm,
  onSubmit,
  creating,
  formError,
}: {
  items: HiringRequest[];
  form: {
    role: string;
    headcount: number;
    notes: string;
    department: string;
    requiredBy: string;
  };
  setForm: (v: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  creating: boolean;
  formError: string | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Panel
        title="Create hiring requisition"
        subtitle="HR Admin will approve or reject"
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Role">
            <input
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input w-full"
              placeholder="Cutting Operator"
            />
          </Field>
          <Field label="Headcount">
            <input
              required
              type="number"
              min={1}
              value={form.headcount}
              onChange={(e) =>
                setForm({ ...form, headcount: Number(e.target.value) || 1 })
              }
              className="input w-full"
            />
          </Field>
          <Field label="Department">
            <input
              value={form.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value })
              }
              className="input w-full"
              placeholder="Production"
            />
          </Field>
          <Field label="Required by">
            <input
              type="date"
              value={form.requiredBy}
              onChange={(e) =>
                setForm({ ...form, requiredBy: e.target.value })
              }
              className="input w-full"
            />
          </Field>
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input w-full"
              rows={3}
              placeholder="Justification, urgency, etc."
            />
          </Field>
          {formError ? (
            <p className="text-sm text-rose-700">{formError}</p>
          ) : null}
          <button
            type="submit"
            disabled={creating}
            className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? "Submitting..." : "Submit requisition"}
          </button>
        </form>
      </Panel>

      <Panel
        title="Hiring requisitions"
        subtitle={`${items.length} total`}
      >
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hiring requisitions yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((h) => (
              <li
                key={h.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-slate-900">
                      {h.role}{" "}
                      <span className="text-slate-500 font-semibold">
                        × {h.headcount}
                      </span>
                    </p>
                    <p className="text-xs uppercase tracking-[.2em] text-slate-500">
                      {h.department ?? "Department not set"}
                      {h.requiredBy
                        ? ` · by ${new Date(h.requiredBy).toLocaleDateString()}`
                        : ""}
                    </p>
                    {h.notes ? (
                      <p className="mt-1 text-sm italic text-slate-600">
                        "{h.notes}"
                      </p>
                    ) : null}
                    {h.requestedBy?.username ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Requested by {h.requestedBy.username}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={
                      "rounded-full px-3 py-1 text-xs font-black uppercase tracking-[.2em] " +
                      (h.status === "PENDING"
                        ? "bg-amber-100 text-amber-700"
                        : h.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700")
                    }
                  >
                    {h.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function StaffingTab({ data }: { data: StaffingDashboard | null }) {
  if (!data) {
    return (
      <Panel title="Staffing" subtitle="Headcount and gaps">
        <p className="text-sm text-slate-500">No staffing data available.</p>
      </Panel>
    );
  }
  if (!data.department) {
    return (
      <Panel
        title="Staffing"
        subtitle="Headcount and gaps"
      >
        <p className="text-sm text-slate-500">
          {data.message ||
            "You are not assigned to a department. Ask HR to assign you."}
        </p>
      </Panel>
    );
  }
  return (
    <div className="space-y-6">
      <Panel
        title={`${data.department} staffing`}
        subtitle={`Headcount ${data.headcount}`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[.2em] text-slate-500">
              Approved positions
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              {(data.approvedPositions ?? []).map((p) => (
                <li
                  key={p.position}
                  className="flex justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="text-slate-700">{p.position}</span>
                  <span className="font-black text-slate-900">
                    {p.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[.2em] text-slate-500">
              Current headcount by position
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              {Object.entries(data.workersByPosition ?? {}).map(
                ([pos, count]) => (
                  <li
                    key={pos}
                    className="flex justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="text-slate-700">{pos}</span>
                    <span className="font-black text-slate-900">{count}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel
        title="Staffing gaps"
        subtitle="Positions short of the approved count"
      >
        {data.gaps.length === 0 ? (
          <p className="text-sm font-bold text-emerald-700">
            All positions fully staffed.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.gaps.map((g) => (
              <li
                key={g.position}
                className="flex flex-col gap-1 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 sm:flex-row sm:justify-between sm:items-center"
              >
                <span className="font-black text-slate-900">{g.position}</span>
                <span className="text-rose-700 font-bold">
                  Short by {g.gap} ({g.current}/{g.approved})
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {data.recommendations && data.recommendations.length > 0 ? (
        <Panel
          title="Recommendations"
          subtitle="Suggestions based on current gaps"
        >
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
            {data.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
          {subtitle}
        </p>
        <h2 className="mt-1 text-xl font-black text-slate-900">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-black text-slate-900">
      <span className="block text-[10px] uppercase tracking-[.24em] text-slate-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Metric({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "emerald" | "amber" | "rose";
}) {
  const colors: Record<string, string> = {
    slate: "text-slate-900",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[.24em] text-slate-500">
        {label}
      </p>
      <p className={"mt-2 text-3xl font-black " + colors[tone]}>{value}</p>
    </div>
  );
}
