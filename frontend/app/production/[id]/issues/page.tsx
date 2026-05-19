"use client";

import { useMemo } from "react";

export default function OrderIssuesPage({
  params,
}: {
  params: { id: string };
}) {
  const issues = useMemo(
    () => [
      {
        type: "Material Shortage",
        priority: "High",
        reportedBy: "Amina",
        date: "May 14",
        status: "Open",
      },
      {
        type: "Machine Failure",
        priority: "Critical",
        reportedBy: "Daniel",
        date: "May 13",
        status: "Open",
      },
      {
        type: "Quality Deviation",
        priority: "Normal",
        reportedBy: "Mary",
        date: "May 12",
        status: "Closed",
      },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">
          Order {params.id} Issues
        </h1>
        <p className="mt-2 text-slate-500">
          Review reported issues and their current status for this order.
        </p>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-[.2em] text-[10px]">
              <th className="py-4 pr-6">Type</th>
              <th className="py-4 pr-6">Priority</th>
              <th className="py-4 pr-6">Reported By</th>
              <th className="py-4 pr-6">Date</th>
              <th className="py-4 pl-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {issues.map((issue) => (
              <tr key={`${issue.type}-${issue.date}`}>
                <td className="py-5 pr-6 font-bold">{issue.type}</td>
                <td className="py-5 pr-6">{issue.priority}</td>
                <td className="py-5 pr-6">{issue.reportedBy}</td>
                <td className="py-5 pr-6">{issue.date}</td>
                <td className="py-5 pl-6">{issue.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
