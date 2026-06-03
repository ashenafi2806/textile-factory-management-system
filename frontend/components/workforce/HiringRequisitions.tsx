"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  User,
  XCircle,
} from "lucide-react";
import {
  useHiringRequests,
  useCreateHiringRequest,
  useApproveHiring,
  useRejectHiring,
  useHiringRequest,
} from "@/hooks/useHiring";
import { Dialog, Button, Badge } from "@/components/modules/inventory/ui";
import { useAuth } from "@/context/auth-context";
import { useDepartments } from "@/hooks/useStaffing";
import {
  FormSection,
  WorkforceButton,
  WorkforceInput,
  WorkforceLabel,
  WorkforceSelect,
  WorkforceTextarea,
} from "@/components/workforce/workforce-ui";

type HiringRecord = {
  id: string;
  role: string;
  headcount: number;
  notes?: string | null;
  department?: string | null;
  requiredBy?: string | null;
  status: "OPEN" | "APPROVED" | "REJECTED";
  createdAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  requestedBy?: {
    username?: string;
    workerProfile?: { fullName?: string | null; department?: string | null };
  } | null;
  approvedBy?: {
    username?: string;
    workerProfile?: { fullName?: string | null };
  } | null;
};

type StatusFilter = "ALL" | "OPEN" | "APPROVED" | "REJECTED";

const ROLE_OPTIONS = [
  { value: "MACHINE_OPERATOR", label: "Machine Operator" },
  { value: "CUTTING_OPERATOR", label: "Cutting Operator" },
  { value: "SEWING_OPERATOR", label: "Sewing Operator" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "QA_INSPECTOR", label: "QA Inspector" },
  { value: "MAINTENANCE_TECHNICIAN", label: "Maintenance Technician" },
  { value: "STOREKEEPER", label: "Storekeeper" },
  { value: "PRODUCTION_MANAGER", label: "Production Manager" },
];

function statusLabel(status: string) {
  if (status === "OPEN") return "Pending review";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "OPEN":
      return "amber" as const;
    case "APPROVED":
      return "green" as const;
    case "REJECTED":
      return "red" as const;
    default:
      return "slate" as const;
  }
}

function requesterName(req: HiringRecord) {
  return (
    req.requestedBy?.workerProfile?.fullName ||
    req.requestedBy?.username ||
    "Unknown"
  );
}

