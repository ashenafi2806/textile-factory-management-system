"use client";

import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Package, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { inventoryApi, type InventoryItem } from "@/lib/api/inventory";
import { useCanPerform } from "@/hooks/useCanPerform";
import toast from "react-hot-toast";

type BomItemInput = {
  materialId: string;
  requiredQuantity: number;
  unit: string;
};

type SupervisorUser = {
  id: string;
  username: string;
  email: string;
};

export default function ProductionNewPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = useCanPerform(["PRODUCTION_MANAGER", "ADMIN"]);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [supervisors, setSupervisors] = useState<SupervisorUser[]>([]);

  const [form, setForm] = useState({
    productName: "",
    productCode: "",
    targetQuantity: "",
    deadline: "",
    assignedSupervisorId: "",
  });

  const [bomItems, setBomItems] = useState<BomItemInput[]>([]);

  useEffect(() => {
    const load = async () => {
      setInventoryLoading(true);
      setInventoryError(null);
      try {
        const [itemsRes, usersRes] = await Promise.all([
          inventoryApi.getItems({ limit: 200, page: 1 }),
          api.get("/users").catch(() => ({ data: [] })),
        ]);
        setInventory(itemsRes.data ?? []);
        const users = (usersRes.data as Array<{
          id: string;
          username: string;
          email: string;
          roles: { name: string }[];
        }>) ?? [];
        setSupervisors(
          users
            .filter((u) =>
              u.roles?.some((r) => r.name === "PRODUCTION_SUPERVISOR"),
            )
            .map((u) => ({
              id: u.id,
              username: u.username,
              email: u.email,
            })),
        );
      } catch (err) {
        console.error("Failed to load inventory", err);
        setInventoryError(
          "Could not load inventory materials. BOM lines may be unavailable.",
        );
        setInventory([]);
      } finally {
        setInventoryLoading(false);
      }
    };
    load();
  }, []);

  const usedMaterialIds = useMemo(
    () => new Set(bomItems.map((b) => b.materialId)),
    [bomItems],
  );

  const availableMaterials = useMemo(
    () => inventory.filter((item) => !usedMaterialIds.has(item.id)),
    [inventory, usedMaterialIds],
  );

  const handleAddBomItem = () => {
    if (inventory.length === 0) {
      toast.error(
        inventoryError
          ? "Inventory could not be loaded."
          : "No inventory materials available. Add items in Inventory first.",
      );
      return;
    }

    const pick =
      availableMaterials[0] ??
      inventory.find((item) => item.id) ??
      inventory[0];

    if (!pick) return;

    setBomItems((prev) => [
      ...prev,
      {
        materialId: pick.id,
        requiredQuantity: 1,
        unit: pick.unit,
      },
    ]);
  };

  const handleRemoveBomItem = (index: number) => {
    setBomItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBomChange = (
    index: number,
    field: keyof BomItemInput,
    value: string | number,
  ) => {
    setBomItems((prev) => {
      const updated = [...prev];
      if (field === "materialId") {
        const selectedItem = inventory.find((item) => item.id === value);
        updated[index] = {
          ...updated[index],
          materialId: value as string,
          unit: selectedItem?.unit ?? updated[index].unit,
        };
      } else if (field === "requiredQuantity") {
        updated[index] = {
          ...updated[index],
          requiredQuantity: Number(value) || 0,
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (
      !form.productName.trim() ||
      !form.productCode.trim() ||
      !form.targetQuantity ||
      !form.deadline
    ) {
      setError("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    const validBom = bomItems.filter(
      (item) => item.materialId && item.requiredQuantity > 0,
    );

    try {
      await api.post("/api/production", {
        productName: form.productName.trim(),
        productCode: form.productCode.trim(),
        targetQuantity: Number(form.targetQuantity),
        deadline: form.deadline,
        assignedSupervisorId: form.assignedSupervisorId || undefined,
        bomItems: validBom.length > 0 ? validBom : undefined,
      });
      toast.success("Production order created");
      router.push("/production");
    } catch (err: unknown) {
      console.error("Error creating production order:", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Could not create production order.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-xl font-bold text-rose-800">Access denied</h1>
        <p className="mt-2 text-sm text-rose-700">
          Only Production Managers and Admins can create production orders.
        </p>
        <Link
          href="/production"
          className="mt-4 inline-block text-sm font-semibold text-rose-800 underline"
        >
          Back to production
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            New Production Order
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define the product, schedule, and bill of materials.
          </p>
        </div>
        <Link
          href="/production"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to list
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Order details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name *">
              <input
                type="text"
                value={form.productName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, productName: e.target.value }))
                }
                className={inputClass}
                required
              />
            </Field>
            <Field label="Product code *">
              <input
                type="text"
                value={form.productCode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, productCode: e.target.value }))
                }
                className={inputClass}
                required
              />
            </Field>
            <Field label="Target quantity *">
              <input
                type="number"
                min={1}
                value={form.targetQuantity}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    targetQuantity: e.target.value,
                  }))
                }
                className={inputClass}
                required
              />
            </Field>
            <Field label="Deadline *">
              <input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, deadline: e.target.value }))
                }
                className={inputClass}
                required
              />
            </Field>
          </div>

          <Field label="Assign supervisor (optional)">
            <select
              value={form.assignedSupervisorId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  assignedSupervisorId: e.target.value,
                }))
              }
              className={inputClass}
            >
              <option value="">No supervisor yet</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.username} ({s.email})
                </option>
              ))}
            </select>
          </Field>
        </section>

        <section className="border-t border-slate-100 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Package className="h-5 w-5 text-indigo-600" />
                Bill of materials
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add raw materials required for this production run.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddBomItem}
              disabled={inventoryLoading || inventory.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inventoryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add material
            </button>
          </div>

          {inventoryLoading ? (
            <p className="mt-4 text-sm text-slate-500">Loading materials…</p>
          ) : inventoryError ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {inventoryError}
            </p>
          ) : inventory.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No inventory items found. Create materials in Inventory before
              adding a BOM.
            </p>
          ) : bomItems.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No materials added yet. Click &quot;Add material&quot; to build
              the BOM.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {bomItems.map((item, index) => {
                const stock = inventory.find((i) => i.id === item.materialId);
                return (
                  <li
                    key={`${item.materialId}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-12 sm:items-end">
                      <div className="sm:col-span-6">
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Material
                        </label>
                        <select
                          value={item.materialId}
                          onChange={(e) =>
                            handleBomChange(
                              index,
                              "materialId",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        >
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} — {inv.quantity} {inv.unit} in stock
                            </option>
                          ))}
                        </select>
                        {stock && item.requiredQuantity > stock.quantity ? (
                          <p className="mt-1 text-xs text-amber-700">
                            Requested qty exceeds current stock (
                            {stock.quantity} {stock.unit})
                          </p>
                        ) : null}
                      </div>
                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min={0.01}
                          step="any"
                          value={item.requiredQuantity}
                          onChange={(e) =>
                            handleBomChange(
                              index,
                              "requiredQuantity",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={item.unit}
                          readOnly
                          className={`${inputClass} bg-slate-100 text-slate-500`}
                        />
                      </div>
                      <div className="sm:col-span-1 flex sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveBomItem(index)}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 sm:w-auto"
                          aria-label="Remove material"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sm:hidden">Remove</span>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/production")}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create order"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}
