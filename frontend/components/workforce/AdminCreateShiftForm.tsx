import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export default function AdminCreateShiftForm() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: (payload: any) => workforceService.createShift(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      setName("");
      setStartTime("");
      setEndTime("");
      setNotes("");
      alert("Shift created");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Name is required");
    if (!startTime || !endTime) return alert("Start and end times required");
    mutation.mutate({
      name: name.trim(),
      startTime,
      endTime,
      // `notes` is not persisted by the shift schema, so we omit it here.
    });
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3 w-full max-w-md">
      <h3 className="text-lg font-semibold">Create Shift</h3>
      <div>
        <label className="block text-sm">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input mt-1 w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm">Start Time (HH:MM)</label>
          <input
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input mt-1 w-full"
            placeholder="08:00"
          />
        </div>
        <div>
          <label className="block text-sm">End Time (HH:MM)</label>
          <input
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="input mt-1 w-full"
            placeholder="17:00"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm">Notes (optional)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input mt-1 w-full"
        />
      </div>
      <div>
        <button type="submit" className="btn" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Shift"}
        </button>
      </div>
    </form>
  );
}
