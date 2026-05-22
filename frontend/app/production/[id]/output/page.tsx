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

  useEffect(() => {
    let alive = true;

    const fetchOutput = async () => {
      const res = await api.get(`/production/${id}/output`);
      if (alive) setOutput(res.data);
    };

    void fetchOutput();
    const timer = window.setInterval(() => void fetchOutput(), 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [id]);

  const totals = useMemo(() => {
    const defective = output.reduce((sum, item) => sum + item.defectiveQuantity, 0);
    const good = output.reduce((sum, item) => sum + item.goodQuantity, 0);
    return { good, defective, finalGood: Math.max(0, good - defective) };
  }, [output]);

  return (
    <div className="space-y-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">
          Order {id} Output History
        </h1>
        <p className="mt-2 text-slate-500">
          Live output submissions with stage defects deducted from the final good count.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Metric label="Recorded Good" value={totals.good} />
          <Metric label="Defects" value={totals.defective} />
          <Metric label="Net Good" value={totals.finalGood} />
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-[.2em] text-[10px]">
              <th className="py-4 pr-6">Shift Date</th>
              <th className="py-4 pr-6">Stage</th>
              <th className="py-4 pr-6">Supervisor</th>
              <th className="py-4 pr-6">Good Quantity</th>
              <th className="py-4 pr-6">Defective Quantity</th>
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
                <td className="py-5 pr-6">{entry.supervisor?.username || "—"}</td>
                <td className="py-5 pr-6 text-emerald-700 font-bold">
                  {entry.goodQuantity}
                </td>
                <td className="py-5 pr-6 text-rose-600 font-bold">
                  {entry.defectiveQuantity}
                </td>
                <td className="py-5 pl-6">{entry.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
