"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Moon, Sun, Trash2 } from "lucide-react";
import workforceService from "@/services/workforceService";
import toast from "react-hot-toast";
import {
  FormSection,
  WorkforceButton,
  WorkforceInput,
  WorkforceLabel,
} from "@/components/workforce/workforce-ui";

type Shift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

function defaultEndDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export default function AdminCreateShiftForm() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [description, setDescription] = useState("");

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await workforceService.getShifts();
      return (res.data ?? []) as Shift[];
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      workforceService.createShift(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      setName("");
      setDescription("");
      toast.success("Shift created");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create shift");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workforceService.deleteShift(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift deleted");
    },
    onError: () => toast.error("Failed to delete shift"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Shift name is required");
    mutation.mutate({
      name: name.trim(),
      startTime,
      endTime,
      startDate,
      endDate,
      description: description.trim(),
    });
  };

  return (
    <div className="space-y-8">
      <FormSection
        icon={<Clock className="h-5 w-5" />}
        title="Create shift"
        description="Define a shift period with start/end dates and daily hours."
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <WorkforceLabel htmlFor="shift-name">Shift name</WorkforceLabel>
            <WorkforceInput
              id="shift-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning, Night"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <WorkforceLabel htmlFor="shift-start-time">Start time</WorkforceLabel>
              <WorkforceInput
                id="shift-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <WorkforceLabel htmlFor="shift-end-time">End time</WorkforceLabel>
              <WorkforceInput
                id="shift-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <WorkforceLabel htmlFor="shift-start-date">Period start</WorkforceLabel>
              <WorkforceInput
                id="shift-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <WorkforceLabel htmlFor="shift-end-date">Period end</WorkforceLabel>
              <WorkforceInput
                id="shift-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <WorkforceLabel htmlFor="shift-desc">Description (optional)</WorkforceLabel>
            <WorkforceInput
              id="shift-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this shift"
            />
          </div>
          <WorkforceButton type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create shift"}
          </WorkforceButton>
        </form>
      </FormSection>

      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Active shifts
        </h4>
        {isLoading ? (
          <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ) : shifts.length === 0 ? (
          <p className="text-sm text-slate-500">No shifts yet.</p>
        ) : (
          <ul className="space-y-2">
            {shifts.map((shift) => {
              const isNight =
                parseInt(shift.startTime.split(":")[0], 10) >= 18;
              return (
                <li
                  key={shift.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isNight
                        ? "bg-violet-100 text-violet-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {isNight ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{shift.name}</p>
                    <p className="text-sm text-slate-500">
                      {shift.startTime} – {shift.endTime}
                      {shift.startDate && shift.endDate
                        ? ` · ${new Date(shift.startDate).toLocaleDateString()} – ${new Date(shift.endDate).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <WorkforceButton
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      if (confirm("Delete this shift?")) {
                        deleteMutation.mutate(shift.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </WorkforceButton>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
