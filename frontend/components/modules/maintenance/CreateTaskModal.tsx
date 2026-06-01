"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  maintenanceApi,
  type MaintenancePriority,
} from "@/lib/api/maintenance";
import { Button, Dialog, Input, Select, Textarea } from "./ui";

const schema = z.object({
  type: z.enum(["PREVENTIVE", "CORRECTIVE"]),
  priority: z.enum(["NORMAL", "CRITICAL"]).default("NORMAL"),
  equipmentName: z
    .string()
    .min(2, "Equipment name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  scheduledDate: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

type TechnicianOption = {
  id: string;
  username: string;
  position: string;
  email?: string;
};

function normalizeTechnician(worker: any): TechnicianOption | null {
  const profile = worker?.workerProfile ?? worker;
  const user = profile?.user ?? worker?.user;
  const username = user?.username ?? worker?.username;
  const position = profile?.position ?? worker?.position ?? "Technician";

  if (!worker?.id || !username) return null;

  return { id: worker.id, username, position, email: user?.email };
}

async function fetchTechnicians() {
  const endpoints = ["/maintenance/technicians", "/hr/workers"];

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      const payload = Array.isArray(response.data)
        ? response.data
        : (response.data?.data ?? []);
      return payload
        .map(normalizeTechnician)
        .filter(Boolean) as TechnicianOption[];
    } catch {
      continue;
    }
  }

  return [];
}

function minutesToLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const techniciansQuery = useQuery({
    queryKey: ["maintenance-technicians"],
    queryFn: fetchTechnicians,
    enabled: isOpen,
  });

  const technicians = useMemo(() => {
    const items = techniciansQuery.data ?? [];
    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter((item) =>
      `${item.username} ${item.position} ${item.email ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [search, techniciansQuery.data]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "PREVENTIVE",
      priority: "NORMAL",
      equipmentName: "",
      description: "",
      scheduledDate: "",
      assignedToId: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset({
        type: "PREVENTIVE",
        priority: "NORMAL",
        equipmentName: "",
        description: "",
        scheduledDate: "",
        assignedToId: "",
      });
      setSearch("");
    }
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (payload: FormValues) =>
      maintenanceApi.createTask({
        type: payload.type,
        priority: payload.priority as MaintenancePriority,
        equipmentName: payload.equipmentName,
        description: payload.description,
        scheduledDate: payload.scheduledDate || undefined,
        assignedToId: payload.assignedToId || undefined,
      }),
    onSuccess: async () => {
      toast.success("Task scheduled successfully");
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
          "Failed to schedule task",
      );
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));
  const selectedType = watch("type");
  const selectedPriority = watch("priority");

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Maintenance Task"
      description="Create a new preventive or corrective work order."
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Type
            </label>
            <Select {...register("type")}>
              <option value="PREVENTIVE">PREVENTIVE</option>
              <option value="CORRECTIVE">CORRECTIVE</option>
            </Select>
            {errors.type ? (
              <p className="mt-1 text-xs font-medium text-rose-600">
                {errors.type.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Priority
            </label>
            <Select {...register("priority")}>
              <option value="NORMAL">NORMAL</option>
              <option value="CRITICAL">CRITICAL</option>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Equipment Name
            </label>
            <Input
              {...register("equipmentName")}
              placeholder="e.g. Sewing Machine #4"
            />
            {errors.equipmentName ? (
              <p className="mt-1 text-xs font-medium text-rose-600">
                {errors.equipmentName.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Scheduled Date
            </label>
            <Input type="date" {...register("scheduledDate")} />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Description
          </label>
          <Textarea
            {...register("description")}
            placeholder="What needs to be done"
          />
          {errors.description ? (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {errors.description.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Search Technicians
          </label>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by username or position"
          />
          <p className="mt-1 text-xs font-medium text-slate-500">
            Leave empty to assign later
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Assign To
          </label>
          <Select {...register("assignedToId")}>
            <option value="">Assign later</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.username} — {technician.position}
              </option>
            ))}
          </Select>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600">
          Current form: {selectedType} task · {selectedPriority} priority
          {watch("scheduledDate")
            ? ` · Scheduled ${watch("scheduledDate")}`
            : ""}
        </div>

        {mutation.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {(mutation.error as any)?.response?.data?.message ||
              (mutation.error as any)?.message ||
              "Failed to schedule task"}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            Schedule Task
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
