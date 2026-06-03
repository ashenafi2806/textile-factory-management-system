"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { maintenanceApi, type MaintenanceTask } from "@/lib/api/maintenance";
import { inventoryApi } from "@/lib/api/inventory";
import { Button, Dialog, Input, Select, Textarea } from "./ui";

export function RequestSparePartsModal({
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
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState("");

  const itemsQuery = useQuery({
    queryKey: ["inventory-items-spare"],
    queryFn: () => inventoryApi.getItems({ page: 1, limit: 200 }),
    enabled: isOpen,
  });

  const items = itemsQuery.data?.data ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      maintenanceApi.requestSpareParts(task?.id ?? "", {
        itemId,
        quantityRequested: Number(quantity),
        purpose: purpose || undefined,
      }),
    onSuccess: async () => {
      toast.success("Request sent to maintenance manager for approval.");
      await queryClient.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("maintenance"),
      });
      onSuccess();
      onClose();
      setItemId("");
      setQuantity(1);
      setPurpose("");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to request materials",
      );
    },
  });

  if (!task) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Request spare parts / materials"
      description="Maintenance manager will approve before inventory issues stock."
    >
      <div className="space-y-4">
        <p className="text-sm font-medium text-slate-600">
          Task: {task.equipmentName}
        </p>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Item
          </label>
          <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">Select item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.quantity} {item.unit} in stock)
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Quantity
          </label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Purpose
          </label>
          <Textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Why this material is needed"
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!itemId || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Submit request
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
