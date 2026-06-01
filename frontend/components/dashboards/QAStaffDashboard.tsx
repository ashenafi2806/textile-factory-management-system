"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useCanPerform } from "@/hooks/useCanPerform";

type Stage = {
  id: string;
  stageName: string;
  status: string;
  completedAt?: string | null;
  completedBy?: { username?: string } | null;
  reviewedBy?: { username?: string } | null;
  reviewedAt?: string | null;
  orderId?: string;
  orderNumber?: string;
  productName?: string;
  supervisor?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  assignedSupervisor?: { username?: string } | null;
  stages: Stage[];
};

type Inspection = {
  id: string;
  productionOrderId: string;
  stageId: string;
  status: string;
  result: string;
  defects: number;
  measurements?: string;
  notes?: string;
  createdAt: string;
  inspectedBy?: { username?: string; email?: string };
  stage?: { stageName?: string; stageOrder?: number; status?: string };
};

export function QAStaffDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [measurements, setMeasurements] = useState("");
  const [defects, setDefects] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRecordInspection = useCanPerform([
    "QA_STAFF",
    "QA_MANAGER",
    "ADMIN",
  ]);
  const canDecideInspection = useCanPerform([
    "QA_STAFF",
    "QA_MANAGER",
    "ADMIN",
  ]);

  const fetchAll = async () => {
    const [ordersRes, inspectionsRes] = await Promise.all([
      api.get("/api/production"),
      api.get("/api/production/qa/inspections"),
    ]);
    setOrders(ordersRes.data);
    setInspections(inspectionsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    void fetchAll();
    const timer = window.setInterval(() => void fetchAll().catch(() => {}), 15000);
    return () => window.clearInterval(timer);
  }, []);

  // For each (order, stage), find the latest inspection timestamp. This drives
  // both the "Stages waiting for inspection" table (sort latest first) and the
  // "Inspections awaiting your decision" table (show only the latest PENDING
  // per (order, stage), since older PENDING entries are SUPERSEDED).
  const latestInspectionAtByStage = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of inspections) {
      const key = `${i.productionOrderId}:${i.stageId}`;
      const ts = new Date(i.createdAt).getTime();
      const prev = map.get(key) ?? 0;
      if (ts > prev) map.set(key, ts);
    }
    return map;
  }, [inspections]);

  const pendingStages = useMemo(
    () =>
      orders
        .flatMap((order) =>
          order.stages
            .filter((stage) => stage.status === "QA_PENDING")
            .map((stage) => ({
              ...stage,
              orderId: order.id,
              orderNumber: order.orderNumber,
              productName: order.productName,
              supervisor: order.assignedSupervisor?.username || "Not assigned",
            })),
        )
        .sort((a, b) => {
          // Most-recently-touched stage first so the latest entry surfaces
          // at the top of the list.
          const aKey = `${a.orderId ?? ""}:${a.id}`;
          const bKey = `${b.orderId ?? ""}:${b.id}`;
          const aTs = latestInspectionAtByStage.get(aKey) ?? 0;
          const bTs = latestInspectionAtByStage.get(bKey) ?? 0;
          if (bTs !== aTs) return bTs - aTs;
          return a.stageName.localeCompare(b.stageName);
        }),
    [orders, latestInspectionAtByStage],
  );

  const pendingInspections = useMemo(() => {
    // Keep only the latest PENDING inspection per (order, stage). Backend now
    // marks older PENDING rows as SUPERSEDED, but we dedupe again here as a
    // safety net.
    const latest = new Map<string, Inspection>();
    for (const i of inspections) {
      if ((i.status ?? "").toUpperCase() !== "PENDING") continue;
      const key = `${i.productionOrderId}:${i.stageId}`;
      const existing = latest.get(key);
      if (
        !existing ||
        new Date(i.createdAt).getTime() >
          new Date(existing.createdAt).getTime()
      ) {
        latest.set(key, i);
      }
    }
    return Array.from(latest.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [inspections]);

  const decidedInspections = useMemo(
    () =>
      inspections
        .filter((i) => {
          const s = (i.status ?? "").toUpperCase();
          return s !== "PENDING" && s !== "SUPERSEDED";
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [inspections],
  );

  const inspectionKey = (orderId: string, stageId: string, inspectionId: string) =>
    `${orderId}:${stageId}:${inspectionId}`;

  const submitInspection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStage) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(
        `/production/${selectedStage.orderId}/stages/${selectedStage.id}/qa-inspection`,
        {
          measurements,
          defects,
          notes,
        },
      );
      setSelectedStage(null);
      setMeasurements("");
      setDefects(0);
      setNotes("");
      await fetchAll();
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Unable to save inspection.");
    } finally {
      setSaving(false);
    }
  };

  const decideInspection = async (
    orderId: string,
    stageId: string,
    inspectionId: string,
    decision: "approve" | "reject",
  ) => {
    const key = inspectionKey(orderId, stageId, inspectionId);
    setDeciding(key);
    setError(null);
    try {
      const url = `/production/${orderId}/stages/${stageId}/qa-inspection/${inspectionId}/${decision}`;
      if (decision === "reject") {
        const reason =
          typeof window === "undefined"
            ? ""
            : window.prompt("Reason for rejection (optional):") ?? "";
        await api.patch(url, { reason });
      } else {
        await api.patch(url, {});
      }
      await fetchAll();
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Unable to record decision.");
    } finally {
      setDeciding(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
        Loading QA dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Stages Awaiting Review" value={pendingStages.length} />
        <MetricCard
          title="Inspections to Decide"
          value={pendingInspections.length}
        />
        <MetricCard
          title="Approved Stages"
          value={
            orders
              .flatMap((o) => o.stages)
              .filter((s) => s.status === "QA_APPROVED").length
          }
        />
        <MetricCard
          title="Rejected Stages"
          value={
            orders
              .flatMap((o) => o.stages)
              .filter((s) => s.status === "QA_REJECTED").length
          }
        />
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          {canRecordInspection ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
                    Step 1 — Enter review
                  </p>
                <h2 className="text-xl font-black text-slate-900">
                  Stages waiting for inspection
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Record measurements and defects. The stage stays in QA_PENDING
                  until you explicitly approve or reject below.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[.2em] text-slate-500">
                    <th className="py-3 pr-5">Order #</th>
                    <th className="py-3 pr-5">Product</th>
                    <th className="py-3 pr-5">Stage</th>
                    <th className="py-3 pr-5">Supervisor</th>
                    <th className="py-3 pl-5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingStages.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-sm text-slate-500"
                      >
                        No stages are waiting for an inspection.
                      </td>
                    </tr>
                  ) : null}
                  {pendingStages.map((stage) => (
                    <tr key={stage.id}>
                      <td className="py-4 pr-5 font-black text-slate-900">
                        {stage.orderNumber}
                      </td>
                      <td className="py-4 pr-5 text-slate-700">
                        {stage.productName}
                      </td>
                      <td className="py-4 pr-5 text-slate-700">
                        {stage.stageName}
                      </td>
                      <td className="py-4 pr-5 text-slate-700">
                        {stage.supervisor}
                      </td>
                      <td className="py-4 pl-5">
                        <button
                          onClick={() => setSelectedStage(stage)}
                          className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-white hover:bg-indigo-700"
                        >
                          Enter Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          ) : null}

          {canDecideInspection ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
                  Step 2 — Approve or reject
                </p>
                <h2 className="text-xl font-black text-slate-900">
                  Inspections awaiting your decision
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  These inspections were just recorded. Click Approve to move
                  the stage to QA_APPROVED, or Reject to send it back to the
                  supervisor.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[.2em] text-slate-500">
                    <th className="py-3 pr-5">Order #</th>
                    <th className="py-3 pr-5">Stage</th>
                    <th className="py-3 pr-5">Defects</th>
                    <th className="py-3 pr-5">Recorded</th>
                    <th className="py-3 pl-5">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingInspections.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-sm text-slate-500"
                      >
                        No inspections are waiting for a decision.
                      </td>
                    </tr>
                  ) : null}
                  {pendingInspections.map((insp) => {
                    const order = orders.find(
                      (o) => o.id === insp.productionOrderId,
                    );
                    const key = inspectionKey(
                      insp.productionOrderId,
                      insp.stageId,
                      insp.id,
                    );
                    return (
                      <tr key={insp.id}>
                        <td className="py-4 pr-5 font-black text-slate-900">
                          {order?.orderNumber ?? "—"}
                        </td>
                        <td className="py-4 pr-5 text-slate-700">
                          {insp.stage?.stageName ?? "—"}
                        </td>
                        <td className="py-4 pr-5 text-slate-700">
                          {insp.defects}
                        </td>
                        <td className="py-4 pr-5 text-slate-500">
                          {new Date(insp.createdAt).toLocaleString()}
                        </td>
                        <td className="py-4 pl-5">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                decideInspection(
                                  insp.productionOrderId,
                                  insp.stageId,
                                  insp.id,
                                  "approve",
                                )
                              }
                              disabled={deciding === key}
                              className="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-black uppercase tracking-[.24em] text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {deciding === key ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() =>
                                decideInspection(
                                  insp.productionOrderId,
                                  insp.stageId,
                                  insp.id,
                                  "reject",
                                )
                              }
                              disabled={deciding === key}
                              className="rounded-2xl bg-rose-600 px-3 py-2 text-xs font-black uppercase tracking-[.24em] text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          ) : null}

          {decidedInspections.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
                Recent decisions
              </p>
              <h2 className="text-xl font-black text-slate-900">
                Inspections you closed
              </h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[.2em] text-slate-500">
                      <th className="py-3 pr-5">Order #</th>
                      <th className="py-3 pr-5">Stage</th>
                      <th className="py-3 pr-5">Defects</th>
                      <th className="py-3 pr-5">Decision</th>
                      <th className="py-3 pl-5">Decided at</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {decidedInspections.map((insp) => {
                      const order = orders.find(
                        (o) => o.id === insp.productionOrderId,
                      );
                      const isApproved =
                        (insp.status ?? "").toUpperCase() === "APPROVED";
                      return (
                        <tr key={insp.id}>
                          <td className="py-4 pr-5 font-black text-slate-900">
                            {order?.orderNumber ?? "—"}
                          </td>
                          <td className="py-4 pr-5 text-slate-700">
                            {insp.stage?.stageName ?? "—"}
                          </td>
                          <td className="py-4 pr-5 text-slate-700">
                            {insp.defects}
                          </td>
                          <td className="py-4 pr-5">
                            <span
                              className={
                                isApproved
                                  ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[.2em] text-emerald-700"
                                  : "rounded-full bg-rose-100 px-3 py-1 text-xs font-black uppercase tracking-[.2em] text-rose-700"
                              }
                            >
                              {isApproved ? "Approved" : "Rejected"}
                            </span>
                          </td>
                          <td className="py-4 pl-5 text-slate-500">
                            {new Date(insp.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">QA workflow</h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <span className="font-black text-slate-900">1.</span> Supervisor
                submits the stage for QA review.
              </li>
              <li>
                <span className="font-black text-slate-900">2.</span> QA staff
                records measurements and defects (Step 1).
              </li>
              <li>
                <span className="font-black text-slate-900">3.</span> QA staff
                explicitly approves or rejects the inspection (Step 2).
              </li>
              <li>
                <span className="font-black text-slate-900">4.</span> Once all
                stages are approved, the QA manager releases the order to
                finished goods.
              </li>
            </ol>
            <div className="mt-4 grid gap-2">
              <Link
                href="/production"
                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-900 hover:bg-indigo-50"
              >
                Open production overview
              </Link>
            </div>
          </div>
        </aside>
      </section>

      {selectedStage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-4xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Record QA Inspection
                </h2>
                <p className="text-sm text-slate-500">
                  Stage {selectedStage.stageName} for{" "}
                  {selectedStage.productName}
                </p>
              </div>
              <button
                onClick={() => setSelectedStage(null)}
                className="text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitInspection} className="space-y-4">
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
                  Measurements
                </span>
                <textarea
                  value={measurements}
                  onChange={(e) => setMeasurements(e.target.value)}
                  className="mt-2 h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="e.g. Length: 10cm, Weight: 1.2kg"
                />
              </label>
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
                  Defects
                </span>
                <input
                  type="number"
                  min={0}
                  value={defects}
                  onChange={(e) => setDefects(Number(e.target.value) || 0)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Entering defects does NOT reject the stage. After saving,
                  approve or reject it from the list below.
                </span>
              </label>
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
                  Notes
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Observations, context, or follow-ups..."
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStage(null)}
                  className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Inspection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[.24em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
