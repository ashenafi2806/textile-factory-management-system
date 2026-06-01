"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { OrderStatusBadge } from "@/components/production/OrderStatusBadge";
import { useCanPerform } from "@/hooks/useCanPerform";
import { useAuth } from "@/context/auth-context";

type Output = {
  id: string;
  goodQuantity: number;
  defectiveQuantity: number;
  shiftDate: string;
  notes?: string;
  supervisor?: { username?: string };
};

type Stage = {
  id: string;
  stageName: string;
  stageOrder: number;
  status: string;
  totalGood?: number;
  totalDefective?: number;
  stageInputGood?: number;
  netGood?: number;
  carriedForwardGood?: number;
  assignedWorker?: {
    fullName?: string;
    position?: string;
    user?: { username?: string };
  };
  startedAt?: string | null;
  completedAt?: string | null;
  completedBy?: { username?: string } | null;
  reviewedBy?: { username?: string } | null;
  reviewedAt?: string | null;
  outputs: Output[];
  qualityInspections?: Array<{
    id: string;
    defects: number;
    measurements?: string | null;
    notes?: string | null;
    status: string;
    createdAt: string;
  }>;
  issues?: Array<{
    id: string;
    issueType: string;
    description: string;
    priority: string;
    status: string;
    reportedBy?: { username?: string };
  }>;
};

type ReleaseRequestStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export default function ProductionOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [requesting, setRequesting] = useState(false);

  const canView = useCanPerform([
    "PRODUCTION_MANAGER",
    "PRODUCTION_SUPERVISOR",
    "MANAGER",
    "ADMIN",
  ]);

  useEffect(() => {
    let alive = true;
    const fetchData = async () => {
      const res = await api.get(`/production/${id}`);
      if (alive) setOrder(res.data);
    };
    void fetchData();
    const timer = window.setInterval(() => void fetchData(), 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [id]);

  const isAssignedSupervisor = !!user && order?.assignedSupervisor?.id === user.id;
  const releaseRequestStatus: ReleaseRequestStatus =
    order?.releaseRequestStatus ?? "NONE";
  const canRequestRelease =
    !!order &&
    order.status !== "COMPLETED" &&
    (order.stages ?? []).length > 0 &&
    (order.stages ?? []).every((stage: { status: string }) => stage.status === "QA_APPROVED") &&
    releaseRequestStatus === "NONE" &&
    (isAssignedSupervisor || user?.roles?.includes("ADMIN"));

  const handleRequestRelease = async () => {
    if (!order) return;
    setRequesting(true);
    try {
      await api.post(`/production/${order.id}/request-release`);
      toast.success("Release request submitted for approval");
      const res = await api.get(`/production/${order.id}`);
      setOrder(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to request release");
    } finally {
      setRequesting(false);
    }
  };

  if (!order) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Loading order details...</div>;
  }

  if (!canView) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-2xl font-bold text-rose-800">Access Denied</h1>
        <p className="mt-2 text-rose-700">
          Only Production Supervisors, Production Managers, Managers, and
          Admins can view production order details. Use the QA dashboard for
          quality inspection work.
        </p>
      </div>
    );
  }

  const stages: Stage[] = order.stages ?? [];

  // Compute per-stage aggregates from outputs (backend doesn't return these as a flat field).
  // The "good" passed to the next stage is goodQuantity - defectiveQuantity of this stage.
  const stageAggregates: Record<string, { good: number; defective: number; netGood: number; qaDefects: number; stageInputGood: number }> = {};
  let previousNetGood = 0;
  for (const stage of stages) {
    const good = (stage.outputs ?? []).reduce((sum, o) => sum + (o.goodQuantity ?? 0), 0);
    const supervisorDefective = (stage.outputs ?? []).reduce((sum, o) => sum + (o.defectiveQuantity ?? 0), 0);
    const qaDefects = (stage.qualityInspections ?? [])
      .filter((i) => (i.status ?? "").toUpperCase() === "PENDING" || (i.status ?? "").toUpperCase() === "APPROVED")
      .reduce((sum, i) => sum + (i.defects ?? 0), 0);
    const totalDefective = supervisorDefective + qaDefects;
    const netGood = Math.max(0, good - totalDefective);
    stageAggregates[stage.id] = {
      good,
      defective: totalDefective,
      netGood,
      qaDefects,
      stageInputGood: previousNetGood,
    };
    previousNetGood = netGood;
  }

  const totalDefects = stages.reduce(
    (sum, stage) => sum + (stageAggregates[stage.id]?.defective ?? 0),
    0,
  );
  const totalGood = stages.reduce(
    (sum, stage) => sum + (stageAggregates[stage.id]?.good ?? 0),
    0,
  );
  const finalGood = previousNetGood;
  const remainingGood = Math.max(0, (order.targetQuantity ?? 0) - totalDefects);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.3em] text-slate-400">Production Order</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">{order.orderNumber}</h1>
            <p className="mt-1 text-slate-500">{order.productName} | Supervisor {order.assignedSupervisor?.username || "Not assigned"}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Target" value={order.targetQuantity} />
          <Stat label="Reported Good" value={totalGood} />
          <Stat label="Total Defects" value={totalDefects} />
          <Stat label="Final Good" value={finalGood} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Remaining Good" value={remainingGood} />
          <Stat label="Deadline" value={new Date(order.deadline).toLocaleDateString()} />
          <Stat label="Current Stage" value={(stages.find((stage) => stage.status === "IN_PROGRESS")?.stageName || order.currentStage || "Pending").replace(/_/g, " ")} />
          <Stat label="Stages" value={stages.length} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Finished-Goods Release</h2>
            <p className="mt-1 text-sm text-slate-500">
              Submit a release request once every stage has passed QA. QA Manager
              / Storekeeper will move the order to finished-goods inventory.
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-slate-400">Request status:</span>{" "}
                <span
                  className={`font-black uppercase tracking-wider text-[10px] px-2 py-1 rounded ${
                    releaseRequestStatus === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : releaseRequestStatus === "APPROVED"
                        ? "bg-emerald-100 text-emerald-700"
                        : releaseRequestStatus === "REJECTED"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {releaseRequestStatus}
                </span>
              </div>
              {order.releaseRequestedBy?.username ? (
                <div>
                  <span className="text-slate-400">Requested by:</span>{" "}
                  <span className="font-semibold text-slate-900">
                    {order.releaseRequestedBy.username}
                  </span>
                  {order.releaseRequestedAt
                    ? ` on ${new Date(order.releaseRequestedAt).toLocaleString()}`
                    : null}
                </div>
              ) : null}
              {order.releaseApprovedBy?.username ? (
                <div>
                  <span className="text-slate-400">Approved by:</span>{" "}
                  <span className="font-semibold text-slate-900">
                    {order.releaseApprovedBy.username}
                  </span>
                  {order.releaseApprovedAt
                    ? ` on ${new Date(order.releaseApprovedAt).toLocaleString()}`
                    : null}
                </div>
              ) : null}
              {order.releaseRejectionReason ? (
                <div className="sm:col-span-2">
                  <span className="text-slate-400">Rejection reason:</span>{" "}
                  <span className="font-semibold text-rose-700">
                    {order.releaseRejectionReason}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          {canRequestRelease ? (
            <button
              type="button"
              onClick={handleRequestRelease}
              disabled={requesting}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow hover:bg-emerald-700 disabled:opacity-50"
            >
              {requesting ? "Submitting…" : "Request Release to Inventory"}
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Stage Breakdown</h2>
          <div className="flex gap-4 text-sm font-semibold text-indigo-600">
            <Link href={`/production/${id}/stages`}>Stages</Link>
            <Link href={`/production/${id}/output`}>Output</Link>
            <Link href={`/production/${id}/issues`}>Issues</Link>
          </div>
        </div>

        <div className="space-y-4">
          {stages.map((stage) => {
            const agg = stageAggregates[stage.id] ?? { good: 0, defective: 0, netGood: 0, qaDefects: 0, stageInputGood: 0 };
            return (
              <article key={stage.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {stage.stageOrder}. {stage.stageName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{stage.status.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Stage input good: <span className="font-semibold text-slate-900">{agg.stageInputGood}</span>
                      {" "}| Good: <span className="font-semibold text-emerald-700">{agg.good}</span>
                      {" "}| Defects: <span className="font-semibold text-rose-600">{agg.defective}</span>
                      {agg.qaDefects > 0 ? (
                        <span className="text-xs text-amber-700"> (includes {agg.qaDefects} QA)</span>
                      ) : null}
                      {" "}| Good after defects: <span className="font-semibold text-emerald-700">{agg.netGood}</span>
                    </p>
                    {stage.completedBy?.username ? <p className="mt-1 text-sm text-slate-500">Completed by {stage.completedBy.username}</p> : null}
                    {stage.reviewedBy?.username ? <p className="mt-1 text-sm text-slate-500">QA by {stage.reviewedBy.username}{stage.reviewedAt ? ` on ${new Date(stage.reviewedAt).toLocaleString()}` : ""}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      {stage.assignedWorker?.fullName || stage.assignedWorker?.user?.username ? (
                        <span>
                          Worker:{" "}
                          <span className="font-semibold text-slate-700">
                            {stage.assignedWorker?.fullName ||
                              stage.assignedWorker?.user?.username}
                          </span>
                          {stage.assignedWorker?.position
                            ? ` (${stage.assignedWorker.position})`
                            : null}
                        </span>
                      ) : null}
                      {stage.startedAt ? (
                        <span>
                          Started:{" "}
                          <span className="font-semibold text-slate-700">
                            {new Date(stage.startedAt).toLocaleString()}
                          </span>
                        </span>
                      ) : null}
                      {stage.completedAt ? (
                        <span>
                          Completed:{" "}
                          <span className="font-semibold text-slate-700">
                            {new Date(stage.completedAt).toLocaleString()}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[.2em] text-slate-500">
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 pr-4">Supervisor</th>
                        <th className="py-3 pr-4">Good</th>
                        <th className="py-3 pr-4">Defect</th>
                        <th className="py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stage.outputs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-sm text-slate-500">
                            No output records yet.
                          </td>
                        </tr>
                      ) : null}
                      {stage.outputs.map((output) => (
                        <tr key={output.id}>
                          <td className="py-3 pr-4">{new Date(output.shiftDate).toLocaleDateString()}</td>
                          <td className="py-3 pr-4">{output.supervisor?.username || "—"}</td>
                          <td className="py-3 pr-4 font-semibold text-emerald-700">{output.goodQuantity}</td>
                          <td className="py-3 pr-4 font-semibold text-rose-600">{output.defectiveQuantity}</td>
                          <td className="py-3">{output.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[.24em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}
