"use client";

import { OrderStatusBadge } from "./OrderStatusBadge";

export function ProductionOrderCard({
  order,
  onStart,
  onStop,
  onResume,
  onRecordOutput,
  onReportIssue,
}: {
  order: {
    id: string;
    product: string;
    stage: string;
    progress: number;
    status: string;
  };
  onStart: () => void;
  onStop: () => void;
  onResume: () => void;
  onRecordOutput: () => void;
  onReportIssue: () => void;
}) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">{order.id}</p>
          <p className="text-xl font-black text-slate-900">{order.product}</p>
          <p className="text-sm text-slate-500">Current stage: {order.stage}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[.24em] text-slate-500">
          <span>Progress</span>
          <span>{order.progress}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600"
            style={{ width: `${order.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={onStart}
          className="rounded-3xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
        >
          Start
        </button>
        <button
          onClick={onStop}
          className="rounded-3xl bg-yellow-100 px-4 py-2 text-xs font-black text-amber-700 hover:bg-amber-200"
        >
          Stop
        </button>
        <button
          onClick={onResume}
          className="rounded-3xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
        >
          Resume
        </button>
        <button
          onClick={onRecordOutput}
          className="rounded-3xl bg-indigo-100 px-4 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-200"
        >
          Record Output
        </button>
        <button
          onClick={onReportIssue}
          className="rounded-3xl bg-rose-100 px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-200"
        >
          Report Issue
        </button>
      </div>
    </div>
  );
}
