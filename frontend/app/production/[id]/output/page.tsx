"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

type OutputRecord = {
  id: string;
  shiftDate: string;
  goodQuantity: number;
  defectiveQuantity: number;
  notes?: string | null;
  supervisor?: { username?: string };
  stage?: { stageName?: string };
};

export default function OrderOutputPage() {
  const params = useParams();
  const id = params.id as string;
  const [output, setOutput] = useState<OutputRecord[]>([]);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      const [orderRes, outputRes] = await Promise.all([
        api.get(`/production/${id}`),
        api.get(`/production/${id}/output`),
      ]);
      if (alive) {
        setOrder(orderRes.data);
        setOutput(outputRes.data);
      }
    };

    void fetchData();
    const timer = window.setInterval(() => void fetchData(), 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [id]);

  const totals = useMemo(() => {
    const defective = output.reduce(
      (sum, item) => sum + item.defectiveQuantity,
      0,
    );
    const good = output.reduce((sum, item) => sum + item.goodQuantity, 0);
    return { good, defective, finalGood: Math.max(0, good - defective) };
  }, [output]);

  return (
    <div className="space-y-8">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[.3em] text-slate-400">
          Output
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">
          {order?.orderNumber || `Order ${id}`}
        </h1>
        <p className="mt-2 text-slate-500">
          {order?.productName} | Supervisor{" "}
          {order?.assignedSupervisor?.username || "Not assigned"}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="Recorded Good" value={totals.good} />
          <Metric label="Defects" value={totals.defective} />
          <Metric label="Net Good" value={totals.finalGood} />
        </div>
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[.2em] text-slate-500">
              <th className="py-4 pr-6">Shift Date</th>
              <th className="py-4 pr-6">Stage</th>
              <th className="py-4 pr-6">Supervisor</th>
              <th className="py-4 pr-6">Good</th>
              <th className="py-4 pr-6">Defect</th>
              <th className="py-4 pl-6">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {output.map((entry) => (
              <tr key={entry.id}>
                <td className="py-5 pr-6">
                  {new Date(entry.shiftDate).toLocaleDateString()}
                </td>
                <td className="py-5 pr-6">{entry.stage?.stageName || "—"}</td>
                <td className="py-5 pr-6">
                  {entry.supervisor?.username || "—"}
                </td>
                <td className="py-5 pr-6 font-bold text-emerald-700">
                  {entry.goodQuantity}
                </td>
                <td className="py-5 pr-6 font-bold text-rose-600">
                  {entry.defectiveQuantity}
                </td>
                <td className="py-5 pl-6">{entry.notes || "—"}</td>
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
