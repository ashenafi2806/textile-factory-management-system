"use client";

import { useState, type FormEvent } from "react";

export default function NewProductionOrderPage() {
  const [form, setForm] = useState({
    productName: "",
    productCode: "",
    targetQuantity: "",
    deadline: "",
    supervisor: "",
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">
          Create Production Order
        </h1>
        <p className="mt-2 text-slate-500">
          Capture the order details and assign it to a supervisor.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm space-y-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm font-black text-slate-900">
            <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
              Product Name
            </span>
            <input
              type="text"
              value={form.productName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, productName: e.target.value }))
              }
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
          <label className="block text-sm font-black text-slate-900">
            <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
              Product Code
            </span>
            <input
              type="text"
              value={form.productCode}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, productCode: e.target.value }))
              }
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm font-black text-slate-900">
            <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
              Target Quantity
            </span>
            <input
              type="number"
              min="0"
              value={form.targetQuantity}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, targetQuantity: e.target.value }))
              }
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
          <label className="block text-sm font-black text-slate-900">
            <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
              Deadline
            </span>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, deadline: e.target.value }))
              }
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
        </div>
        <label className="block text-sm font-black text-slate-900">
          <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
            Assign Supervisor
          </span>
          <input
            type="text"
            value={form.supervisor}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, supervisor: e.target.value }))
            }
            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-3xl bg-indigo-600 px-6 py-3 text-sm font-black text-white hover:bg-indigo-700"
          >
            Create Order
          </button>
        </div>
      </form>
    </div>
  );
}
