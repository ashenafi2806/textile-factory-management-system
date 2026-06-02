"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Layers,
  Package,
  AlertTriangle,
  ClipboardList,
  User,
  Calendar,
  Hash,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { OrderStatusBadge } from "@/components/production/OrderStatusBadge";
import { useCanPerform } from "@/hooks/useCanPerform";
import { useAuth } from "@/context/auth-context";

type Output = {
  id: string;
  goodQuantity: number;
  defectiveQuantity: number;
  shiftDate: string;
  notes?: string | null;
  supervisor?: { username?: string } | null;
};

type QualityInspection = {
  id: string;
  defects: number;
  measurements?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
};

type Issue = {
  id: string;
  issueType: string;
  description: string;
  priority: string;
  status: string;
  createdAt?: string;
  reportedBy?: { username?: string } | null;
  assignedTechnician?: { username?: string } | null;
};

type Stage = {
  id: string;
  stageName: string;
  stageOrder: number;
  status: string;
  assignedWorker?: {
    fullName?: string | null;
    position?: string | null;
    user?: { username?: string };
  } | null;
  startedAt?: string | null;
  completedAt?: string | null;
  completedBy?: { username?: string } | null;
  reviewedBy?: { username?: string } | null;
  reviewedAt?: string | null;
  outputs: Output[];
  qualityInspections?: QualityInspection[];
  issues?: Issue[];
};

type BomItem = {
  id: string;
  materialId: string;
  requiredQuantity: number;
  unit: string;
  material?: { id: string; name: string; sku?: string; quantity?: number };
};

type ProductionOrder = {
  id: string;
  orderNumber: string;
  productName: string;
  productCode: string;
  targetQuantity: number;
  deadline: string;
  status: string;
  currentStage?: string | null;
  releaseRequestStatus?: string;
  releaseRequestedAt?: string | null;
  releaseApprovedAt?: string | null;
  releaseRejectionReason?: string | null;
  createdAt?: string;
  assignedSupervisor?: { id: string; username: string; email?: string } | null;
  createdByManager?: { username?: string } | null;
  releaseRequestedBy?: { username?: string } | null;
  releaseApprovedBy?: { username?: string } | null;
  bomItems?: BomItem[];
  stages?: Stage[];
  issues?: Issue[];
};

type StageAggregate = {
  /** Stage 1: target qty. Later stages: previous stage output (input − defects). */
  stageInput: number;
  defective: number;
  /** Input − defects; becomes the next stage's input */
  stageOutput: number;
  qaDefects: number;
};

function computeStageAggregates(
  stages: Stage[],
  targetQuantity: number,
): Record<string, StageAggregate> {
  const sorted = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);
  const result: Record<string, StageAggregate> = {};
  let previousStageOutput = 0;

  sorted.forEach((stage, index) => {
    const supervisorDefective = (stage.outputs ?? []).reduce(
      (sum, o) => sum + (o.defectiveQuantity ?? 0),
      0,
    );
    const qaDefects = (stage.qualityInspections ?? [])
      .filter((i) => {
        const s = (i.status ?? "").toUpperCase();
        return s === "PENDING" || s === "APPROVED";
      })
      .reduce((sum, i) => sum + (i.defects ?? 0), 0);
    const defective = supervisorDefective + qaDefects;
    const stageInput = index === 0 ? targetQuantity : previousStageOutput;
    const stageOutput = Math.max(0, stageInput - defective);

    result[stage.id] = {
      stageInput,
      defective,
      stageOutput,
      qaDefects,
    };
    previousStageOutput = stageOutput;
  });

  return result;
}

function isPackingStage(stageName: string) {
  const name = stageName.toUpperCase();
  return name === "PACKING" || name === "PACKAGING";
}

function formatStageName(stageName: string) {
  return stageName.replace(/_/g, " ");
}

function resolveReleaseRequestStatus(order: ProductionOrder): string {
  const raw = (order.releaseRequestStatus ?? "NONE").toUpperCase();
  if (raw !== "NONE") return raw;
  if (order.releaseApprovedAt) return "APPROVED";
  if (order.status?.toUpperCase() === "COMPLETED") return "APPROVED";
  if (order.releaseRequestedAt) return "PENDING";
  return "NONE";
}

