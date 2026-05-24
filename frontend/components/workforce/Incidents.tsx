"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  useIncidents,
  useCreateIncident,
  useApproveIncident,
} from "@/hooks/useIncidents";
import { useAuth } from "@/context/auth-context";

export default function Incidents() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useIncidents();
  const create = useCreateIncident();
  const approve = useApproveIncident();
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "LOW",
  });

  const canCreate =
    user?.roles?.includes("SUPERVISOR") || user?.roles?.includes("ADMIN");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="font-bold mb-2">Recent Incidents</h3>
        {isLoading ? <div>Loading...</div> : null}
        {isError ? <div className="text-rose-600">Failed to load</div> : null}
        <div className="space-y-2">
          {data?.map((inc: any) => (
            <div
              key={inc.id}
              className="rounded border p-3 flex justify-between items-start"
            >
              <div>
                <div className="font-bold">
                  <Link
                    href={`/supervisor/incidents/${inc.id}`}
                    className="text-indigo-600 font-bold"
                  >
                    {inc.title}
                  </Link>{" "}
                  · {inc.severity}
                </div>
                <div className="text-sm text-slate-500">{inc.description}</div>
                <div className="text-xs text-slate-400">
                  Reported by: {inc.reportedBy}
                </div>
              </div>
              <div>
                {(user?.roles?.includes("MANAGER") ||
                  user?.roles?.includes("HR_ADMIN") ||
                  user?.roles?.includes("ADMIN")) &&
                inc.status === "OPEN" ? (
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => approve.mutate(inc.id)}
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
        <h3 className="font-bold mb-2">Report Incident</h3>
        {!canCreate ? (
          <div className="text-slate-500">
            Only supervisors or admins can report incidents.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate(form);
              setForm({ title: "", description: "", severity: "LOW" });
            }}
            className="space-y-2"
          >
            <label className="block">
              <div className="text-sm">Title</div>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input"
              />
            </label>

            <label className="block">
              <div className="text-sm">Severity</div>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="input"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </label>

            <label className="block">
              <div className="text-sm">Description</div>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="textarea"
              />
            </label>

            <div>
              <button className="btn btn-primary" type="submit">
                Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
