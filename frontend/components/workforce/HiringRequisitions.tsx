"use client";
import React, { useState } from "react";
import {
  useHiringRequests,
  useCreateHiringRequest,
  useApproveHiring,
} from "@/hooks/useHiring";
import { useAuth } from "@/context/auth-context";

export default function HiringRequisitions() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useHiringRequests();
  const createReq = useCreateHiringRequest();
  const approve = useApproveHiring();
  const [form, setForm] = useState({ role: "", headcount: 1, notes: "" });

  const isManager =
    user?.roles?.includes("MANAGER") || user?.roles?.includes("HR_ADMIN");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="font-bold mb-2">Open Requisitions</h3>
        {isLoading ? <div>Loading...</div> : null}
        {isError ? <div className="text-rose-600">Failed to load</div> : null}
        <div className="space-y-2">
          {data?.map((r: any) => (
            <div
              key={r.id}
              className="rounded border p-3 flex justify-between items-center"
            >
              <div>
                <div className="font-bold">
                  {r.role} · {r.headcount}
                </div>
                <div className="text-sm text-slate-500">{r.notes}</div>
              </div>
              <div>
                {isManager ? (
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => approve.mutate(r.id)}
                  >
                    Approve
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2">Create Requisition</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createReq.mutate(form);
          }}
          className="space-y-2"
        >
          <label className="block">
            <div className="text-sm">Role</div>
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input"
            />
          </label>
          <label className="block">
            <div className="text-sm">Headcount</div>
            <input
              type="number"
              value={form.headcount}
              onChange={(e) =>
                setForm({ ...form, headcount: Number(e.target.value) })
              }
              className="input"
            />
          </label>
          <label className="block">
            <div className="text-sm">Notes</div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="textarea"
            />
          </label>
          <div>
            <button className="btn btn-primary" type="submit">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