function resolveCurrentStageLabel(
  order: ProductionOrder,
  stages: Stage[],
): string {
  if (isOrderFinished(order.status)) {
    return "Finished";
  }

  const sorted = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);
  const packingStage = sorted.find((s) => isPackingStage(s.stageName));
  if (
    packingStage &&
    (packingStage.status === "QA_APPROVED" ||
      packingStage.status === "COMPLETED")
  ) {
    return "Finished";
  }

  const inProgress = sorted.find((s) => s.status === "IN_PROGRESS");
  if (inProgress) {
    return formatStageName(inProgress.stageName);
  }

  if (order.currentStage) {
    return formatStageName(order.currentStage);
  }

  const lastActive = [...sorted]
    .reverse()
    .find((s) => s.status !== "PENDING");
  if (lastActive) {
    return formatStageName(lastActive.stageName);
  }

  return "Pending";
}

function isOrderFinished(status: string) {
  const s = status.toUpperCase();
  return s === "COMPLETED" || s === "CANCELLED";
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProductionOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  const canView = useCanPerform([
    "PRODUCTION_MANAGER",
    "PRODUCTION_SUPERVISOR",
    "MANAGER",
    "ADMIN",
  ]);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get<ProductionOrder>(`/production/${id}`);
      setOrder(res.data);
      setError(null);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message =
        axiosError.response?.data?.message || "Failed to load production order.";
      setError(Array.isArray(message) ? message.join(", ") : String(message));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void fetchOrder();
  }, [fetchOrder]);

  const isAssignedSupervisor =
    !!user && order?.assignedSupervisor?.id === user.id;
  const releaseRequestStatus = order
    ? resolveReleaseRequestStatus(order)
    : "NONE";

  const stages = order?.stages ?? [];
  const targetQty = order?.targetQuantity ?? 0;

  const stageAggregates = useMemo(
    () => computeStageAggregates(stages, targetQty),
    [stages, targetQty],
  );

  const summary = useMemo(() => {
    const totalDefects = stages.reduce(
      (sum, s) => sum + (stageAggregates[s.id]?.defective ?? 0),
      0,
    );
    const finalGood = Math.max(0, targetQty - totalDefects);

    const progress =
      stages.length > 0
        ? Math.round(
            (stages.filter(
              (s) => s.status === "COMPLETED" || s.status === "QA_APPROVED",
            ).length /
              stages.length) *
              100,
          )
        : 0;

    const openIssues =
      (order?.issues ?? []).filter((i) => i.status === "OPEN").length +
      stages.reduce(
        (sum, s) =>
          sum + (s.issues ?? []).filter((i) => i.status === "OPEN").length,
        0,
      );

    return { totalDefects, finalGood, progress, openIssues };
  }, [stages, stageAggregates, order?.issues, targetQty]);

  const canRequestRelease =
    !!order &&
    order.status !== "COMPLETED" &&
    stages.length > 0 &&
    stages.every((s) => s.status === "QA_APPROVED") &&
    releaseRequestStatus === "NONE" &&
    (isAssignedSupervisor || user?.roles?.includes("ADMIN"));

  const handleRequestRelease = async () => {
    if (!order) return;
    setRequesting(true);
    try {
      await api.post(`/production/${order.id}/request-release`);
      toast.success("Release request submitted");
      await fetchOrder();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || "Failed to request release",
      );
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-xl font-bold text-rose-800">Access denied</h1>
        <p className="mt-2 text-sm text-rose-700">
          You do not have permission to view this production order.
        </p>
        <Link href="/production" className="mt-4 inline-block text-sm font-semibold text-rose-800 underline">
          Back to orders
        </Link>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-800">{error || "Order not found"}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void fetchOrder();
            }}
            className="rounded-xl bg-red-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
          <Link
            href="/production"
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-800"
          >
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStageLabel = resolveCurrentStageLabel(order, stages);

  const orderFinished = isOrderFinished(order.status);

  const quickLinks = [
    { href: `/production/${id}/stages`, label: "Manage stages" },
    { href: `/production/${id}/output`, label: "Record output" },
    ...(!orderFinished
      ? [{ href: `/production/${id}/issues`, label: "Report issues" }]
      : []),
  ];

  return (
    <div className="w-full max-w-full space-y-5 overflow-x-hidden pb-8 sm:space-y-6">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/production"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          All orders
        </Link>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void fetchOrder();
          }}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-5 text-white sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-100">
                Production order
              </p>
              <h1 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
                {order.orderNumber}
              </h1>
              <p className="mt-1 truncate text-base text-indigo-100">
                {order.productName}
              </p>
              <p className="mt-0.5 text-sm text-indigo-200">
                Code: {order.productCode}
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-white/95 px-1 py-1 shadow-sm">
              <OrderStatusBadge status={order.status} />
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm text-indigo-100">
              <span>Stage progress</span>
              <span className="font-bold">{summary.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${summary.progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4 lg:grid-cols-4">
          <StatCard icon={<Hash className="h-4 w-4" />} label="Target" value={order.targetQuantity} />
          <StatCard
            icon={<Package className="h-5 w-5" />}
            label="Final good"
            value={summary.finalGood}
            hint={`Target ${targetQty} − defects ${summary.totalDefects}`}
          />
          <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Total defects" value={summary.totalDefects} tone="rose" />
          <StatCard icon={<Layers className="h-4 w-4" />} label="Open issues" value={summary.openIssues} tone="amber" />
        </div>

        <div className="grid gap-3 border-t border-slate-100 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow icon={<User className="h-4 w-4" />} label="Supervisor" value={order.assignedSupervisor?.username ?? "Not assigned"} />
          <InfoRow icon={<User className="h-4 w-4" />} label="Created by" value={order.createdByManager?.username ?? "—"} />
          <InfoRow icon={<Calendar className="h-4 w-4" />} label="Deadline" value={new Date(order.deadline).toLocaleDateString()} />
          <InfoRow icon={<Layers className="h-4 w-4" />} label="Current stage" value={currentStageLabel} />
          <InfoRow icon={<ClipboardList className="h-4 w-4" />} label="Stages" value={`${stages.length} total`} />
          {order.createdAt ? (
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created" value={new Date(order.createdAt).toLocaleDateString()} />
          ) : null}
        </div>
      </section>

      {/* Quick links */}
      <nav className="flex flex-wrap gap-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* BOM */}
      {order.bomItems && order.bomItems.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Package className="h-5 w-5 text-indigo-600" />
            Bill of materials
          </h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {order.bomItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {item.material?.name ?? "Unknown material"}
                  </p>
                  {item.material?.sku ? (
                    <p className="text-xs text-slate-500">SKU: {item.material.sku}</p>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm font-medium text-slate-700">
                  {item.requiredQuantity} {item.unit}
                  {typeof item.material?.quantity === "number" ? (
                    <span className="ml-2 text-xs text-slate-400">
                      ({item.material.quantity} in stock)
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Release */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">Finished-goods release</h2>
            <p className="mt-1 text-sm text-slate-500">
              Request inventory release after all stages pass QA.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <dt className="text-slate-500">Status:</dt>
                <dd>
                  <ReleaseBadge status={releaseRequestStatus} />
                </dd>
              </div>
              {order.releaseRequestedBy?.username ? (
                <div>
                  <span className="text-slate-500">Requested by: </span>
                  <span className="font-medium">{order.releaseRequestedBy.username}</span>
                  {order.releaseRequestedAt
                    ? ` · ${new Date(order.releaseRequestedAt).toLocaleString()}`
                    : null}
                </div>
              ) : null}
              {order.releaseApprovedBy?.username ? (
                <div>
                  <span className="text-slate-500">Approved by: </span>
                  <span className="font-medium">{order.releaseApprovedBy.username}</span>
                  {order.releaseApprovedAt
                    ? ` · ${new Date(order.releaseApprovedAt).toLocaleString()}`
                    : null}
                </div>
              ) : null}
              {order.releaseRejectionReason ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">
                  {order.releaseRejectionReason}
                </p>
              ) : null}
            </dl>
          </div>
          {canRequestRelease ? (
            <button
              type="button"
              onClick={handleRequestRelease}
              disabled={requesting}
              className="shrink-0 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {requesting ? "Submitting…" : "Request release"}
            </button>
          ) : null}
        </div>
      </section>

      {/* Stages */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Stage breakdown</h2>
        {stages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No stages configured for this order yet.
          </p>
        ) : (
          stages.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              aggregate={stageAggregates[stage.id]}
              isFirstStage={stage.stageOrder === 1}
            />
          ))
        )}
      </section>
    </div>
  );
}

function StageCard({
  stage,
  aggregate,
  isFirstStage,
}: {
  stage: Stage;
  aggregate?: StageAggregate;
  isFirstStage: boolean;
}) {
  const agg = aggregate ?? {
    stageInput: 0,
    defective: 0,
    stageOutput: 0,
    qaDefects: 0,
  };

  const stageStatusClass =
    stage.status === "QA_APPROVED" || stage.status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-800"
      : stage.status === "IN_PROGRESS"
        ? "bg-indigo-100 text-indigo-800"
        : stage.status === "QA_PENDING"
          ? "bg-amber-100 text-amber-800"
          : stage.status === "QA_REJECTED"
            ? "bg-rose-100 text-rose-800"
            : "bg-slate-100 text-slate-700";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
              {stage.stageOrder}. {stage.stageName.replace(/_/g, " ")}
            </h3>
            <span
              className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${stageStatusClass}`}
            >
              {formatStatusLabel(stage.status)}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <MiniStat
            label={isFirstStage ? "Input (target)" : "Input"}
            value={agg.stageInput}
          />
          <MiniStat label="Defects" value={agg.defective} tone="rose" />
          <MiniStat
            label="Output (to next stage)"
            value={agg.stageOutput}
            tone="emerald"
          />
        </div>

        <div className="mt-3 flex flex-col gap-1 text-sm text-slate-600">
          {(stage.assignedWorker?.fullName || stage.assignedWorker?.user?.username) && (
            <p>
              Worker:{" "}
              <span className="font-medium text-slate-700">
                {stage.assignedWorker?.fullName || stage.assignedWorker?.user?.username}
              </span>
            </p>
          )}
          {stage.completedBy?.username && (
            <p>Completed by {stage.completedBy.username}</p>
          )}
          {stage.reviewedBy?.username && (
            <p>
              QA: {stage.reviewedBy.username}
              {stage.reviewedAt
                ? ` · ${new Date(stage.reviewedAt).toLocaleString()}`
                : ""}
            </p>
          )}
        </div>
      </div>

      {((stage.qualityInspections?.length ?? 0) > 0 ||
        (stage.issues?.length ?? 0) > 0) && (
      <div className="space-y-4 p-4 sm:p-5">
        {(stage.qualityInspections?.length ?? 0) > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
              QA inspections
            </h4>
            <ul className="space-y-2">
              {stage.qualityInspections!.map((insp) => (
                <li
                  key={insp.id}
                  className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-base"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-semibold text-amber-900">
                      {formatStatusLabel(insp.status)}
                    </span>
                    <span className="font-medium text-rose-700">
                      {insp.defects} defects
                    </span>
                  </div>
                  {insp.notes ? (
                    <p className="mt-1 text-sm text-slate-600">{insp.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(stage.issues?.length ?? 0) > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Issues
            </h4>
            <ul className="space-y-2">
              {stage.issues!.map((issue) => (
                <li
                  key={issue.id}
                  className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 text-base"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      {formatStatusLabel(issue.issueType)}
                    </span>
                    <span className="text-sm font-semibold uppercase text-rose-700">
                      {formatStatusLabel(issue.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-700">{issue.description}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {issue.reportedBy?.username ?? "Unknown"} · {issue.priority}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      )}
    </article>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "rose" | "amber";
}) {
  const valueClass =
    tone === "rose"
      ? "text-rose-600"
      : tone === "amber"
        ? "text-amber-600"
        : "text-slate-900";

  return (
    <div className="bg-white px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center gap-1.5 text-slate-400">{icon}</div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">
        {label}
      </p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">{hint}</p>
      ) : null}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="truncate text-base font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "emerald" | "rose";
}) {
  const cls =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "rose"
        ? "text-rose-600"
        : "text-slate-800";

  return (
    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
      <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
      <p className={`text-lg font-bold sm:text-xl ${cls}`}>{value}</p>
    </div>
  );
}

function ReleaseBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const classes =
    normalized === "PENDING"
      ? "bg-amber-100 text-amber-800"
      : normalized === "APPROVED"
        ? "bg-emerald-100 text-emerald-800"
        : normalized === "REJECTED"
          ? "bg-rose-100 text-rose-800"
          : "bg-slate-100 text-slate-600";

  const label =
    normalized === "APPROVED"
      ? "Released"
      : normalized === "NONE"
        ? "Not requested"
        : formatStatusLabel(normalized);

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}
