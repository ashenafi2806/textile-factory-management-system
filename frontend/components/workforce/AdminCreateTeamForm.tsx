import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export default function AdminCreateTeamForm({
  departmentId,
}: {
  departmentId: string;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [supervisorId, setSupervisorId] = useState("");

  const mutation = useMutation({
      mutationFn: (payload: any) => workforceService.createTeam(departmentId, payload),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["departments"] });
        qc.invalidateQueries({ queryKey: ["teams"] });
        setName("");
        setSupervisorId("");
        alert("Team created");
      },
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Name is required");
    mutation.mutate({
      name: name.trim(),
      supervisorId: supervisorId || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3 w-full max-w-md">
      <h3 className="text-lg font-semibold">Create Team</h3>
      <div>
        <label className="block text-sm">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input mt-1 w-full"
        />
      </div>
      <div>
        <label className="block text-sm">Supervisor (optional - user id)</label>
        <input
          value={supervisorId}
          onChange={(e) => setSupervisorId(e.target.value)}
          className="input mt-1 w-full"
        />
      </div>
      <div>
        <button type="submit" className="btn" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Team"}
        </button>
      </div>
    </form>
  );
}
