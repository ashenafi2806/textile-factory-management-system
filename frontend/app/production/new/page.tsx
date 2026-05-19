"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import api from "@/lib/api";

export default function ProductionNewPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    productName: "",
    productCode: "",
    targetQuantity: "",
    deadline: "",
    assignedSupervisorId: "",
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!form.productName || !form.productCode || !form.targetQuantity || !form.deadline) {
      setError("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/production", {
        productName: form.productName,
        productCode: form.productCode,
        targetQuantity: Number(form.targetQuantity),
        deadline: form.deadline,
        assignedSupervisorId: form.assignedSupervisorId || undefined,
      });
      router.push("/production");
    } catch (err: unknown) {
      console.error("Error creating production order:", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Could not create production order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-black text-slate-900">New Production Order</h1>
                <p className="mt-2 text-slate-500">Fill in order details to create a new production run.</p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/production")}
                className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
              >
                Back to Production
              </button>
            </div>
          </div>

          {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">Product Name *</span>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                />
              </label>
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">Product Code *</span>
                <input
                  type="text"
                  value={form.productCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, productCode: e.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                />
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">Target Quantity *</span>
                <input
                  type="number"
                  min="1"
                  value={form.targetQuantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, targetQuantity: e.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                />
              </label>
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">Deadline *</span>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                />
              </label>
            </div>

            <label className="block text-sm font-black text-slate-900">
              <span className="block text-xs uppercase tracking-[.24em] text-slate-500">Assign Supervisor ID (Optional)</span>
              <input
                type="text"
                value={form.assignedSupervisorId}
                onChange={(e) => setForm((prev) => ({ ...prev, assignedSupervisorId: e.target.value }))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/production")}
                className="rounded-3xl border border-slate-200 px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-3xl bg-indigo-600 px-6 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Order"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