export default function HiringRequisitions() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useHiringRequests();
  const { data: departments = [] } = useDepartments();
  const createReq = useCreateHiringRequest();
  const approve = useApproveHiring();
  const rejectReq = useRejectHiring();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [form, setForm] = useState({
    role: "",
    headcount: 1,
    notes: "",
    department: "",
    requiredBy: "",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(
    null,
  );

  const canApprove =
    user?.roles?.includes("HR_ADMIN") ||
    user?.roles?.includes("ADMIN") ||
    user?.roles?.includes("MANAGER");
  const canCreate =
    user?.roles?.includes("MANAGER") ||
    user?.roles?.includes("HR_ADMIN") ||
    user?.roles?.includes("ADMIN");

  const { data: selectedRequest, isLoading: isLoadingRequest } =
    useHiringRequest(selectedId);

  const requests = (data ?? []) as HiringRecord[];

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === "OPEN").length,
      approved: requests.filter((r) => r.status === "APPROVED").length,
      rejected: requests.filter((r) => r.status === "REJECTED").length,
      headcount: requests
        .filter((r) => r.status === "OPEN")
        .reduce((sum, r) => sum + r.headcount, 0),
    }),
    [requests],
  );

  const filtered = useMemo(() => {
    const sorted = [...requests].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (statusFilter === "ALL") return sorted;
    return sorted.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role.trim()) {
      toast.error("Select a role");
      return;
    }
    createReq.mutate(
      {
        role: form.role,
        headcount: form.headcount,
        notes: form.notes.trim() || undefined,
        department: form.department.trim() || undefined,
        requiredBy: form.requiredBy || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Hiring requisition submitted");
          setForm({
            role: "",
            headcount: 1,
            notes: "",
            department: "",
            requiredBy: "",
          });
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || "Failed to create requisition",
          );
        },
      },
    );
  };

  const confirmActionHandler = () => {
    if (!selectedId || !confirmAction) return;
    const mutation = confirmAction === "approve" ? approve : rejectReq;
    mutation.mutate(selectedId, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        setConfirmAction(null);
        setSelectedId(null);
        toast.success(
          confirmAction === "approve"
            ? "Requisition approved"
            : "Requisition rejected",
        );
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Action failed");
      },
    });
  };

  const detail = (selectedRequest ?? requests.find((r) => r.id === selectedId)) as
    | HiringRecord
    | undefined;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Total requisitions"
          value={stats.total}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Pending review"
          value={stats.pending}
          hint={`${stats.headcount} positions requested`}
          variant="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Approved"
          value={stats.approved}
          variant="green"
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" />}
          label="Rejected"
          value={stats.rejected}
          variant="red"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* List */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Requisition pipeline
              </h2>
              <p className="text-sm text-slate-500">
                Track open, approved, and rejected hiring requests.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["ALL", "OPEN", "APPROVED", "REJECTED"] as StatusFilter[]).map(
                (s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      statusFilter === s
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s === "ALL" ? "All" : statusLabel(s)}
                  </button>
                ),
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Failed to load hiring requisitions.
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
              <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">
                No requisitions in this view
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Submit a new request using the form.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-indigo-100 hover:bg-indigo-50/20"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {r.role.replace(/_/g, " ")}
                        </h3>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-700 shadow-sm">
                          × {r.headcount}
                        </span>
                        <Badge variant={statusBadgeVariant(r.status)}>
                          {statusLabel(r.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {r.department ?? "No department"} · Requested by{" "}
                        {requesterName(r)}
                      </p>
                      {r.notes ? (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                          {r.notes}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                        {r.requiredBy ? (
                          <span>
                            Needed by{" "}
                            {new Date(r.requiredBy).toLocaleDateString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Details
                      </button>
                      {canApprove && r.status === "OPEN" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(r.id);
                              setConfirmAction("approve");
                              setIsConfirmOpen(true);
                            }}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(r.id);
                              setConfirmAction("reject");
                              setIsConfirmOpen(true);
                            }}
                            className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Create form */}
        {canCreate ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <FormSection
              icon={<Plus className="h-5 w-5" />}
              title="New requisition"
              description="Managers submit requests; HR Admin approves or rejects."
            >
              <form onSubmit={submitForm} className="mt-4 space-y-4">
                <div>
                  <WorkforceLabel htmlFor="h-role">Role needed</WorkforceLabel>
                  <WorkforceSelect
                    id="h-role"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                  >
                    <option value="">Select role</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </WorkforceSelect>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <WorkforceLabel htmlFor="h-count">Headcount</WorkforceLabel>
                    <WorkforceInput
                      id="h-count"
                      type="number"
                      min={1}
                      value={form.headcount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          headcount: Number(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div>
                    <WorkforceLabel htmlFor="h-date">Required by</WorkforceLabel>
                    <WorkforceInput
                      id="h-date"
                      type="date"
                      value={form.requiredBy}
                      onChange={(e) =>
                        setForm({ ...form, requiredBy: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <WorkforceLabel htmlFor="h-dept">Department</WorkforceLabel>
                  <WorkforceSelect
                    id="h-dept"
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                  >
                    <option value="">Auto (your department)</option>
                    {departments.map((d: { id: string; name: string }) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </WorkforceSelect>
                </div>
                <div>
                  <WorkforceLabel htmlFor="h-notes">
                    Business justification
                  </WorkforceLabel>
                  <WorkforceTextarea
                    id="h-notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="Why is this hire needed? Skills, shift, urgency…"
                  />
                </div>
                <WorkforceButton
                  type="submit"
                  disabled={createReq.isPending}
                  className="w-full"
                >
                  {createReq.isPending ? "Submitting…" : "Submit requisition"}
                </WorkforceButton>
              </form>
            </FormSection>
            {!canApprove ? (
              <p className="mt-4 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                HR Admin will review and approve your request. Track status in
                the pipeline.
              </p>
            ) : null}
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            You can review requisitions but cannot create new ones with your
            current role.
          </section>
        )}
      </div>

      {/* Details dialog */}
      <Dialog
        isOpen={Boolean(selectedId) && !isConfirmOpen}
        onClose={() => setSelectedId(null)}
        title="Requisition details"
        description="Full hiring request information"
      >
        {isLoadingRequest && !detail ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Loading…
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">
                  {detail.role.replace(/_/g, " ")}
                </h3>
                <Badge variant={statusBadgeVariant(detail.status)}>
                  {statusLabel(detail.status)}
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-bold text-indigo-600">
                {detail.headcount}{" "}
                <span className="text-base font-medium text-slate-500">
                  position{detail.headcount === 1 ? "" : "s"}
                </span>
              </p>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <DetailItem label="Department" value={detail.department ?? "—"} />
              <DetailItem
                label="Requested by"
                value={requesterName(detail)}
                icon={<User className="h-4 w-4" />}
              />
              <DetailItem
                label="Submitted"
                value={new Date(detail.createdAt).toLocaleString()}
              />
              <DetailItem
                label="Required by"
                value={
                  detail.requiredBy
                    ? new Date(detail.requiredBy).toLocaleDateString()
                    : "Not specified"
                }
              />
              {detail.approvedAt ? (
                <DetailItem
                  label="Approved"
                  value={`${new Date(detail.approvedAt).toLocaleString()}${detail.approvedBy ? ` by ${detail.approvedBy.workerProfile?.fullName || detail.approvedBy.username}` : ""}`}
                />
              ) : null}
              {detail.rejectedAt ? (
                <DetailItem
                  label="Rejected"
                  value={new Date(detail.rejectedAt).toLocaleString()}
                />
              ) : null}
            </dl>

            {detail.notes ? (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Justification
                </p>
                <p className="mt-1">{detail.notes}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {canApprove && detail.status === "OPEN" ? (
                <>
                  <Button
                    variant="danger"
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
              <Link href="/workforce/staffing">
                <Button variant="secondary">View staffing impact</Button>
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Requisition not found.</p>
        )}
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
            ? "Approve requisition"
            : "Reject requisition"
        }
        description="This action updates the hiring pipeline and staffing plan."
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Are you sure you want to{" "}
            <strong>{confirmAction}</strong> this requisition
            {detail ? ` for ${detail.headcount} ${detail.role.replace(/_/g, " ")} role(s)` : ""}?
          </p>
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
              variant={confirmAction === "reject" ? "danger" : "primary"}
              onClick={confirmActionHandler}
              disabled={approve.isPending || rejectReq.isPending}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  variant?: "default" | "amber" | "green" | "red";
}) {
  const iconBg = {
    default: "bg-indigo-100 text-indigo-600",
    amber: "bg-amber-100 text-amber-600",
    green: "bg-emerald-100 text-emerald-600",
    red: "bg-rose-100 text-rose-600",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconBg[variant]}`}
      >
        {icon}
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </article>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-800">
        {icon}
        {value}
      </dd>
    </div>
  );
}
