"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  MoreVertical,
  Eye,
  Layers,
  ClipboardCheck,
  UserPlus,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function ProductionOrderTable({
  orders,
  onAssign,
  onCancel,
  onViewInspections,
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
  onViewInspections?: (id: string) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-600 dark:bg-slate-800">
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          No production orders yet
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Create your first order to start tracking production runs.
        </p>
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => (
        <ProductionOrderCard
          key={order.id}
          order={order}
          onAssign={onAssign}
          onCancel={onCancel}
          onViewInspections={onViewInspections}
        />
      ))}
    </div>
  );
}

function ProductionOrderCard({
  order,
  onAssign,
  onCancel,
  onViewInspections,
}: {
  order: {
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
  onAssign?: (id: string) => void;
  onCancel?: (id: string) => void;
  onViewInspections?: (id: string) => void;
}) {
  return (
    <article className="relative flex w-full min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 px-4 py-3 dark:border-slate-700 dark:from-slate-800 dark:to-indigo-950/20">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {order.orderNumber}
            </p>
            <h3
              className="mt-0.5 line-clamp-2 text-base font-bold leading-snug text-slate-900 dark:text-slate-100"
              title={order.product}
            >
              {order.product}
            </h3>
          </div>
          <div className="flex shrink-0 items-start gap-1.5">
            <OrderStatusBadge status={order.status} compact />
            <OrderActionsMenu
              orderId={order.id}
              onAssign={onAssign}
              onCancel={onCancel}
              onViewInspections={onViewInspections}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 py-3">
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Progress</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {order.progress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, order.progress))}%` }}
            />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
          <MetaItem label="Stage" value={order.stage} />
          <MetaItem label="Target qty" value={String(order.target)} />
          <MetaItem label="Supervisor" value={order.supervisor} truncate />
          <MetaItem label="Deadline" value={order.deadline} />
        </dl>
      </div>

      <div className="mt-auto flex gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-700">
        <Link
          href={`/production/${order.id}`}
          className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Eye className="h-4 w-4 shrink-0" />
          <span className="truncate">View order</span>
        </Link>
        <Link
          href={`/production/${order.id}/stages`}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          aria-label="Open stages"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </article>
  );
}

function MetaItem({
  label,
  value,
  truncate: shouldTruncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd
        className={`mt-0.5 font-medium text-slate-800 dark:text-slate-200 ${shouldTruncate ? "truncate" : ""}`}
        title={shouldTruncate ? value : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

function OrderActionsMenu({
  orderId,
  onAssign,
  onCancel,
  onViewInspections,
}: {
  orderId: string;
  onAssign?: (id: string) => void;
  onCancel?: (id: string) => void;
  onViewInspections?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const items: Array<{
    key: string;
    label: string;
    icon: ReactNode;
    href?: string;
    onClick?: () => void;
    danger?: boolean;
  }> = [
    {
      key: "view",
      label: "View details",
      icon: <Eye className="h-4 w-4" />,
      href: `/production/${orderId}`,
    },
    {
      key: "stages",
      label: "Manage stages",
      icon: <Layers className="h-4 w-4" />,
      href: `/production/${orderId}/stages`,
    },
  ];

  if (onViewInspections) {
    items.push({
      key: "inspections",
      label: "QA inspections",
      icon: <ClipboardCheck className="h-4 w-4" />,
      onClick: () => {
        onViewInspections(orderId);
        setOpen(false);
      },
    });
  }
  if (onAssign) {
    items.push({
      key: "assign",
      label: "Assign supervisor",
      icon: <UserPlus className="h-4 w-4" />,
      onClick: () => {
        onAssign(orderId);
        setOpen(false);
      },
    });
  }
  if (onCancel) {
    items.push({
      key: "cancel",
      label: "Cancel order",
      icon: <XCircle className="h-4 w-4" />,
      danger: true,
      onClick: () => {
        onCancel(orderId);
        setOpen(false);
      },
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        aria-label="Order actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-52 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-slate-600 dark:bg-slate-800"
          >
            {items.map((item) =>
              item.href ? (
                <Link
                  key={item.key}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span className="text-slate-400">{item.icon}</span>
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  onClick={item.onClick}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    item.danger
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <span className={item.danger ? "text-rose-500" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ),
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
