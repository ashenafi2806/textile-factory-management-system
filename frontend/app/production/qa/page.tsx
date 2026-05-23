"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import api from "@/lib/api";
import Link from "next/link";

type Stage = {
  id: string;
  stageName: string;
  status: string;
  completedAt?: string;
  assignedWorker?: { username: string };
  completedBy?: { username: string };
  reviewedBy?: { username: string };
  reviewedAt?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  deadline: string;
  targetQuantity: number;
  assignedSupervisor?: { username: string };
  stages?: Stage[];
};

type QaTask = {
  orderId: string;
  orderNumber: string;
  productName: string;
  deadline: string;
  targetQuantity: number;
  supervisor?: string;
  stageId: string;
  stageName: string;
  completedAt?: string;
  worker?: string;
  completedBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

export default function QaDashboardPage() {
  const [tasks, setTasks] = useState<QaTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // States for expanding details and handling forms per task
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);
  const [defectCounts, setDefectCounts] = useState<Record<string, number>>({});
  const [qaNotes, setQaNotes] = useState<Record<string, string>>({});

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/production");
      const orders: Order[] = res.data;
      const qaTasks: QaTask[] = [];
      for (const o of orders) {
        if (!o.stages || o.stages.length === 0) continue;
        for (const s of o.stages) {
          if (s.status === "QA_PENDING") {
            qaTasks.push({
              orderId: o.id,
              orderNumber: o.orderNumber,
              productName: o.productName,
              deadline: o.deadline,
              targetQuantity: o.targetQuantity,
              supervisor: o.assignedSupervisor?.username || "Not Assigned",
              stageId: s.id,
              stageName: s.stageName,
              completedAt: s.completedAt,
              worker: s.assignedWorker?.username || "Unknown",
              completedBy: s.completedBy?.username,
              reviewedBy: s.reviewedBy?.username,
              reviewedAt: s.reviewedAt,
            });
          }
        }
      }
      setTasks(qaTasks);
    } catch (err) {
      console.error("Failed to fetch QA tasks", err);
      setError("Unable to load QA tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAction = async (
    orderId: string,
    stageId: string,
    action: "APPROVE" | "REJECT",
  ) => {
    if (!window.confirm(`Are you sure you want to ${action} this stage?`)) return;

    setActionLoading(stageId);
    try {
      const notes = qaNotes[stageId] || "";
      const defects = defectCounts[stageId] || 0;

      // Log a human-readable issue for traceability.
      if (notes || defects > 0) {
        await api.post(`/production/${orderId}/issues`, {
          stageId,
          issueType: "OTHER",
          description: `QA ${action}: ${defects} defect(s) found. ${notes ? "Notes: " + notes : ""}`.trim(),
          priority: action === "REJECT" ? "CRITICAL" : "NORMAL",
        });
      }

      // Submit the QA review decision (approve / reject)
      await api.post(`/production/${orderId}/stages/${stageId}/qa-review`, { action });

      await fetchTasks();

      // Clean up local form state
      setQaNotes((prev) => ({ ...prev, [stageId]: "" }));
      setDefectCounts((prev) => ({ ...prev, [stageId]: 0 }));
      if (expandedStageId === stageId) setExpandedStageId(null);
    } catch (err) {
      console.error("QA action failed", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      alert(
        axiosError.response?.data?.message || "QA action failed. Please try again.",
      );
    } finally {
      setActionLoading(null);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">
                  Quality Assurance
                </p>
                <h1 className="text-3xl font-black text-slate-900 mt-1">Pending Inspections</h1>
                <p className="mt-2 text-slate-500">
                  Review completed production stages before they proceed. Expand tasks to log defects.
                </p>
              </div>
              <div className="rounded-full bg-amber-50 border border-amber-200 px-6 py-3 flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="text-sm font-black text-amber-700 tracking-wider">
                  {tasks.length} {tasks.length === 1 ? 'TASK' : 'TASKS'} PENDING
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-4xl border border-slate-100 bg-white p-6 shadow-sm animate-pulse h-64">
                  <div className="h-4 bg-slate-100 rounded-full w-1/3 mb-4"></div>
                  <div className="h-8 bg-slate-100 rounded-lg w-2/3 mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                    <div className="h-4 bg-slate-100 rounded-full w-4/5"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-4xl border border-dashed border-slate-300 bg-white p-16 text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 mb-6">
                <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-900">All Caught Up!</h3>
              <p className="mt-2 text-slate-500">There are no stages awaiting QA inspection at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((t) => {
                const isExpanded = expandedStageId === t.stageId;
                return (
                  <div key={`${t.orderId}-${t.stageId}`} className="group relative rounded-4xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[.24em] text-slate-600">
                          {t.orderNumber}
                        </span>
                        <Link href={`/production/${t.orderId}`} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold tracking-wider">
                          VIEW ORDER &rarr;
                        </Link>
                      </div>
                      
                      <h3 className="text-2xl font-black text-slate-900 mb-1">{t.stageName}</h3>
                      <p className="text-sm font-semibold text-slate-500 mb-6">{t.productName}</p>
                      
                      <div className="space-y-3 text-sm text-slate-600 mb-4 border-t border-slate-100 pt-6">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Supervisor</span>
                          <span className="font-bold text-slate-800">{t.supervisor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Completed By</span>
                          <span className="font-bold text-slate-800">
                            {t.completedBy || t.worker}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Completed At</span>
                          <span className="font-bold text-slate-800">{t.completedAt ? new Date(t.completedAt).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setExpandedStageId(isExpanded ? null : t.stageId)}
                        className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 mb-6 flex items-center gap-1"
                      >
                        {isExpanded ? 'Hide Details ▲' : 'View More & Log Details ▼'}
                      </button>

                      {isExpanded && (
                        <div className="mb-6 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-sm animate-in fade-in slide-in-from-top-2">
                          <p className="font-bold text-slate-700 mb-3 border-b border-amber-100 pb-2">QA Inspection Form</p>
                          <div className="flex justify-between mb-4">
                            <span className="text-slate-500">Target Qty</span>
                            <span className="font-black text-slate-900">{t.targetQuantity} units</span>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Defects Found</label>
                              <input 
                                type="number" 
                                min="0"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                value={defectCounts[t.stageId] || ''}
                                onChange={(e) => setDefectCounts({...defectCounts, [t.stageId]: parseInt(e.target.value) || 0})}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">QA Notes / Suggestions</label>
                              <textarea 
                                rows={2}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                value={qaNotes[t.stageId] || ''}
                                onChange={(e) => setQaNotes({...qaNotes, [t.stageId]: e.target.value})}
                                placeholder="Log issues or leave comments..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(t.orderId, t.stageId, "REJECT")}
                        disabled={actionLoading === t.stageId}
                        className="flex-1 rounded-3xl bg-rose-50 text-rose-700 px-4 py-3 text-sm font-black hover:bg-rose-100 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === t.stageId ? "..." : "Reject"}
                      </button>
                      <button
                        onClick={() => handleAction(t.orderId, t.stageId, "APPROVE")}
                        disabled={actionLoading === t.stageId}
                        className="flex-[2] rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm shadow-emerald-200"
                      >
                        {actionLoading === t.stageId ? "Processing..." : "Approve Stage"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
