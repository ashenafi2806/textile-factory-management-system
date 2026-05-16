"use client";

import { useMemo } from "react";
import { StageProgressStepper } from "@/components/production/StageProgressStepper";

export default function OrderStagesPage({
  params,
}: {
  params: { id: string };
}) {
  const stages = useMemo(
    () => [
      { name: "CUTTING", status: "COMPLETED" },
      { name: "SEWING", status: "IN_PROGRESS" },
      { name: "FINISHING", status: "PENDING" },
      { name: "PACKING", status: "PENDING" },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">
          Order {params.id} - Stage Management
        </h1>
        <p className="mt-2 text-slate-500">
          Review and manage the stage progress for this production order.
        </p>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <StageProgressStepper currentStage="SEWING" />
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 mb-6">
          Stage details
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {stages.map((stage) => (
            <div
              key={stage.name}
              className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-slate-900">{stage.name}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[.24em] ${stage.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : stage.status === "IN_PROGRESS" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"}`}
                >
                  {stage.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
