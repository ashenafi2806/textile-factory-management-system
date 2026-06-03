"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { maintenanceApi, type MaintenanceTask } from "@/lib/api/maintenance";
import { Badge, Button, Dialog, Input, Select } from "./ui";

const schema = z.object({
  assignedToId: z.string().min(1, "Select a technician"),
});

type FormValues = z.infer<typeof schema>;

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

export function AssignTaskModal({
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
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { assignedToId: "" },
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ assignedToId: "" });
      setSearch("");
      return;
    }
    reset({
      assignedToId: task?.assignedToId ?? "",
    });
  }, [isOpen, reset, task?.assignedToId]);

  const mutation = useMutation({
    mutationFn: (payload: FormValues) =>
      maintenanceApi.assignTask(task?.id ?? "", payload),
    onSuccess: async () => {
      toast.success("Task assigned successfully");
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
          "Failed to assign task",
      );
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));

  if (!task) return null;

  const isReassign = Boolean(task.assignedToId);
  const noTechnicians =
    !techniciansQuery.isLoading && (techniciansQuery.data?.length ?? 0) === 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isReassign ? "Reassign technician" : "Assign technician"}
      description="Choose who will perform this maintenance work. They will be notified immediately."
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-900">
            {task.equipmentName}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={task.type === "PREVENTIVE" ? "blue" : "amber"}>
              {task.type}
            </Badge>
            <Badge variant={task.priority === "CRITICAL" ? "red" : "slate"}>
              {task.priority}
            </Badge>
            <Badge variant={task.status === "OPEN" ? "amber" : "blue"}>
              {task.status}
            </Badge>
          </div>
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

        {task.assignedTo?.user?.username ? (
          <p className="text-sm font-medium text-slate-600">
            Currently assigned:{" "}
            <span className="font-bold text-slate-900">
              {task.assignedTo.user.username}
            </span>
          </p>
        ) : null}

        {noTechnicians ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            No maintenance technicians found. Ensure users have the
            MAINTENANCE_TECHNICIAN role and a worker profile (e.g. maint_tech in
            seed data).
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Technician
          </label>
          <Select {...register("assignedToId")} disabled={noTechnicians}>
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
          {techniciansQuery.isLoading ? (
            <p className="mt-1 text-xs text-slate-500">Loading technicians…</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || noTechnicians}
          >
            {isReassign ? "Save assignment" : "Assign technician"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
