import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export default function AdminCreateDepartmentForm() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: (payload: any) => workforceService.createDepartment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setName("");
      setDescription("");
      alert("Department created");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Name is required");
    mutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3 w-full max-w-md">
      <h3 className="text-lg font-semibold">Create Department</h3>
      <div>
        <label className="block text-sm">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1 w-full" />
      </div>
      <div>
        <label className="block text-sm">Description</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="input mt-1 w-full" />
      </div>
      <div>
        <button type="submit" className="btn" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Department"}
        </button>
      </div>
    </form>
  );
}
