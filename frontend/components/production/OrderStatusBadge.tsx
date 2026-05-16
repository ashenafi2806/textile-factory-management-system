'use client';

import { type ReactNode } from 'react';

const statusClasses: Record<string, string> = {
  PLANNED: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  STOPPED: 'bg-amber-100 text-amber-700',
  QA_PENDING: 'bg-amber-100 text-amber-700',
  QA_APPROVED: 'bg-emerald-100 text-emerald-700',
  QA_REJECTED: 'bg-rose-100 text-rose-700',
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[.24em] ${statusClasses[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
