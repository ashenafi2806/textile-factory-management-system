"use client";

import { useState, type FormEvent } from "react";

type ReviewSummary = {
  orderNumber?: string;
  stageName?: string;
  goodQuantity?: number;
  defectiveQuantity?: number;
  measurements?: string;
  result?: string;
  status?: string;
};

export function QAReviewPanel({
  review,
  onClose,
  onApprove,
  onReject,
}: {
  review: ReviewSummary;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [rejectionReason, setRejectionReason] = useState("");

  function handleApprove() {
    onApprove();
    onClose();
  }

  function handleReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onReject(rejectionReason);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl rounded-4xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">QA Review</h2>
            <p className="text-sm text-slate-500">
              Review the inspection record and decide whether this stage can progress.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">Order</p>
            <p className="text-sm font-black text-slate-900">{review.orderNumber ?? "Unknown order"}</p>
            <p className="mt-1 text-sm text-slate-600">{review.stageName ?? "Unknown stage"}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">Good Qty</p>
              <p className="mt-2 text-2xl font-black text-emerald-600">{review.goodQuantity ?? 0}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">Defective Qty</p>
              <p className="mt-2 text-2xl font-black text-rose-600">{review.defectiveQuantity ?? 0}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">Measurements</p>
            <p className="mt-1 text-sm text-slate-700">{review.measurements || "No measurements recorded"}</p>
            <p className="mt-3 text-xs font-black uppercase tracking-[.24em] text-slate-400">Inspection Result</p>
            <p className="mt-1 text-sm text-slate-700">{review.result || "PENDING"}</p>
            <p className="mt-3 text-xs font-black uppercase tracking-[.24em] text-slate-400">Current Stage Status</p>
            <p className="mt-1 text-sm text-slate-700">{review.status || "PENDING"}</p>
          </div>

          <form onSubmit={handleReject} className="space-y-4">
            <label className="block text-sm font-black text-slate-900">
              <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
                Rejection Reason
              </span>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2 h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                placeholder="Describe the defect or reason for rejection"
              />
            </label>
          </form>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={handleApprove}
              className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
            >
              APPROVE
            </button>
            <button
              onClick={() => onReject(rejectionReason)}
              className="rounded-3xl bg-rose-600 px-5 py-3 text-sm font-black text-white hover:bg-rose-700"
            >
              REJECT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
