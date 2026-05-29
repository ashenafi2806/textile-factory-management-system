"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  inventoryApi,
  type InventoryItem,
  type InventoryCategory,
} from "@/lib/api/inventory";
import { Button, Dialog, Input, Select, Textarea } from "./ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const categoryValues = [
  "RAW_MATERIAL",
  "SPARE_PART",
  "ACCESSORY",
  "FINISHED_GOOD",
] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  sku: z.string().min(1, "SKU is required"),
  category: z.enum(categoryValues),
  unit: z.string().min(1, "Unit is required"),
  minThreshold: z.coerce
    .number()
    .positive("Minimum threshold must be greater than 0"),
  supplier: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string | undefined;
  onSuccess: () => void;
};

export function EditItemModal({ isOpen, onClose, itemId, onSuccess }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["inventory-item", itemId],
    queryFn: () =>
      itemId ? inventoryApi.getItem(itemId) : Promise.resolve(undefined as any),
    enabled: Boolean(itemId) && isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sku: "",
      category: "RAW_MATERIAL",
      unit: "",
      minThreshold: 10,
      supplier: "",
      location: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (data) {
      const item = data as InventoryItem;
      reset({
        name: item.name,
        sku: item.sku,
        category: item.category as any,
        unit: item.unit,
        minThreshold: item.minThreshold,
        supplier: item.supplier ?? "",
        location: item.location ?? "",
      });
    }
  }, [isOpen, data, reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: FormOutput) => {
      if (!itemId) return Promise.reject(new Error("Missing item id"));
      return inventoryApi.updateItem(itemId, payload);
    },
    onSuccess: async () => {
      toast.success("Inventory item updated");
      await queryClient.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("inventory"),
      });
      onSuccess();
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update item",
      );
    },
  });

  const submit = handleSubmit((values: FormOutput) =>
    updateMutation.mutate(values),
  );

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Inventory Item"
      description="Update item metadata and location."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Name
            </label>
            <Input {...register("name")} placeholder="Cotton Yarn 20s" />
            {errors.name ? (
              <p className="mt-1 text-xs font-medium text-rose-600">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              SKU
            </label>
            <Input {...register("sku")} placeholder="RAW-COT-20S-001" />
            {errors.sku ? (
              <p className="mt-1 text-xs font-medium text-rose-600">
                {errors.sku.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Category
            </label>
            <Select {...register("category")}>
              {categoryValues.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Unit
            </label>
            <Input {...register("unit")} placeholder="kg, meters, pcs" />
            {errors.unit ? (
              <p className="mt-1 text-xs font-medium text-rose-600">
                {errors.unit.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Minimum Threshold
            </label>
            <Input type="number" step="0.01" {...register("minThreshold")} />
            {errors.minThreshold ? (
              <p className="mt-1 text-xs font-medium text-rose-600">
                {errors.minThreshold.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Supplier
            </label>
            <Input {...register("supplier")} placeholder="Optional supplier" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Location
          </label>
          <Textarea
            {...register("location")}
            placeholder="Warehouse A / Bin 12"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={(updateMutation as any).isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
