"use client";
import React, { useState } from "react";
import {
  usePendingLeaves,
  useMyLeaves,
  useRequestLeave,
  useApproveLeave,
} from "@/hooks/useLeaves";
import { useAuth } from "@/context/auth-context";

export default function LeavesTabs() {
  const { user } = useAuth();
  const pending = usePendingLeaves();
  const myLeaves = useMyLeaves();
  const requestLeave = useRequestLeave();
  const approveLeave = useApproveLeave();

  const [tab, setTab] = useState<"pending" | "my">("pending");
  const [form, setForm] = useState({ from: "", to: "", reason: "" });

  const isManager =
    user?.roles?.includes("MANAGER") || user?.roles?.includes("HR_ADMIN");

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          className={`btn ${tab === "pending" ? "btn-primary" : ""}`}
          onClick={() => setTab("pending")}
        >
          Pending Approvals
        </button>
        <button
          className={`btn ${tab === "my" ? "btn-primary" : ""}`}
          onClick={() => setTab("my")}
        >
          My Requests
        </button>
      </div>

      {tab === "pending" ? (
        <div>
          {pending.isLoading ? <div>Loading...</div> : null}
          {pending.isError ? (
            <div className="text-rose-600">Failed to load pending leaves</div>
          ) : null}
          <div className="space-y-2">
            {pending.data?.map((p: any) => (
              <div
                key={p.id}
                className="card p-3 flex justify-between items-center"
              >
                <div>
                  <div className="font-bold">{p.employeeName}</div>
                  <div className="text-sm text-slate-500">
                    {p.from} → {p.to} • {p.reason}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isManager ? (
                    <>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => approveLeave.mutate(p.id)}
                      >
                        Approve
                      </button>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400">
                      Awaiting manager
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                requestLeave.mutate(form);
              }}
              className="space-y-2"
            >
              <label className="block">
                <div className="text-sm">From</div>
                <input
                  type="date"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  className="input"
                />
              </label>
              <label className="block">
                <div className="text-sm">To</div>
                <input
                  type="date"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  className="input"
                />
              </label>
              <label className="block">
                <div className="text-sm">Reason</div>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="textarea"
                />
              </label>
              <div>
                <button type="submit" className="btn btn-primary">
                  Request Leave
                </button>
              </div>
            </form>
          </div>

          <div>
            {myLeaves.isLoading ? <div>Loading...</div> : null}
            {myLeaves.isError ? (
              <div className="text-rose-600">Failed to load your leaves</div>
            ) : null}
            <div className="space-y-2">
              {myLeaves.data?.map((l: any) => (
                <div key={l.id} className="card p-3">
                  <div className="font-bold">
                    {l.from} → {l.to}
                  </div>
                  <div className="text-sm text-slate-500">
                    {l.reason} • {l.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
