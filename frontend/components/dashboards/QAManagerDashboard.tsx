"use client";

import { useMemo, useState, type ReactNode } from "react";

const defectReasons = [
  { reason: "Stitch spacing", count: 18 },
  { reason: "Material tear", count: 12 },
  { reason: "Color mismatch", count: 9 },
  { reason: "Dimension variance", count: 7 },
];

const completedOrders = [
  {
    id: "PO-9976",
    product: "Workwear Pants",
    supervisor: "Daniel",
    completedAt: "May 14",
  },
  {
    id: "PO-9942",
    product: "Aprons",
    supervisor: "Amina",
    completedAt: "May 13",
  },
  {
    id: "PO-9901",
    product: "Uniform Shirts",
    supervisor: "Mary",
    completedAt: "May 12",
  },
];

const thresholds = [
  { stage: "CUTTING", target: "≤ 2 defects / 100 units", tolerance: "≤ 3%" },
  { stage: "SEWING", target: "≤ 1 defect / 100 units", tolerance: "≤ 2%" },
  {
    stage: "FINISHING",
    target: "≤ 0.5 defects / 100 units",
    tolerance: "≤ 1%",
  },
  { stage: "PACKING", target: "≤ 1 defect / 100 units", tolerance: "≤ 2%" },
];

export function QAManagerDashboard() {
  const [selectedStage, setSelectedStage] = useState("SEWING");
  const [thresholdsState] = useState(thresholds);

  const defectByStage = useMemo(
    () => [
      { stage: "CUTTING", count: 24 },
      { stage: "SEWING", count: 18 },
      { stage: "FINISHING", count: 12 },
      { stage: "PACKING", count: 8 },
    ],
    [],
  );

  const passTrend = useMemo(
    () => [
      { label: "May 9", value: 86 },
      { label: "May 10", value: 88 },
      { label: "May 11", value: 84 },
      { label: "May 12", value: 90 },
      { label: "May 13", value: 89 },
      { label: "May 14", value: 91 },
      { label: "May 15", value: 92 },
    ],
    [],
  );

  const kpis = [
    { title: "Inspections this month", value: "128" },
    { title: "Pass Rate", value: "91%", note: "Approved / total" },
    { title: "Top defect stage", value: "CUTTING" },
    { title: "Orders pending release", value: "6" },
  ];

  return (
    <div className="space-y-10">
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div
            key={item.title}
            className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400 mb-3">
              {item.title}
            </p>
            <p className="text-4xl font-black text-slate-900">{item.value}</p>
            {item.note ? (
              <p className="mt-2 text-sm text-slate-500">{item.note}</p>
            ) : null}
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <ChartCard title="Defects by Stage">
            <div className="space-y-4">
              {defectByStage.map((item) => (
                <div key={item.stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{item.stage}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-500"
                      style={{ width: `${Math.min(item.count * 3, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Pass Rate Trend">
            <div className="flex items-end gap-3 h-52">
              {passTrend.map((item) => (
                <div key={item.label} className="flex-1">
                  <div className="relative h-full rounded-3xl bg-slate-100 flex items-end">
                    <div
                      className="w-full rounded-t-3xl bg-emerald-500"
                      style={{ height: `${item.value}%` }}
                    />
                  </div>
                  <p className="mt-3 text-center text-[11px] uppercase tracking-[.24em] text-slate-400">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Rejection Reasons Frequency">
            <div className="space-y-3">
              {defectReasons.map((item) => (
                <div
                  key={item.reason}
                  className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="text-sm text-slate-700">{item.reason}</p>
                  <span className="text-sm font-black text-slate-900">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <aside className="space-y-6">
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
                  Final Product Release
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  Ready for release
                </h2>
              </div>
              <button className="rounded-3xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700">
                Approve Final Release
              </button>
            </div>
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {order.product}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.id} · {order.supervisor}
                      </p>
                    </div>
                    <span className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
                      {order.completedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
                Standards Management
              </p>
              <h2 className="text-2xl font-black text-slate-900">
                Quality thresholds
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Selected stage: {selectedStage}
              </p>
            </div>
            <div className="space-y-4">
              {thresholdsState.map((threshold) => (
                <div
                  key={threshold.stage}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-900">
                      {threshold.stage}
                    </p>
                    <button
                      onClick={() => setSelectedStage(threshold.stage)}
                      className="rounded-3xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Target: {threshold.target}
                  </p>
                  <p className="text-sm text-slate-600">
                    Tolerance: {threshold.tolerance}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[.24em] text-slate-500">
          Live
        </span>
      </div>
      {children}
    </div>
  );
}
