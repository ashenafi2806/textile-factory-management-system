"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Trash2, Users } from "lucide-react";
import workforceService from "@/services/workforceService";
import toast from "react-hot-toast";
import {
  FormSection,
  WorkforceButton,
  WorkforceInput,
  WorkforceLabel,
  WorkforceTextarea,
} from "@/components/workforce/workforce-ui";

type Department = {
  id: string;
  name: string;
  description?: string | null;
  workerCount?: number;
};

export default function AdminCreateDepartmentForm() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await workforceService.getDepartments();
      return (res.data ?? []) as Department[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      workforceService.createDepartment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setName("");
      setDescription("");
      toast.success("Department created");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create department",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workforceService.deleteDepartment?.(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department removed");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete department",
      );
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Department name is required");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="space-y-8">
      <FormSection
        icon={<Building2 className="h-5 w-5" />}
        title="Departments"
        description="Group workers for scheduling, attendance, and reporting."
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <WorkforceLabel htmlFor="dept-name">Department name</WorkforceLabel>
            <WorkforceInput
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production, QA, Maintenance"
            />
          </div>
          <div>
            <WorkforceLabel htmlFor="dept-desc">
              Description (optional)
            </WorkforceLabel>
            <WorkforceTextarea
              id="dept-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this department is responsible for"
            />
          </div>
          <WorkforceButton
            type="submit"
            disabled={createMutation.isPending}
            className="w-full sm:w-auto"
          >
            {createMutation.isPending ? "Creating…" : "Add department"}
          </WorkforceButton>
        </form>
      </FormSection>

      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Registered departments
        </h4>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : departments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <Building2 className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              No departments yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Add your first department above to get started.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {departments.map((dept) => (
              <li
                key={dept.id}
                className="group flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 transition hover:border-indigo-100 hover:bg-indigo-50/30"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{dept.name}</p>
                  {dept.description ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                      {dept.description}
                    </p>
                  ) : null}
                  <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                    <Users className="h-3 w-3" />
                    {dept.workerCount ?? 0} worker
                    {(dept.workerCount ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                {(dept.workerCount ?? 0) === 0 && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(dept.id)}
                    disabled={deleteMutation.isPending}
                    className="shrink-0 rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                    title="Delete department"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
