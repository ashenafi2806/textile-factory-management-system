"use client";

import Link from "next/link";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function ProductionOrderTable({
  orders,
  onAssign,
  onCancel,
}: {
  orders: Array<{
    id: string;
    orderNumber: string;
    product: string;
    target: number;
    progress: number;
    stage: string;
    status: string;
    supervisor: string;
    deadline: string;
  }>;
  onAssign?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <table className="min-w-full text-left text-sm text-slate-700">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-[.2em] text-[10px]">
            <th className="py-4 pr-6">Order #</th>
            <th className="py-4 pr-6">Product</th>
            <th className="py-4 pr-6">Target Qty</th>
            <th className="py-4 pr-6">Progress</th>
            <th className="py-4 pr-6">Stage</th>
            <th className="py-4 pr-6">Status</th>
            <th className="py-4 pr-6">Supervisor</th>
            <th className="py-4 pr-6">Deadline</th>
            <th className="py-4 pl-6">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="py-5 pr-6 font-bold">{order.orderNumber}</td>
              <td className="py-5 pr-6">{order.product}</td>
              <td className="py-5 pr-6">{order.target}</td>
              <td className="py-5 pr-6 w-72">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[.24em] text-slate-400">
                  {order.progress}%
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${order.progress}%` }}
                  />
                </div>
              </td>
              <td className="py-5 pr-6">{order.stage}</td>
              <td className="py-5 pr-6">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="py-5 pr-6">{order.supervisor}</td>
              <td className="py-5 pr-6">{order.deadline}</td>
              <td className="py-5 pl-6">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/production/${order.id}`}
                    className="rounded-3xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                  >
                    View
                  </Link>
                  <Link
                    href={`/production/${order.id}/stages`}
                    className="rounded-3xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700"
                  >
                    Stages
                  </Link>
                  <button
                    onClick={() => onAssign?.(order.id)}
                    className="rounded-3xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-700 hover:bg-amber-200"
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => onCancel?.(order.id)}
                    className="rounded-3xl bg-rose-100 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-200"
                  >
                    Cancel
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
