"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  maintenanceApi,
  type MaintenanceTask,
} from "@/lib/api/maintenance";
import { Button, Dialog, Input, Select } from "./ui";

type TechnicianOption = {
  id: string;
  username: string;
  position: string;
};

async function fetchTechnicians() {
  const response = await api.get("/maintenance/technicians");
  return response.data as TechnicianOption[];
}

export function ApproveFailureModal({
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
  const [assignedToId, setAssignedToId] = useState("");
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
    return items.filter((t) =>
      `${t.username} ${t.position}`.toLowerCase().includes(term),
    );
  }, [search, techniciansQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      maintenanceApi.approveFailure(task?.id ?? "", {
        assignedToId,
      }),
    onSuccess: async () => {
      toast.success("Failure approved. Technician assigned.");
      await queryClient.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("maintenance"),
      });
      onSuccess();
      onClose();
      setAssignedToId("");
      setSearch("");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to approve failure",
      );
    },
  });

  if (!task) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Approve failure & assign technician"
      description="Accept the report and assign who will fix the equipment. The technician is notified immediately."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-bold text-slate-900">{task.equipmentName}</p>
          <p className="mt-1 text-slate-600">{task.description}</p>
          <p className="mt-2 text-xs text-slate-500">
            Reported by {task.reportedBy?.username ?? "Unknown"}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Search technicians
          </label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Assign to
          </label>
          <Select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
          >
            <option value="">Select technician</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.username} — {t.position}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!assignedToId || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Approve & assign
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
