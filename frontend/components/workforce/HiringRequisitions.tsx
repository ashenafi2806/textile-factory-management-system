"use client";
import React, { useState, useEffect } from "react";
import {
  useHiringRequests,
  useCreateHiringRequest,
  useApproveHiring,
  useRejectHiring,
  useHiringRequest,
} from "@/hooks/useHiring";
import { Dialog, Button, Badge } from "@/components/modules/inventory/ui";
import { useAuth } from "@/context/auth-context";

export default function HiringRequisitions() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useHiringRequests();
  const createReq = useCreateHiringRequest();
  const approve = useApproveHiring();
  const rejectReq = useRejectHiring();
  const [form, setForm] = useState({ role: "", headcount: 1, notes: "" });
  const [message, setMessage] = useState<string | null>(null);

  const ROLE_OPTIONS = [
    { value: "MACHINE_OPERATOR", label: "Machine Operator" },
    { value: "SUPERVISOR", label: "Supervisor" },
    { value: "QA_INSPECTOR", label: "QA Inspector" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "STOREKEEPER", label: "Storekeeper" },
    { value: "MANAGER", label: "Manager" },
    { value: "HR_ADMIN", label: "HR Admin" },
    { value: "ADMIN", label: "Admin" },
  ];

  const isManager =
    user?.roles?.includes("MANAGER") ||
    user?.roles?.includes("HR_ADMIN") ||
    user?.roles?.includes("ADMIN");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);
  const { data: selectedRequest, isLoading: isLoadingRequest } =
    useHiringRequest(selectedId);

  useEffect(() => {
    if (!selectedId) return;
    // Debug: log request loading state and result to help trace empty dialog
    // Open the browser console to see these logs when you click "Details".
    // eslint-disable-next-line no-console
    console.log("Hiring details - selectedId:", selectedId);
    // eslint-disable-next-line no-console
    console.log("Hiring details - isLoadingRequest:", isLoadingRequest);
    // eslint-disable-next-line no-console
    console.log("Hiring details - selectedRequest:", selectedRequest);
  }, [selectedId, isLoadingRequest, selectedRequest]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="font-bold mb-3 text-slate-900">Open Requisitions</h3>
        {isLoading ? <div>Loading...</div> : null}
        {isError ? <div className="text-rose-600">Failed to load</div> : null}
        <div className="space-y-2">
          {(data ?? [])
            .slice()
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((r: any) => (
              <div
                key={r.id}
                className="card p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm min-h-[72px]"
              >
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100 break-words">
                      {r.role} · {r.headcount}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 mt-1 break-words">
                    {r.notes}
                  </div>
                  <div className="mt-2 text-xs flex flex-wrap items-center gap-2">
                    <span className="text-slate-500">
                      {r.department ? `${r.department} · ` : ""}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === "OPEN" ? "bg-indigo-100 text-indigo-700" : r.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                    >
                      {r.status}
                    </span>
                    {r.approvedAt ? (
                      <div className="mt-1 text-xs text-emerald-700">
                        Approved: {new Date(r.approvedAt).toLocaleString()}
                      </div>
                    ) : null}
                    {r.rejectedAt ? (
                      <div className="mt-1 text-xs text-rose-700">
                        Rejected: {new Date(r.rejectedAt).toLocaleString()}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex-shrink-0 w-full md:w-auto flex md:flex-col items-start md:items-end gap-2">
                  {isManager && r.status === "OPEN" ? (
                    <>
                      <button
                        className="inline-flex items-center rounded-2xl px-3 py-1 text-sm font-semibold bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmAction("approve");
                          setSelectedId(r.id);
                          setIsConfirmOpen(true);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="inline-flex items-center rounded-2xl px-3 py-1 text-sm font-semibold bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmAction("reject");
                          setSelectedId(r.id);
                          setIsConfirmOpen(true);
                        }}
                      >
                        Reject
                      </button>
                      <button
                        className="inline-flex items-center rounded-2xl px-3 py-1 text-sm font-semibold bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(r.id);
                        }}
                      >
                        Details
                      </button>
                    </>
                  ) : (
                    <button
                      className="inline-flex items-center rounded-2xl px-3 py-1 text-sm font-semibold bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(r.id);
                      }}
                    >
                      Details
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-3 text-slate-900">Create Requisition</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createReq.mutate(form, {
              onSuccess: () => {
                setMessage("Hiring requisition created");
                setForm({ role: "", headcount: 1, notes: "" });
                setTimeout(() => setMessage(null), 4000);
              },
              onError: () => {
                setMessage("Failed to create hiring requisition");
                setTimeout(() => setMessage(null), 4000);
              },
            });
          }}
          className="space-y-3 card p-3 md:p-4 rounded-lg border-slate-200 shadow-sm"
        >
          <label className="block">
            <div className="text-sm text-slate-700">Role</div>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white dark:bg-slate-700"
            >
              <option value="">Select role</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="text-sm text-slate-700">Headcount</div>
            <input
              type="number"
              value={form.headcount}
              onChange={(e) =>
                setForm({ ...form, headcount: Number(e.target.value) })
              }
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white dark:bg-slate-700"
            />
            <div className="text-xs text-slate-500 mt-1">
              Number of positions requested. Use 1 for a single hire.
            </div>
          </label>
          <label className="block">
            <div className="text-sm text-slate-700">Notes</div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="min-h-[90px] w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white dark:bg-slate-700"
            />
            <div className="text-xs text-slate-500 mt-1">
              Optional: details such as required skills, preferred shift, or
              special instructions.
            </div>
          </label>
          <div>
            <button
              className="inline-flex items-center rounded-2xl px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800"
              type="submit"
              disabled={createReq.status === "pending"}
            >
              {createReq.status === "pending" ? "Creating..." : "Create"}
            </button>
          </div>
          {message ? (
            <div className="text-sm mt-2 text-emerald-700">{message}</div>
          ) : null}
        </form>
      </div>
      {/* Details dialog */}
      <Dialog
        isOpen={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title="Requisition Details"
        description="Details about this hiring requisition"
      >
        {isLoadingRequest ? (
          <div>Loading...</div>
        ) : selectedRequest ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xl font-black text-slate-900">
                {selectedRequest.role} · {selectedRequest.headcount}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  variant={
                    selectedRequest.status === "OPEN"
                      ? "indigo"
                      : selectedRequest.status === "APPROVED"
                        ? "green"
                        : "red"
                  }
                >
                  {selectedRequest.status}
                </Badge>
              </div>
              <div className="mt-3 text-sm text-slate-700">
                {selectedRequest.notes}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Created: {new Date(selectedRequest.createdAt).toLocaleString()}
              </div>
              {selectedRequest.approvedAt ? (
                <div className="mt-1 text-xs text-emerald-700">
                  Approved:{" "}
                  {new Date(selectedRequest.approvedAt).toLocaleString()}
                </div>
              ) : null}
              {selectedRequest.rejectedAt ? (
                <div className="mt-1 text-xs text-rose-700">
                  Rejected:{" "}
                  {new Date(selectedRequest.rejectedAt).toLocaleString()}
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              {isManager && selectedRequest.status === "OPEN" ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setConfirmAction("reject");
                      setIsConfirmOpen(true);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setConfirmAction("approve");
                      setIsConfirmOpen(true);
                    }}
                  >
                    Approve
                  </Button>
                </>
              ) : null}
            </div>
            <div className="pt-4 text-xs text-slate-500">
              <div className="font-semibold">Raw response</div>
              {selectedRequest ? (
                <div className="mt-2 max-h-40 overflow-auto rounded-md bg-slate-50 p-2 text-xs">
                  {Object.entries(selectedRequest).map(([key, val]) => {
                    const isObject = typeof val === "object" && val !== null;
                    const formatted = isObject
                      ? JSON.stringify(val, null, 2)
                      : String(val ?? "");
                    const truncated =
                      formatted.length > 400
                        ? formatted.slice(0, 400) + "…"
                        : formatted;
                    return (
                      <div key={key} className="mb-2">
                        <div className="text-slate-600 font-medium">{key}</div>
                        {isObject ? (
                          <pre className="whitespace-pre-wrap mt-1 rounded p-2 bg-white text-xs text-slate-800">
                            {truncated}
                          </pre>
                        ) : (
                          <div className="mt-1 text-slate-800 break-words">
                            {truncated}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-2 text-xs text-slate-500">
                  No details available.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* Confirm dialog */}
      <Dialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setConfirmAction(null);
        }}
        title={
          confirmAction === "approve"
            ? "Approve Requisition"
            : "Reject Requisition"
        }
        description="Confirm this action"
      >
        {
          <div className="space-y-4">
            <div className="text-sm text-slate-700">
              Are you sure you want to {confirmAction} this requisition?
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsConfirmOpen(false);
                  setConfirmAction(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedId || !confirmAction) return;
                  if (confirmAction === "approve") {
                    approve.mutate(selectedId, {
                      onSuccess: () => {
                        setIsConfirmOpen(false);
                        setConfirmAction(null);
                        setMessage("Requisition approved");
                        setTimeout(() => setMessage(null), 3000);
                      },
                    });
                  } else {
                    rejectReq.mutate(selectedId, {
                      onSuccess: () => {
                        setIsConfirmOpen(false);
                        setConfirmAction(null);
                        setMessage("Requisition rejected");
                        setTimeout(() => setMessage(null), 3000);
                      },
                    });
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        }
      </Dialog>
    </div>
  );
}
