"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { maintenanceApi, type MaintenanceTask } from "@/lib/api/maintenance";
import { inventoryApi, type InventoryItem } from "@/lib/api/inventory";
import { Badge, Button, Dialog, Input, Select, Textarea } from "./ui";

const schema = z.object({
  timeSpentMins: z.coerce
    .number()
    .int("Time spent must be a whole number")
    .positive("Time spent must be greater than 0"),
  spareParts: z
    .array(
      z.object({
        itemId: z.string().min(1, "Select an item"),
        quantityUsed: z.coerce
          .number()
          .int("Quantity must be a whole number")
          .positive("Quantity must be greater than 0"),
      }),
    )
    .optional()
    .default([]),
  notes: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

async function fetchSpareParts() {
  const response = await inventoryApi.getItems({
    category: "SPARE_PART",
    page: 1,
    limit: 200,
  });
  return response.data;
}

function minutesToLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

export function CompleteTaskModal({
  isOpen,
  onClose,
  onSuccess,
  task,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: MaintenanceTask | null;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const sparePartsQuery = useQuery({
    queryKey: ["inventory-spare-parts"],
    queryFn: fetchSpareParts,
    enabled: isOpen,
  });

  const spareParts = useMemo(() => {
    const items = sparePartsQuery.data ?? [];
    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter((item) =>
      `${item.sku} ${item.name} ${item.unit}`.toLowerCase().includes(term),
    );
  }, [search, sparePartsQuery.data]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      timeSpentMins: 30,
      spareParts: [],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "spareParts",
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ timeSpentMins: 30, spareParts: [], notes: "" });
      setSearch("");
    }
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (payload: FormValues) =>
      maintenanceApi.completeTask(task?.id ?? "", {
        timeSpentMins: payload.timeSpentMins,
        spareParts: payload.spareParts?.length ? payload.spareParts : undefined,
        notes: payload.notes || undefined,
      }),
    onSuccess: async () => {
      toast.success("Task completed. Spare parts deducted from inventory.");
      await queryClient.invalidateQueries({
        predicate: (query) =>
          String(query.queryKey[0]).startsWith("maintenance"),
      });
      await queryClient.invalidateQueries({
        predicate: (query) => String(query.queryKey[0]).startsWith("inventory"),
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to complete task",
      );
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));

  if (!task) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Maintenance Task"
      description="Record the work performed and any parts consumed."
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xl font-black tracking-tight text-slate-900">
            {task.equipmentName}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={task.type === "PREVENTIVE" ? "blue" : "amber"}>
              {task.type}
            </Badge>
            <Badge variant={task.priority === "CRITICAL" ? "red" : "slate"}>
              {task.priority}
            </Badge>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Time Spent (minutes)
          </label>
          <Input
            type="number"
            min={1}
            step={1}
            {...register("timeSpentMins")}
            placeholder="90"
          />
          <p className="mt-1 text-xs font-medium text-slate-500">
            {minutesToLabel(Math.max(0, Number(watch("timeSpentMins") || 0)))}
          </p>
          {errors.timeSpentMins ? (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {errors.timeSpentMins.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Spare Parts Used
              </label>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Use the search to quickly filter spare parts from inventory.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ itemId: "", quantityUsed: 1 })}
            >
              Add spare part
            </Button>
          </div>

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search [SKU], name, or unit"
          />

          {fields.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
              No spare parts used
            </div>
          ) : null}

          <div className="space-y-4">
            {fields.map((field, index) => {
              const selectedItemId = watch(`spareParts.${index}.itemId`);
              const selectedQuantity = Number(
                watch(`spareParts.${index}.quantityUsed`) || 0,
              );
              const selectedItem = sparePartsQuery.data?.find(
                (item) => item.id === selectedItemId,
              );
              const overStock = Boolean(
                selectedItem && selectedQuantity > selectedItem.quantity,
              );

              return (
                <div
                  key={field.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4"
                >
                  <div className="grid gap-4 md:grid-cols-[1.3fr_0.6fr_auto]">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Item
                      </label>
                      <Select
                        {...register(`spareParts.${index}.itemId` as const)}
                      >
                        <option value="">Select spare part</option>
                        {spareParts.map((item) => (
                          <option key={item.id} value={item.id}>
                            [{item.sku}] {item.name} — {item.quantity}{" "}
                            {item.unit} available
                          </option>
                        ))}
                      </Select>
                      {errors.spareParts?.[index]?.itemId ? (
                        <p className="mt-1 text-xs font-medium text-rose-600">
                          {errors.spareParts[index]?.itemId?.message}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Quantity Used
                      </label>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        {...register(
                          `spareParts.${index}.quantityUsed` as const,
                        )}
                        placeholder="1"
                      />
                      {errors.spareParts?.[index]?.quantityUsed ? (
                        <p className="mt-1 text-xs font-medium text-rose-600">
                          {errors.spareParts[index]?.quantityUsed?.message}
                        </p>
                      ) : null}
                      {overStock && selectedItem ? (
                        <p className="mt-1 text-xs font-semibold text-rose-600">
                          Only {selectedItem.quantity} available
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  {selectedItem ? (
                    <div className="mt-3 text-xs font-medium text-slate-500">
                      {selectedItem.name} uses {selectedItem.unit}. Current
                      stock: {selectedItem.quantity}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Notes
          </label>
          <Textarea {...register("notes")} placeholder="Maintenance notes" />
        </div>

        {mutation.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {(mutation.error as any)?.response?.data?.message ||
              (mutation.error as any)?.message ||
              "Failed to complete task"}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            Complete Task
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
