"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export function QAManagerDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [thresholds, setThresholds] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [dashRes, thrRes] = await Promise.all([
          api.get("/production/qa/dashboard"),
          api.get("/production/qa/thresholds"),
        ]);
        if (alive) {
          setDashboard(dashRes.data);
          setThresholds(thrRes.data);
        }
      } catch {
        // ignore
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Inspections" value={dashboard?.totalInspections ?? 0} />
        <Metric title="Total Defects" value={dashboard?.totalDefects ?? 0} />
        <Metric title="Defect Rate" value={`${((dashboard?.defectRate ?? 0) * 100).toFixed(2)}%`} />
        <Metric title="Stages Tracked" value={Object.keys(dashboard?.byStage ?? {}).length} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">QA Analytics</p>
              <h2 className="text-xl font-black text-slate-900">Defect trend by stage</h2>
            </div>
            <Link href="/production/qa" className="text-sm font-black text-indigo-600">
              Open QA queue
            </Link>
          </div>
          <div className="space-y-3">
            {Object.entries(dashboard?.byStage ?? {}).map(([stage, data]: any) => (
              <div key={stage} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-black text-slate-900">{stage}</p>
                  <p className="text-sm text-slate-600">{data.defects} defects</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {data.inspections} inspections · {data.passes} passes · {data.rejects} rejects
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-900">Recommendations</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {(dashboard?.recommendations ?? []).map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Quality thresholds</h3>
            <div className="mt-4 space-y-3">
              {thresholds.map((t) => (
                <div key={t.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-black text-slate-900">{t.stageName}</p>
                  <p className="text-sm text-slate-600">Max defects/100: {t.maxDefectsPerHundred}</p>
                  <p className="text-sm text-slate-500">{t.acceptanceCriteria}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[.24em] text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
