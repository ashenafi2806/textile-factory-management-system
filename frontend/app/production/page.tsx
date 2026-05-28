"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductionOrderTable } from "@/components/production/ProductionOrderTable";
import api from "@/lib/api";

type ProductionOrder = {
  id: string;
  orderNumber: string;
  productName: string;
  productCode: string;
  targetQuantity: number;
  status: string;
  deadline: string;
  currentStage?: string;
  assignedSupervisor?: { id: string; username: string; email: string } | null;
  stages?: Array<{ status: string; stageName: string }>;
  bomItems?: Array<{
    material?: { name?: string } | null;
    materialId?: string;
    requiredQuantity: number;
    unit: string;
  }>;
};

type ProductionTableRow = {
  id: string;
  orderNumber: string;
  product: string;
  target: number;
  progress: number;
  stage: string;
  status: string;
  supervisor: string;
  deadline: string;
};

type SupervisorUser = {
  id: string;
  username: string;
  email: string;
  roles: { name: string }[];
};

export default function ProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supervisors, setSupervisors] = useState<SupervisorUser[]>([]);
  const [assigningOrder, setAssigningOrder] = useState<ProductionOrder | null>(
    null,
  );
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const handleCancelOrder = async (id: string) => {
    if (!window.confirm(`Cancel production order ${id}?`)) return;

    try {
      await api.delete(`/production/${id}`);
      fetchOrders();
    } catch (err: unknown) {
      console.error("Failed to cancel production order", err);
      alert("Unable to cancel production order.");
    }
  };

  const handleAssignSupervisor = async (id: string) => {
    const order = orders.find((item) => item.id === id) || null;
    setAssigningOrder(order);
    if (supervisors.length === 0) {
      try {
        const response = await api.get("/users");
        setSupervisors(
          (response.data as SupervisorUser[]).filter((user) =>
            user.roles.some((role) => role.name === "PRODUCTION_SUPERVISOR"),
          ),
        );
      } catch (err) {
        console.error("Failed to load supervisors", err);
        alert("Unable to load supervisors.");
      }
    }
  };

  const submitSupervisorAssignment = async () => {
    if (!assigningOrder || !selectedSupervisorId) return;
    setAssigning(true);
    try {
      await api.post(`/production/${assigningOrder.id}/assign`, {
        supervisorId: selectedSupervisorId,
      });
      setAssigningOrder(null);
      setSelectedSupervisorId("");
      await fetchOrders();
    } catch (err) {
      console.error("Failed to assign supervisor", err);
      alert("Unable to assign supervisor to this order.");
    } finally {
      setAssigning(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/production");
      setOrders(response.data);
    } catch (err: unknown) {
      console.error("Failed to fetch production orders", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message ||
          "Unable to fetch production orders.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const rows: ProductionTableRow[] = useMemo(
    () =>
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        product: order.productName,
        target: order.targetQuantity,
        progress:
          order.stages && order.stages.length > 0
            ? Math.round(
                (order.stages.filter(
                  (s) => s.status === "COMPLETED" || s.status === "QA_APPROVED",
                ).length /
                  order.stages.length) *
                  100,
              )
            : 0,
        stage:
          order.currentStage ||
          order.stages?.find((s) => s.status === "IN_PROGRESS")?.stageName ||
          "Pending",
        status: order.status,
        supervisor: order.assignedSupervisor?.username || "Not Assigned",
        deadline: new Date(order.deadline).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      })),
    [orders],
  );

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Production Orders
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View all orders and track the current stage.
            </p>
          </div>
          <Link
            href="/production/new"
            className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-700"
          >
            New Order
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-slate-500 dark:text-slate-300">
          Loading production orders...
        </div>
      ) : (
        <ProductionOrderTable
          orders={rows}
          onCancel={handleCancelOrder}
          onAssign={handleAssignSupervisor}
        />
      )}

      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-4xl bg-white dark:bg-slate-800 p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Assign Supervisor
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {assigningOrder.orderNumber} - {assigningOrder.productName}
              </p>
            </div>

            <label className="block text-sm font-black text-slate-900 mb-4">
              <span className="block text-xs uppercase tracking-[.24em] text-slate-500">
                Select Supervisor
              </span>
              <select
                value={selectedSupervisorId}
                onChange={(e) => setSelectedSupervisorId(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-700 dark:text-slate-100"
              >
                <option value="">Choose a supervisor</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.username} ({supervisor.email})
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setAssigningOrder(null);
                  setSelectedSupervisorId("");
                }}
                className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={!selectedSupervisorId || assigning}
                onClick={submitSupervisorAssignment}
                className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
