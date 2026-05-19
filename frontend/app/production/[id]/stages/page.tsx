// "use client";

// import { useMemo, use } from "react";
// import { StageProgressStepper } from "@/components/production/StageProgressStepper";

// export default function OrderStagesPage({ params }: { params: Promise<{ id: string }> }) {
//     const { id } = use(params);

//   const stages = useMemo(
//     () => [
//       { name: "CUTTING", status: "COMPLETED" },
//       { name: "SEWING", status: "IN_PROGRESS" },
//       { name: "FINISHING", status: "PENDING" },
//       { name: "PACKING", status: "PENDING" },
//     ],
//     [],
//   );

//   return (
//     <div className="space-y-8">
//       <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
//         <h1 className="text-3xl font-black text-slate-900">
//           Order {id} - Stage Management
//         </h1>
//         <p className="mt-2 text-slate-500">
//           Review and manage the stage progress for this production order.
//         </p>
//       </div>

//       <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
//         <StageProgressStepper currentStage="SEWING" />
//       </div>

//       <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
//         <h2 className="text-2xl font-black text-slate-900 mb-6">
//           Stage details
//         </h2>
//         <div className="grid gap-4 md:grid-cols-2">
//           {stages.map((stage) => (
//             <div
//               key={stage.name}
//               className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
//             >
//               <div className="flex items-center justify-between gap-3">
//                 <p className="font-black text-slate-900">{stage.name}</p>
//                 <span
//                   className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[.24em] ${stage.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : stage.status === "IN_PROGRESS" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"}`}
//                 >
//                   {stage.status}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as React from "react";
import api from "@/lib/api";

// Define types for the stage data
interface Stage {
  id: string;
  stageName: string;
  stageOrder: number;
  status: string;
  startedAt?: string;
  completedAt?: string;
  assignedWorker?: {
    id: string;
    username: string;
  };
}

export default function OrderStagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  // ✅ Unwrap the Promise with React.use()
  const { id } = React.use(params);

  const [stages, setStages] = useState<Stage[]>([]);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrderData();
    }
  }, [id]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch order details with stages
      const response = await api.get(`/production/${id}`);
      console.log("Order data:", response.data);

      setOrderDetails(response.data);
      setStages(response.data.stages || []);
    } catch (err: any) {
      console.error("Error fetching order:", err);
      setError(err.response?.data?.message || "Failed to load order data");
    } finally {
      setLoading(false);
    }
  };

  const handleStageAction = async (stageId: string, action: string) => {
    try {
      let endpoint = "";
      switch (action) {
        case "start":
          endpoint = `/production/${id}/stages/${stageId}/start`;
          break;
        case "stop":
          endpoint = `/production/${id}/stages/${stageId}/stop`;
          break;
        case "complete":
          endpoint = `/production/${id}/stages/${stageId}/complete`;
          break;
        default:
          return;
      }

      const response = await api.post(endpoint, {});
      console.log(`${action} response:`, response.data);

      // Refresh the data
      await fetchOrderData();
    } catch (err: any) {
      console.error(`Error ${action} stage:`, err);
      alert(err.response?.data?.message || `Failed to ${action} stage`);
    }
  };

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "QA_PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "QA_APPROVED":
        return "bg-green-100 text-green-700";
      case "QA_REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">Loading...</h1>
          <p className="mt-2 text-slate-500">Fetching stage information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-4xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <h1 className="text-3xl font-black text-red-900">Error</h1>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-3xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Order {id} - Stage Management
            </h1>
            <p className="mt-2 text-slate-500">
              Product: {orderDetails?.productName} | Target:{" "}
              {orderDetails?.targetQuantity} units | Status:{" "}
              {orderDetails?.status}
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
        <h2 className="text-xl font-black text-slate-900 mb-6">
          Production Stages
        </h2>

        <div className="space-y-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="rounded-3xl border border-slate-200 p-6 transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-slate-900">
                      {stage.stageOrder}. {stage.stageName}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${getStageStatusColor(stage.status)}`}
                    >
                      {stage.status}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-slate-500">
                    {stage.startedAt && (
                      <div>
                        Started: {new Date(stage.startedAt).toLocaleString()}
                      </div>
                    )}
                    {stage.completedAt && (
                      <div>
                        Completed:{" "}
                        {new Date(stage.completedAt).toLocaleString()}
                      </div>
                    )}
                    {stage.assignedWorker && (
                      <div>Assigned to: {stage.assignedWorker.username}</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {stage.status === "PENDING" && (
                    <button
                      onClick={() => handleStageAction(stage.id, "start")}
                      className="rounded-3xl bg-green-600 px-4 py-2 text-sm font-black text-white hover:bg-green-700"
                    >
                      Start Stage
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

        {stages.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No stages found for this order.
          </div>
        )}
      </div>
    </div>
  );
}