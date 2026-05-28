"use client";

import { useState, type FormEvent } from "react";

export function OutputRecordForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: {
    shiftDate: string;
    goodQuantity: number;
    defectiveQuantity: number;
    notes: string;
  }) => void;
  productionOrderId?: string;
}) {
  const [form, setForm] = useState({
    shiftDate: "",
    goodQuantity: "0",
    defectiveQuantity: "0",
    notes: "",
    productionOrderId: undefined as string | undefined,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      shiftDate: form.shiftDate,
      goodQuantity: Number(form.goodQuantity),
      defectiveQuantity: Number(form.defectiveQuantity),
      notes: form.notes,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-4xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Record Output</h2>
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
            Shift Date
          </span>
          <input
            type="date"
            value={form.shiftDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, shiftDate: e.target.value }))
            }
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-black text-slate-900">
            <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
              Good Quantity
            </span>
            <input
              type="number"
              min="0"
              value={form.goodQuantity}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, goodQuantity: e.target.value }))
              }
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
          <label className="block text-sm font-black text-slate-900">
            <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
              Defective Quantity
            </span>
            <input
              type="number"
              min="0"
              value={form.defectiveQuantity}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  defectiveQuantity: e.target.value,
                }))
              }
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
        </div>

        <label className="block text-sm font-black text-slate-900 mt-4">
          <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
            Notes
          </span>
          <textarea
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            className="mt-2 h-28 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700"
          >
            Submit Output
          </button>
        </div>
      </form>
    </div>
  );
}
