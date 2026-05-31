'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

type Stage = {
  id: string;
  stageName: string;
  status: string;
  completedAt?: string | null;
  completedBy?: { username?: string } | null;
  reviewedBy?: { username?: string } | null;
  reviewedAt?: string | null;
  orderId?: string;
  orderNumber?: string;
  productName?: string;
  supervisor?: string;
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
  const [measurements, setMeasurements] = useState('');
  const [defects, setDefects] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchOrders = async () => {
    const res = await api.get('/production');
    setOrders(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const pendingStages = useMemo(
    () =>
      orders.flatMap((order) =>
        order.stages
          .filter((stage) => stage.status === 'QA_PENDING' || stage.status === 'IN_PROGRESS')
          .map((stage) => ({
            ...stage,
            orderId: order.id,
            orderNumber: order.orderNumber,
            productName: order.productName,
            supervisor: order.assignedSupervisor?.username || 'Not assigned',
          })),
      ),
    [orders],
  );

  const submitInspection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStage) return;
    setSaving(true);
    try {
      await api.post(
        `/production/${selectedStage.orderId}/stages/${selectedStage.id}/qa-inspection`,
        {
          measurements,
          defects,
          result: defects > 0 ? 'REJECTED' : 'APPROVED',
          notes,
          status: 'PENDING',
        },
      );
      setSelectedStage(null);
      setMeasurements('');
      setDefects(0);
      setNotes('');
      await fetchOrders();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
        Loading QA dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Pending Reviews" value={pendingStages.length} />
        <MetricCard
          title="Approved Today"
          value={orders.flatMap((o) => o.stages).filter((s) => s.status === 'QA_APPROVED').length}
        />
        <MetricCard
          title="Rejected Today"
          value={orders.flatMap((o) => o.stages).filter((s) => s.status === 'QA_REJECTED').length}
        />
        <MetricCard
          title="Orders Awaiting QA"
          value={orders.filter((order) => order.stages.some((stage) => stage.status === 'QA_PENDING')).length}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">Pending QA Reviews</p>
              <h2 className="text-xl font-black text-slate-900">Submit stage inspection</h2>
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
                    <td className="py-4 pl-5">
                      <button
                        onClick={() => setSelectedStage(stage)}
                        className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-white hover:bg-indigo-700"
                      >
                        Submit Review
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
            <h3 className="text-lg font-black text-slate-900">Recent QA flow</h3>
            <p className="mt-2 text-sm text-slate-500">
              Stages are submitted here and then approved or rejected by QA managers.
            </p>
            <div className="mt-4 grid gap-3">
              <Link href="/production" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-900 hover:bg-indigo-50">
                Open production overview
              </Link>
            </div>
          </div>
        </aside>
      </section>

      {selectedStage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-4xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">QA Inspection</h2>
                <p className="text-sm text-slate-500">
                  Stage {selectedStage.stageName} for {selectedStage.productName}
                </p>
              </div>
              <button onClick={() => setSelectedStage(null)} className="text-slate-500 hover:text-slate-900">
                Close
              </button>
            </div>

            <form onSubmit={submitInspection} className="space-y-4">
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">Measurements</span>
                <textarea
                  value={measurements}
                  onChange={(e) => setMeasurements(e.target.value)}
                  className="mt-2 h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </label>
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">Defects</span>
                <input
                  type="number"
                  min={0}
                  value={defects}
                  onChange={(e) => setDefects(Number(e.target.value) || 0)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </label>
              <label className="block text-sm font-black text-slate-900">
                <span className="block text-xs uppercase tracking-[.24em] text-slate-500">Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setSelectedStage(null)} className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  Submit for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[.24em] text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
