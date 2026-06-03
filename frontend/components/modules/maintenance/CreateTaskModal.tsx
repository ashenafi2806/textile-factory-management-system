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
  priority: z.enum(["NORMAL", "CRITICAL"]).default("NORMAL"),
  equipmentName: z
    .string()
    .min(2, "Equipment name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  assignedToId: z.string().min(1, "Assign a maintenance technician"),
});

type FormValues = z.infer<typeof schema>;

type TechnicianOption = {
  id: string;
  username: string;
  position: string;
  email?: string;
};

async function fetchTechnicians() {
  const endpoints = ["/maintenance/technicians", "/hr/workers"];

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      const payload = Array.isArray(response.data)
        ? response.data
        : (response.data?.data ?? []);
      return payload
        .map((worker: any) => {
          const profile = worker?.workerProfile ?? worker;
          const user = profile?.user ?? worker?.user;
          const username = user?.username ?? worker?.username;
          if (!worker?.id || !username) return null;
          return {
            id: worker.id,
            username,
            position: profile?.position ?? worker?.position ?? "Technician",
            email: user?.email,
          };
        })
        .filter(Boolean) as TechnicianOption[];
    } catch {
      continue;
    }
  }

  return [];
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
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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
      maintenanceApi.schedulePreventiveTask({
        type: "PREVENTIVE",
        priority: payload.priority as MaintenancePriority,
        equipmentName: payload.equipmentName,
        description: payload.description,
        scheduledDate: payload.scheduledDate,
        assignedToId: payload.assignedToId,
      }),
    onSuccess: async () => {
      toast.success(
        "Preventive task scheduled (OPEN). Technician will see it on the scheduled date.",
      );
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

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Preventive Maintenance"
      description="Managers schedule preventive work only. Task stays OPEN until the scheduled date."
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-900">
          Type: <strong>PREVENTIVE</strong> — corrective work comes from
          supervisor failure reports.
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Priority
            </label>
            <Select {...register("priority")}>
              <option value="NORMAL">NORMAL</option>
              <option value="CRITICAL">CRITICAL</option>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Scheduled Date
            </label>
            <Input
              type="date"
              required
              {...register("scheduledDate", {
                required: "Scheduled date is required",
              })}
            />
            {errors.scheduledDate ? (
              <p className="mt-1 text-xs font-medium text-rose-600">
                {errors.scheduledDate.message}
              </p>
            ) : null}
          </div>
        </div>

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
            Description
          </label>
          <Textarea
            {...register("description")}
            placeholder="e.g. Monthly belt check and oil change"
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
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Assign technician
          </label>
          <Select {...register("assignedToId")}>
            <option value="">Select technician</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.username} — {technician.position}
              </option>
            ))}
          </Select>
          {errors.assignedToId ? (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {errors.assignedToId.message}
            </p>
          ) : null}
          <p className="mt-1 text-xs font-medium text-slate-500">
            Task stays OPEN until the scheduled date; the technician sees it in
            My Tasks on that day.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600">
          {watch("scheduledDate")
            ? `Scheduled ${watch("scheduledDate")} · ${watch("priority")} priority`
            : "Fill in the scheduled date and technician."}
        </div>

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
