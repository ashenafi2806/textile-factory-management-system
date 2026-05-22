"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

type Stage = {
  id: string;
  stageName: string;
  stageOrder: number;
  status: string;
  startedAt?: string;
  completedAt?: string;
};

export default function OrderStagesPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [stages, setStages] = useState<Stage[]>([]);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    let alive = true;

    const fetchOrderData = async () => {
      const response = await api.get(`/production/${id}`);
      if (alive) {
        setOrderDetails(response.data);
        setStages(response.data.stages || []);
      }
    };

    void fetchOrderData();
    const timer = window.setInterval(() => void fetchOrderData(), 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [id]);

  const handleStageAction = async (stageId: string, action: string) => {
    const endpoints: Record<string, string> = {
      start: `/production/${id}/stages/${stageId}/start`,
      stop: `/production/${id}/stages/${stageId}/stop`,
      resume: `/production/${id}/stages/${stageId}/resume`,
      complete: `/production/${id}/stages/${stageId}/complete`,
    };
    await api.post(endpoints[action], {});
    const response = await api.get(`/production/${id}`);
    setOrderDetails(response.data);
    setStages(response.data.stages || []);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Order {id} - Stage Management
            </h1>
            <p className="mt-2 text-slate-500">
              Product: {orderDetails?.productName} | Target:{" "}
              {orderDetails?.targetQuantity} units | Status: {orderDetails?.status}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="rounded-3xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Back to Order
          </button>
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-6">Production Stages</h2>
        <div className="space-y-4">
          {stages.map((stage) => (
            <div key={stage.id} className="rounded-3xl border border-slate-200 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-slate-900">
                      {stage.stageOrder}. {stage.stageName}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
                      {stage.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {stage.startedAt && <div>Started: {new Date(stage.startedAt).toLocaleString()}</div>}
                    {stage.completedAt && <div>Completed: {new Date(stage.completedAt).toLocaleString()}</div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {stage.status === "PENDING" && orderDetails?.status !== "STOPPED" && (
                    <button
                      onClick={() => handleStageAction(stage.id, "start")}
                      className="rounded-3xl bg-green-600 px-4 py-2 text-sm font-black text-white hover:bg-green-700"
                    >
                      Start Stage
                    </button>
                  )}
                  {stage.status === "PENDING" && orderDetails?.status === "STOPPED" && (
                    <button
                      onClick={() => handleStageAction(stage.id, "resume")}
                      className="rounded-3xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700"
                    >
                      Resume Stage
                    </button>
                  )}
                  {stage.status === "IN_PROGRESS" && (
                    <>
                      <button
                        onClick={() => handleStageAction(stage.id, "stop")}
                        className="rounded-3xl bg-yellow-600 px-4 py-2 text-sm font-black text-white hover:bg-yellow-700"
                      >
                        Stop
                      </button>
                      <button
                        onClick={() => handleStageAction(stage.id, "complete")}
                        className="rounded-3xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
                      >
                        Complete Stage
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
