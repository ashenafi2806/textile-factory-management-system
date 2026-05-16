"use client";

import { useMemo } from "react";

export default function OrderOutputPage({
  params,
}: {
  params: { id: string };
}) {
  const output = useMemo(
    () => [
      { shift: "Morning", good: 120, defective: 8, notes: "Stable output" },
      { shift: "Afternoon", good: 102, defective: 6, notes: "Minor jams" },
      {
        shift: "Evening",
        good: 98,
        defective: 4,
        notes: "Line running smoothly",
      },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">
          Order {params.id} Output History
        </h1>
        <p className="mt-2 text-slate-500">
          View recorded output submissions for this production order.
        </p>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-[.2em] text-[10px]">
              <th className="py-4 pr-6">Shift</th>
              <th className="py-4 pr-6">Good Quantity</th>
              <th className="py-4 pr-6">Defective Quantity</th>
              <th className="py-4 pl-6">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {output.map((entry) => (
              <tr key={entry.shift}>
                <td className="py-5 pr-6 font-bold">{entry.shift}</td>
                <td className="py-5 pr-6">{entry.good}</td>
                <td className="py-5 pr-6">{entry.defective}</td>
                <td className="py-5 pl-6">{entry.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
