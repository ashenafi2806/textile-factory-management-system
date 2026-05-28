"use client";

import { useState, type FormEvent } from "react";

export function IssueReportForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: {
    issueType: string;
    description: string;
    priority: string;
  }) => void;
  productionOrderId?: string;
}) {
  const [form, setForm] = useState({
    issueType: "MATERIAL_SHORTAGE",
    description: "",
    priority: "NORMAL",
    productionOrderId: undefined as string | undefined,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-4xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Report Issue</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <label className="block text-sm font-black text-slate-900 mb-4">
          <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
            Issue Type
          </span>
          <select
            value={form.issueType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, issueType: e.target.value }))
            }
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          >
            <option value="MATERIAL_SHORTAGE">Material Shortage</option>
            <option value="MACHINE_FAILURE">Machine Failure</option>
            <option value="QUALITY_DEVIATION">Quality Deviation</option>
          </select>
        </label>

        <label className="block text-sm font-black text-slate-900 mb-4">
          <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
            Description
          </span>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            className="mt-2 h-28 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          />
        </label>

        <label className="block text-sm font-black text-slate-900 mb-4">
          <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
            Priority
          </span>
          <select
            value={form.priority}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, priority: e.target.value }))
            }
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          >
            <option value="NORMAL">Normal</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-3xl bg-rose-600 px-5 py-3 text-sm font-black text-white hover:bg-rose-700"
          >
            Submit Issue
          </button>
        </div>
      </form>
    </div>
  );
}
