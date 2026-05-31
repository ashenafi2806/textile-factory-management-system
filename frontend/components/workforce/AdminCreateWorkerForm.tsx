import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export default function AdminCreateWorkerForm() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const mutation = useMutation({
      mutationFn: (payload: any) => workforceService.createWorker(payload),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["workers"] });
        setEmail("");
        setFirstName("");
        setLastName("");
        setDepartmentId("");
        setTeamId("");
        setJobTitle("");
        alert("Worker created");
      },
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return alert("Email is required");
    if (!firstName.trim()) return alert("First name is required");
    mutation.mutate({
      email,
      firstName,
      lastName,
      departmentId: departmentId || undefined,
      teamId: teamId || undefined,
      jobTitle: jobTitle || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3 w-full max-w-lg">
      <h3 className="text-lg font-semibold">Create Worker</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm">First Name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Last Name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Job Title</label>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm">Department ID (optional)</label>
          <input
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Team ID (optional)</label>
          <input
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>
      </div>
      <div>
        <button type="submit" className="btn" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Worker"}
        </button>
      </div>
    </form>
  );
}
