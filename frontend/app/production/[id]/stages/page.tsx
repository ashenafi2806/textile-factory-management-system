"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCanPerform } from "@/hooks/useCanPerform";

type Stage = {
  id: string;
  stageName: string;
  stageOrder: number;
  status: string;
  startedAt?: string;
  completedAt?: string;
  completedBy?: { username?: string } | null;
  reviewedBy?: { username?: string } | null;
  reviewedAt?: string | null;
};

export default function OrderStagesPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [stages, setStages] = useState<Stage[]>([]);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canView = useCanPerform([
    "PRODUCTION_MANAGER",
    "PRODUCTION_SUPERVISOR",
    "MANAGER",
    "ADMIN",
  ]);
  const canControlStage = useCanPerform(["PRODUCTION_SUPERVISOR", "ADMIN"]);

  const fetchOrderData = async () => {
    const response = await api.get(`/production/${id}`);
    setOrderDetails(response.data);
    setStages(response.data.stages || []);
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const response = await api.get(`/production/${id}`);
      if (alive) {
        setOrderDetails(response.data);
        setStages(response.data.stages || []);
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [id]);

  const handleStageAction = async (
    stageId: string,
    action: "start" | "stop" | "resume" | "submit-for-qa",
  ) => {
    try {
      // "submit-for-qa" hands the stage off to QA (sets status to QA_PENDING).
      // Once QA approves the inspection, supervisor calls /complete to finalize.
      await api.post(`/production/${id}/stages/${stageId}/${action}`, {});
      await fetchOrderData();
    } catch (error) {
      console.error(error);
    }
  };

  const lockedUntil = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const stage of stages) {
      const previous = stages.filter(
        (candidate) => candidate.stageOrder < stage.stageOrder,
      );
      result[stage.id] =
        previous.length > 0 &&
        previous.some((prev) => prev.status !== "QA_APPROVED");
    }
    return result;
  }, [stages]);

  if (!canView) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-2xl font-bold text-rose-800">Access Denied</h1>
        <p className="mt-2 text-rose-700">
          Only Production Supervisors, Production Managers, Managers, and
          Admins can view production stages. Use the QA dashboard for quality
          inspection work.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.3em] text-slate-400">
              Stages
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              {orderDetails?.orderNumber || `Order ${id}`}
            </h1>
            <p className="mt-2 text-slate-500">
              {orderDetails?.productName} | Target{" "}
              {orderDetails?.targetQuantity} units | Supervisor{" "}
              {orderDetails?.assignedSupervisor?.username || "Not assigned"}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>
        </div>
        {actionError ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {actionError}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-900">
                    {stage.stageOrder}. {stage.stageName}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[.24em] text-slate-700">
                    {stage.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {stage.startedAt ? (
                    <div>
                      Started: {new Date(stage.startedAt).toLocaleString()}
                    </div>
                  ) : null}
                  {stage.completedAt ? (
                    <div>
                      Completed: {new Date(stage.completedAt).toLocaleString()}
                    </div>
                  ) : null}
                  {stage.completedBy?.username ? (
                    <div>Completed by: {stage.completedBy.username}</div>
                  ) : null}
                  {stage.reviewedBy?.username ? (
                    <div>QA by: {stage.reviewedBy.username}</div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {canControlStage && stage.status === "PENDING" && !lockedUntil[stage.id] ? (
                  <button
                    onClick={() => handleStageAction(stage.id, "start")}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                  >
                    Start
                  </button>
                ) : null}
                {canControlStage && stage.status === "IN_PROGRESS" ? (
                  <>
                    <button
                      onClick={() => handleStageAction(stage.id, "stop")}
                      className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-black text-white hover:bg-amber-700"
                    >
                      Stop
                    </button>
                    <button
                      onClick={() => handleStageAction(stage.id, "submit-for-qa")}
                      className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700"
                    >
                      Send to QA
                    </button>
                  </>
                ) : null}
                {canControlStage &&
                stage.status === "PENDING" &&
                orderDetails?.status === "STOPPED" &&
                !lockedUntil[stage.id] ? (
                  <button
                    onClick={() => handleStageAction(stage.id, "resume")}
                    className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700"
                  >
                    Resume
                  </button>
                ) : null}
              </div>
            </div>

            {lockedUntil[stage.id] ? (
              <p className="mt-4 text-sm font-medium text-amber-700">
                Locked until all previous stages are QA approved.
              </p>
            ) : null}
            {stage.status === "QA_REJECTED" ? (
              <p className="mt-4 text-sm font-medium text-rose-700">
                Rejected by QA. Fix the stage and resubmit it before later
                stages can continue.
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
