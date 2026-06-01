"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  maintenanceApi,
  type MaintenancePriority,
} from "@/lib/api/maintenance";
import { Button, Dialog, Input, Textarea } from "./ui";

const schema = z.object({
  equipmentName: z
    .string()
    .min(2, "Equipment name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["NORMAL", "CRITICAL"]).default("NORMAL"),
  productionOrderId: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function ReportFailureModal({
  isOpen,
  onClose,
  onSuccess,
  productionOrderId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productionOrderId?: string;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      equipmentName: "",
      description: "",
      priority: "NORMAL",
      productionOrderId: productionOrderId ?? "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setValue("productionOrderId", productionOrderId ?? "");
      return;
    }

    reset({
      equipmentName: "",
      description: "",
      priority: "NORMAL",
      productionOrderId: productionOrderId ?? "",
    });
  }, [isOpen, productionOrderId, reset, setValue]);

  const mutation = useMutation({
    mutationFn: (payload: FormValues) =>
      maintenanceApi.reportFailure({
        equipmentName: payload.equipmentName,
        description: payload.description,
        priority: payload.priority as MaintenancePriority,
        productionOrderId: payload.productionOrderId || undefined,
      }),
    onSuccess: async (response) => {
      if ((response as any)?.report?.priority === "CRITICAL") {
        toast.error("Critical failure reported. Maintenance team alerted.");
      } else {
        toast("Failure reported. Maintenance team notified.", { icon: "⚠️" });
      }

      await queryClient.invalidateQueries({
        predicate: (query) =>
          String(query.queryKey[0]).startsWith("maintenance"),
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to report failure",
      );
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));
  const selectedPriority = watch("priority");

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Report Machine Failure"
      description="Create a corrective maintenance task and notify the team immediately."
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          This will immediately notify the Maintenance team and create a
          corrective task.
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Equipment Name
          </label>
          <Input
            {...register("equipmentName")}
            placeholder="e.g. Cutting Machine #2"
          />
          {errors.equipmentName ? (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {errors.equipmentName.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Description
          </label>
          <Textarea
            {...register("description")}
            placeholder="Describe what happened and symptoms observed"
          />
          {errors.description ? (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {errors.description.message}
            </p>
          ) : null}
        </div>

        <div>
          <div className="mb-3 block text-sm font-semibold text-slate-700">
            Priority
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <PriorityCard
              selected={selectedPriority === "NORMAL"}
              title="Normal"
              description="Non-urgent, schedule when available"
              onClick={() => setValue("priority", "NORMAL")}
              borderClass="border-slate-200"
            />
            <PriorityCard
              selected={selectedPriority === "CRITICAL"}
              title="Critical"
              description="Machine down, production blocked"
              onClick={() => setValue("priority", "CRITICAL")}
              borderClass="border-rose-300"
              selectedClass="border-rose-500 bg-rose-50"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Affected Production Order
          </label>
          <Input
            {...register("productionOrderId")}
            placeholder="Optional production order ID"
          />
          <p className="mt-1 text-xs font-medium text-slate-500">
            If filled, the linked production order will be stopped
          </p>
        </div>

        {mutation.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {(mutation.error as any)?.response?.data?.message ||
              (mutation.error as any)?.message ||
              "Failed to report failure"}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            Report Failure
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function PriorityCard({
  selected,
  title,
  description,
  onClick,
  borderClass,
  selectedClass = "border-slate-900 bg-slate-50",
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
  borderClass: string;
  selectedClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left transition ${selected ? selectedClass : borderClass} hover:bg-slate-50`}
    >
      <div className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">
        {title}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-600">{description}</p>
    </button>
  );
}
