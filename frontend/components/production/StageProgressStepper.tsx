"use client";

import { type ReactNode } from "react";

const stepNames = ["CUTTING", "SEWING", "FINISHING", "PACKING"];

export function StageProgressStepper({
  currentStage,
}: {
  currentStage: string;
}) {
  return (
    <div className="space-y-4 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
          Stage Progress
        </p>
        <span className="text-sm font-semibold text-slate-700">
          Current: {currentStage}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {stepNames.map((stage, index) => {
          const completed = stepNames.indexOf(currentStage) > index;
          const active = currentStage === stage;
          return (
            <div key={stage} className="flex-1">
              <div
                className={`flex items-center gap-3 ${index !== 0 ? "border-l border-slate-200 pl-4" : ""}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border ${active ? "bg-indigo-600 border-indigo-600 text-white" : completed ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-500"}`}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{stage}</p>
                  <p className="text-xs text-slate-500">
                    {active ? "Active" : completed ? "Done" : "Pending"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
