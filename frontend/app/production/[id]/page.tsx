"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { OrderStatusBadge } from "@/components/production/OrderStatusBadge";

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
  completedBy?: { username?: string } | null;
  reviewedBy?: { username?: string } | null;
  reviewedAt?: string | null;
  outputs: Output[];
  issues?: Array<{
    id: string;
    issueType: string;
    description: string;
    priority: string;
    status: string;
    reportedBy?: { username?: string };
  }>;
};

export default function ProductionOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);

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

  if (!order) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Loading order details...</div>;
  }

  const stages: Stage[] = order.stages ?? [];
  const totalDefects = order.totalDefectiveRecorded ?? stages.reduce((sum, stage) => sum + (stage.totalDefective ?? 0), 0);
  const totalGood = order.totalGoodRecorded ?? stages.reduce((sum, stage) => sum + (stage.totalGood ?? 0), 0);
  const finalGood = order.netGood ?? Math.max(0, totalGood - totalDefects);
  const remainingGood = order.remainingGood ?? Math.max(0, order.targetQuantity - totalDefects);

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Stage Breakdown</h2>
          <div className="flex gap-4 text-sm font-semibold text-indigo-600">
            <Link href={`/production/${id}/stages`}>Stages</Link>
            <Link href={`/production/${id}/output`}>Output</Link>
            <Link href={`/production/${id}/issues`}>Issues</Link>
          </div>
        </div>

        <div className="space-y-4">
          {stages.map((stage) => (
            <article key={stage.id} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {stage.stageOrder}. {stage.stageName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{stage.status.replace(/_/g, " ")}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Stage input good: <span className="font-semibold text-slate-900">{stage.stageInputGood ?? 0}</span> | Defects: <span className="font-semibold text-rose-600">{stage.totalDefective ?? 0}</span> | Good after defects: <span className="font-semibold text-emerald-700">{stage.carriedForwardGood ?? 0}</span>
                  </p>
                  {stage.completedBy?.username ? <p className="mt-1 text-sm text-slate-500">Completed by {stage.completedBy.username}</p> : null}
                  {stage.reviewedBy?.username ? <p className="mt-1 text-sm text-slate-500">QA by {stage.reviewedBy.username}{stage.reviewedAt ? ` on ${new Date(stage.reviewedAt).toLocaleString()}` : ""}</p> : null}
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
                    {stage.outputs.map((output) => (
                      <tr key={output.id}>
                        <td className="py-3 pr-4">{new Date(output.shiftDate).toLocaleDateString()}</td>
                        <td className="py-3 pr-4">{output.supervisor?.username || "—"}</td>
                        <td className="py-3 pr-4 font-semibold text-emerald-700">{stage.carriedForwardGood}</td>
                        <td className="py-3 pr-4 font-semibold text-rose-600">{output.defectiveQuantity}</td>
                        <td className="py-3">{output.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
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
