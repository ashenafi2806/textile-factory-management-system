'use client';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { api } from '@/lib/api';

export default function ProductionStagesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedIssueOrder, setSelectedIssueOrder] = useState<any>(null);
  const [output, setOutput] = useState({ productionOrderId: '', stageId: '', shiftDate: '', goodQuantity: 0, defectiveQuantity: 0, notes: '' });
  const [issue, setIssue] = useState({ productionOrderId: '', stageId: '', issueType: 'OTHER', description: '', priority: 'NORMAL' });

  const load = async () => {
    const res = await api.get('/production/orders');
    setOrders(res.data);
  };

  useEffect(() => { load(); }, []);

  const submitOutput = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/production/outputs', output);
    setOutput({ productionOrderId: '', stageId: '', shiftDate: '', goodQuantity: 0, defectiveQuantity: 0, notes: '' });
    await load();
  };

  const submitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/production/issues', issue);
    setSelectedIssueOrder(null);
    await load();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-4xl font-black">Stage Control</h1>
        <p className="mt-2 text-slate-300">Record output, track QA flow, and report production issues.</p>

        <div className="mt-8 grid gap-6">
          {orders.map((order) => (
            <section key={order.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">{order.orderNumber}</div>
                  <div className="text-2xl font-black">{order.productName}</div>
                </div>
                <button onClick={() => setSelectedIssueOrder(order)} className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold">Report issue</button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                {order.stages?.map((stage: any) => (
                  <div key={stage.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="font-black">{stage.stageName}</div>
                    <div className="text-sm text-slate-300">{stage.status}</div>
                    <button
                      onClick={() => setOutput({ ...output, productionOrderId: order.id, stageId: stage.id, shiftDate: new Date().toISOString().slice(0, 10) })}
                      className="mt-4 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-950"
                    >
                      Log output
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {output.stageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={submitOutput} className="w-full max-w-md rounded-3xl bg-slate-950 p-6">
            <h3 className="text-xl font-black">Record output</h3>
            <div className="mt-4 grid gap-3">
              <input type="date" className="rounded-2xl bg-white/5 px-4 py-3" value={output.shiftDate} onChange={(e) => setOutput({ ...output, shiftDate: e.target.value })} />
              <input type="number" className="rounded-2xl bg-white/5 px-4 py-3" value={output.goodQuantity} onChange={(e) => setOutput({ ...output, goodQuantity: Number(e.target.value) })} />
              <input type="number" className="rounded-2xl bg-white/5 px-4 py-3" value={output.defectiveQuantity} onChange={(e) => setOutput({ ...output, defectiveQuantity: Number(e.target.value) })} />
              <textarea className="rounded-2xl bg-white/5 px-4 py-3" value={output.notes} onChange={(e) => setOutput({ ...output, notes: e.target.value })} />
            </div>
            <div className="mt-4 flex gap-3">
              <button className="rounded-2xl bg-emerald-400 px-4 py-2 font-black text-slate-950">Save</button>
              <button type="button" onClick={() => setOutput({ productionOrderId: '', stageId: '', shiftDate: '', goodQuantity: 0, defectiveQuantity: 0, notes: '' })} className="rounded-2xl border border-white/10 px-4 py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {selectedIssueOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={submitIssue} className="w-full max-w-md rounded-3xl bg-slate-950 p-6">
            <h3 className="text-xl font-black">Report issue</h3>
            <div className="mt-4 grid gap-3">
              <select className="rounded-2xl bg-white/5 px-4 py-3" value={issue.stageId} onChange={(e) => setIssue({ ...issue, productionOrderId: selectedIssueOrder.id, stageId: e.target.value })}>
                <option value="">Select stage</option>
                {selectedIssueOrder.stages?.map((stage: any) => <option key={stage.id} value={stage.id}>{stage.stageName}</option>)}
              </select>
              <select className="rounded-2xl bg-white/5 px-4 py-3" value={issue.issueType} onChange={(e) => setIssue({ ...issue, issueType: e.target.value })}>
                <option value="MACHINE_FAILURE">Machine failure</option>
                <option value="MATERIAL_SHORTAGE">Material shortage</option>
                <option value="OTHER">Other</option>
              </select>
              <textarea className="rounded-2xl bg-white/5 px-4 py-3" placeholder="Describe the issue" value={issue.description} onChange={(e) => setIssue({ ...issue, description: e.target.value })} />
            </div>
            <div className="mt-4 flex gap-3">
              <button className="rounded-2xl bg-emerald-400 px-4 py-2 font-black text-slate-950">Submit</button>
              <button type="button" onClick={() => setSelectedIssueOrder(null)} className="rounded-2xl border border-white/10 px-4 py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
