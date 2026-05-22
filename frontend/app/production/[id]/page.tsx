"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { OrderStatusBadge } from "@/components/production/OrderStatusBadge";

type StageOutput = {
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
  outputs: StageOutput[];
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

  const stages: Stage[] = order?.stages ?? [];
  const allOutputs = stages.flatMap((stage) => stage.outputs ?? []);
  const totalDefects = allOutputs.reduce(
    (sum, output) => sum + output.defectiveQuantity,
    0,
  );
  const totalGoodReported = allOutputs.reduce(
    (sum, output) => sum + output.goodQuantity,
    0,
  );
  const finalGood = Math.max(0, totalGoodReported - totalDefects);
  const remainingGood = order?.remainingGood ?? Math.max(0, (order?.targetQuantity ?? 0) - totalDefects);
  const currentStageName =
    stages.find((stage) => stage.status === "IN_PROGRESS")?.stageName ?? "PENDING";

  const stageRows = useMemo(
    () =>
      stages.map((stage) => {
        const stageGood = stage.outputs.reduce((sum, o) => sum + o.goodQuantity, 0);
        const stageDefects = stage.outputs.reduce(
          (sum, o) => sum + o.defectiveQuantity,
          0,
        );
        return { ...stage, stageGood, stageDefects };
      }),
    [stages],
  );

  if (!order) {
    return <div className="p-10 text-slate-500">Loading order details...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
              Production Order
            </p>
            <h1 className="text-3xl font-black text-slate-900">{order.orderNumber}</h1>
            <p className="text-sm text-slate-500 mt-1">{order.productName}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card label="Target Quantity" value={order.targetQuantity} />
          <Card label="Supervisor" value={order.assignedSupervisor?.username || "Not Assigned"} />
          <Card label="Deadline" value={new Date(order.deadline).toLocaleDateString()} />
          <Card label="Current Stage" value={currentStageName.replace(/_/g, " ")} />
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">Live Production Summary</h2>
        <p className="mt-2 text-slate-500">
          Defects are deducted from the target so the final good count stays visible in real time.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric label="Target" value={order.targetQuantity} />
          <Metric label="Reported Good" value={totalGoodReported} />
          <Metric label="Total Defects" value={totalDefects} />
          <Metric label="Final Good" value={finalGood} />
          <Metric label="Remaining Good" value={remainingGood} />
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">Stage Breakdown</h2>
          <div className="flex gap-3 text-sm text-slate-500">
            <Link href={`/production/${id}/stages`} className="font-black text-indigo-600">
              Manage Stages
            </Link>
            <Link href={`/production/${id}/output`} className="font-black text-indigo-600">
              Output History
            </Link>
            <Link href={`/production/${id}/issues`} className="font-black text-indigo-600">
              Issues
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {stageRows.map((stage) => (
            <div key={stage.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-black text-slate-800">
                    {stage.stageOrder}. {stage.stageName}
                  </div>
                  <div className="text-xs uppercase tracking-[.2em] text-slate-400">
                    {stage.status.replace(/_/g, " ")}
                  </div>
                </div>
                <div className="flex gap-4 text-sm font-bold">
                  <span className="text-emerald-700">{stage.stageGood} good</span>
                  <span className="text-rose-600">{stage.stageDefects} defect</span>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider">
                      <th className="py-2 pr-4">Shift Date</th>
                      <th className="py-2 pr-4">Supervisor</th>
                      <th className="py-2 pr-4">Good</th>
                      <th className="py-2 pr-4">Defect</th>
                      <th className="py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stage.outputs.map((output) => (
                      <tr key={output.id}>
                        <td className="py-2 pr-4">{new Date(output.shiftDate).toLocaleDateString()}</td>
                        <td className="py-2 pr-4">{output.supervisor?.username || "—"}</td>
                        <td className="py-2 pr-4 text-emerald-700 font-bold">{output.goodQuantity}</td>
                        <td className="py-2 pr-4 text-rose-600 font-bold">{output.defectiveQuantity}</td>
                        <td className="py-2">{output.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
