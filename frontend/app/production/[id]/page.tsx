"use client";

import { useMemo, use } from "react";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/production/OrderStatusBadge";
import { StageProgressStepper } from "@/components/production/StageProgressStepper";

export default function ProductionOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
  }) {
      const { id } = use(params);

  const order = useMemo(
    () => ({
      id: id,
      product: "Denim Jackets",
      targetQuantity: 1800,
      progress: 72,
      stage: "SEWING",
      status: "IN_PROGRESS",
      supervisor: "Amina",
      deadline: "May 27",
    }),
    [id],
  );

  return (
    <div className="space-y-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
              Production Order
            </p>
            <h1 className="text-3xl font-black text-slate-900">{order.id}</h1>
            <p className="text-sm text-slate-500">{order.product}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <InfoCard
            label="Target Quantity"
            value={order.targetQuantity.toString()}
          />
          <InfoCard label="Supervisor" value={order.supervisor} />
          <InfoCard label="Deadline" value={order.deadline} />
        </div>
      </div>

      <StageProgressStepper currentStage={order.stage} />

      <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Order Actions
            </h2>
            <p className="text-sm text-slate-500">
              Manage stages, outputs, and issue tracking for this order.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/production/${order.id}/stages`}
              className="rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-black text-white hover:bg-indigo-700"
            >
              Stages
            </Link>
            <Link
              href={`/production/${order.id}/output`}
              className="rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700"
            >
              Output
            </Link>
            <Link
              href={`/production/${order.id}/issues`}
              className="rounded-3xl bg-amber-600 px-4 py-3 text-sm font-black text-white hover:bg-amber-700"
            >
              Issues
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
      <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
