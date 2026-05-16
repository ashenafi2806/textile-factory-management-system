"use client";

import { useMemo } from "react";
import { ProductionOrderTable } from "@/components/production/ProductionOrderTable";

export default function ProductionOrdersPage() {
  const orders = useMemo(
    () => [
      {
        id: "PO-9981",
        product: "Denim Jackets",
        target: 1800,
        progress: 72,
        stage: "Sewing",
        status: "IN_PROGRESS",
        supervisor: "Amina",
        deadline: "May 27",
      },
      {
        id: "PO-9976",
        product: "Workwear Pants",
        target: 1200,
        progress: 100,
        stage: "Packing",
        status: "COMPLETED",
        supervisor: "Daniel",
        deadline: "May 22",
      },
      {
        id: "PO-9932",
        product: "Uniform Shirts",
        target: 950,
        progress: 45,
        stage: "Cutting",
        status: "IN_PROGRESS",
        supervisor: "Amina",
        deadline: "May 29",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Production Orders
            </h1>
            <p className="mt-2 text-slate-500">
              Manager view of all active production orders and performance
              indicators.
            </p>
          </div>
          <a
            href="/production-orders/new"
            className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700"
          >
            New Production Order
          </a>
        </div>
      </div>

      <ProductionOrderTable orders={orders} />
    </div>
  );
}
