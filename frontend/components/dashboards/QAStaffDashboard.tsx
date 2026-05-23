"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import api from "@/lib/api";

type Stage = {
  id: string;
  stageName: string;
  status: string;
  completedAt?: string | null;
  completedBy?: { username?: string } | null;
  reviewedBy?: { username?: string } | null;
  reviewedAt?: string | null;
  issues?: Array<{ id: string; issueType: string; status: string }>;
};

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  assignedSupervisor?: { username?: string } | null;
  stages: Stage[];
};

export function QAStaffDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [notes, setNotes] = useState("");

  const fetchOrders = async () => {
    const res = await api.get("/production");
    setOrders(res.data);
    setLoading(false);
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await api.get("/production");
      if (alive) {
        setOrders(res.data);
        setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const pendingStages = useMemo(
    () =>
      orders.flatMap((order) =>
        order.stages
          .filter((stage) => stage.status === "QA_PENDING")
          .map((stage) => ({
            ...stage,
            orderId: order.id,
            orderNumber: order.orderNumber,
            productName: order.productName,
            supervisor: order.assignedSupervisor?.username || "Not assigned",
          })),
      ),
    [orders],
  );

  const history = useMemo(
    () =>
      orders
        .flatMap((order) =>
          order.stages
            .filter((stage) => stage.status === "QA_APPROVED" || stage.status === "QA_REJECTED")
            .map((stage) => ({
              id: order.orderNumber,
              product: order.productName,
              stage: stage.stageName,
              outcome: stage.status,
              by: stage.reviewedBy?.username || "Unknown",
              date: stage.reviewedAt ? new Date(stage.reviewedAt).toLocaleDateString() : "—",
            })),
        )
        .slice(0, 6),
    [orders],
  );

  const kpis = [
    { title: "Pending Reviews", value: pendingStages.length },
    { title: "Approved Today", value: history.filter((item) => item.outcome === "QA_APPROVED").length },
    { title: "Rejected Today", value: history.filter((item) => item.outcome === "QA_REJECTED").length },
    { title: "Orders Awaiting QA", value: orders.filter((order) => order.stages.some((stage) => stage.status === "QA_PENDING")).length },
  ];

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStage || !actionType) return;
    await api.post(`/production/${selectedStage.orderId}/qa-review`, {
      stageId: selectedStage.id,
      action: actionType,
      notes,
    });
    setSelectedStage(null);
    setActionType(null);
    setNotes("");
    await fetchOrders();
  };

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Loading QA dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-slate-400">{item.title}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">Pending QA Reviews</p>
              <h2 className="text-xl font-black text-slate-900">Review queue</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[.2em] text-slate-500">
                  <th className="py-3 pr-5">Order #</th>
                  <th className="py-3 pr-5">Product</th>
                  <th className="py-3 pr-5">Stage</th>
                  <th className="py-3 pr-5">Supervisor</th>
                  <th className="py-3 pr-5">Completed By</th>
                  <th className="py-3 pl-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingStages.map((stage) => (
                  <tr key={stage.id}>
                    <td className="py-4 pr-5 font-black text-slate-900">{stage.orderNumber}</td>
                    <td className="py-4 pr-5 text-slate-700">{stage.productName}</td>
                    <td className="py-4 pr-5 text-slate-700">{stage.stageName}</td>
                    <td className="py-4 pr-5 text-slate-700">{stage.supervisor}</td>
                    <td className="py-4 pr-5 text-slate-700">{stage.completedBy?.username || "—"}</td>
                    <td className="py-4 pl-5">
                      <button
                        onClick={() => {
                          setSelectedStage(stage);
                          setActionType("APPROVE");
                        }}
                        className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-white hover:bg-indigo-700"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Recent QA results</h3>
            <div className="mt-4 space-y-3">
              {history.map((item) => (
                <div key={`${item.id}-${item.stage}-${item.date}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{item.id}</p>
                      <p className="text-sm text-slate-500">{item.product} · {item.stage}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[.24em] ${item.outcome === "QA_APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {item.outcome.replace("QA_", "")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">by {item.by} · {item.date}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">Quick links</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/production/qa" className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">QA Queue</Link>
              <Link href="/production" className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">Production</Link>
            </div>
          </div>
        </aside>
      </section>

      {selectedStage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900">Review {selectedStage.orderNumber}</h3>
            <p className="mt-1 text-sm text-slate-500">{selectedStage.productName} · {selectedStage.stageName}</p>
            <form onSubmit={submitReview} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[.24em] text-slate-500">Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Add QA comments or defect notes"
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStage(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("REJECT")}
                  className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-700"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("APPROVE")}
                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
