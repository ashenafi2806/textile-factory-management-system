"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
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

export default function ProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const supervisorId = window.prompt("Enter supervisor user ID to assign:");
    if (!supervisorId) return;

    try {
      await api.post(`/production/${id}/assign`, { supervisorId });
      fetchOrders();
    } catch (err: unknown) {
      console.error("Failed to assign supervisor", err);
      alert("Unable to assign supervisor to this order.");
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
        supervisor: "Not Assigned",
        deadline: new Date(order.deadline).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      })),
    [orders],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  Production Orders
                </h1>
                <p className="mt-2 text-slate-500">
                  View all production orders and track current stage.
                </p>
              </div>
              <Link
                href="/production/new"
                className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700"
              >
                New Production Order
              </Link>
            </div>
          </div>

          {error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
              {error}
            </div>
          ) : loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500">
              Loading production orders...
            </div>
          ) : (
            <ProductionOrderTable
              orders={rows}
              onCancel={handleCancelOrder}
              onAssign={handleAssignSupervisor}
            />
          )}
        </div>
      </main>
    </div>
  );
}
