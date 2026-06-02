'use client';

import { type ReactNode } from 'react';

const statusClasses: Record<string, string> = {
  PLANNED: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  STOPPED: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  PENDING: 'bg-slate-100 text-slate-700',
  QA_PENDING: 'bg-amber-100 text-amber-700',
  QA_APPROVED: 'bg-emerald-100 text-emerald-700',
  QA_REJECTED: 'bg-rose-100 text-rose-700',
  OPEN: 'bg-amber-100 text-amber-800',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
};

export function OrderStatusBadge({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  const label = status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span
      title={label}
      className={`inline-flex max-w-[10rem] items-center justify-center rounded-full font-semibold ${
        compact
          ? "truncate px-2 py-0.5 text-xs leading-tight"
          : "px-3 py-1.5 text-sm"
      } ${statusClasses[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {label}
    </span>
  );
}
