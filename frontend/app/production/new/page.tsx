"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import api from "@/lib/api";

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
};

type BomItemInput = {
  materialId: string;
  requiredQuantity: number;
  unit: string;
};

export default function ProductionNewPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [form, setForm] = useState({
    productName: "",
    productCode: "",
    targetQuantity: "",
    deadline: "",
    assignedSupervisorId: "",
  });

  const [bomItems, setBomItems] = useState<BomItemInput[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get("/inventory");
        setInventory(res.data);
      } catch (err) {
        console.error("Failed to fetch inventory", err);
      }
    };
    fetchInventory();
  }, []);

  const handleAddBomItem = () => {
    if (inventory.length === 0) return;
    setBomItems([
      ...bomItems,
      {
        materialId: inventory[0].id,
        requiredQuantity: 1,
        unit: inventory[0].unit,
      },
    ]);
  };

  const handleRemoveBomItem = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const handleBomChange = (
    index: number,
    field: keyof BomItemInput,
    value: string | number,
  ) => {
    const updated = [...bomItems];
    if (field === "materialId") {
      const selectedItem = inventory.find((item) => item.id === value);
      updated[index] = {
        ...updated[index],
        materialId: value as string,
        unit: selectedItem ? selectedItem.unit : updated[index].unit,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setBomItems(updated);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (
      !form.productName ||
      !form.productCode ||
      !form.targetQuantity ||
      !form.deadline
    ) {
      setError("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/api/production", {
        productName: form.productName,
        productCode: form.productCode,
        targetQuantity: Number(form.targetQuantity),
        deadline: form.deadline,
        assignedSupervisorId: form.assignedSupervisorId || undefined,
        bomItems: bomItems.length > 0 ? bomItems : undefined,
      });
      router.push("/production");
    } catch (err: unknown) {
      console.error("Error creating production order:", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message ||
          "Could not create production order.",
      );
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
                <h1 className="text-3xl font-black text-slate-900">
                  New Production Order
                </h1>
                <p className="mt-2 text-slate-500">
                  Fill in order details to create a new production run.
                </p>
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

          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm space-y-6"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
                  Product Name *
                </span>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      productName: e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  required
                />
              </label>
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
                  Product Code *
                </span>
                <input
                  type="text"
                  value={form.productCode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      productCode: e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  required
                />
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
                  Target Quantity *
                </span>
                <input
                  type="number"
                  min="1"
                  value={form.targetQuantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      targetQuantity: e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  required
                />
              </label>
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
                  Deadline *
                </span>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, deadline: e.target.value }))
                  }
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  required
                />
              </label>
            </div>

            <label className="block text-sm font-black text-slate-900">
              <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
                Assign Supervisor ID (Optional)
              </span>
              <input
                type="text"
                value={form.assignedSupervisorId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    assignedSupervisorId: e.target.value,
                  }))
                }
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              />
            </label>

            {/* Bill of Materials Section */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-900">
                  Bill of Materials (BOM)
                </h3>
                <button
                  type="button"
                  onClick={handleAddBomItem}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  + Add Material
                </button>
              </div>

              {bomItems.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  No materials added. Click "Add Material" to specify BOM.
                </p>
              ) : (
                <div className="space-y-4">
                  {bomItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-4 rounded-3xl border border-slate-200"
                    >
                      <label className="flex-1 w-full text-sm font-black text-slate-900">
                        <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                          Material
                        </span>
                        <select
                          value={item.materialId}
                          onChange={(e) =>
                            handleBomChange(index, "materialId", e.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white"
                        >
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} (Stock: {inv.quantity} {inv.unit})
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="w-full md:w-32 text-sm font-black text-slate-900">
                        <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                          Quantity
                        </span>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={item.requiredQuantity}
                          onChange={(e) =>
                            handleBomChange(
                              index,
                              "requiredQuantity",
                              Number(e.target.value),
                            )
                          }
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white"
                        />
                      </label>

                      <label className="w-full md:w-24 text-sm font-black text-slate-900">
                        <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                          Unit
                        </span>
                        <input
                          type="text"
                          value={item.unit}
                          readOnly
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-500 bg-slate-100 placeholder-slate-400"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveBomItem(index)}
                        className="rounded-2xl bg-rose-100 text-rose-700 px-4 py-2 text-xs font-black hover:bg-rose-200 h-[38px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-6 border-t border-slate-100">
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
