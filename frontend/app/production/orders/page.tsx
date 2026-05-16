'use client';
import { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { api } from '@/lib/api';

type ProductionOrder = any;

export default function ProductionOrdersPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    productCode: '',
    targetQuantity: 100,
    deadline: '',
    bomItems: [{ materialId: '', requiredQuantity: 0, unit: 'pcs' }],
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/production-orders');
      setOrders(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) => o.status === 'IN_PROGRESS').length;
    const qaPending = orders.filter((o) => o.stages?.some((s: any) => s.status === 'QA_PENDING')).length;
    return { total, active, qaPending };
  }, [orders]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/production-orders', form);
    setShowForm(false);
    await fetchOrders();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100">
      <Navbar />
      <main className="px-6 py-10 md:px-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">Production control</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Production Orders</h1>
                <p className="mt-3 max-w-2xl text-slate-300">Create and monitor garment production runs, BOMs, supervisor assignment, and QA flow.</p>
              </div>
              <button onClick={() => setShowForm(true)} className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black uppercase tracking-widest text-slate-950">
                New order
              </button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ['Orders', stats.total],
                ['In progress', stats.active],
                ['QA pending', stats.qaPending],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{label}</div>
                  <div className="mt-2 text-3xl font-black">{value as number}</div>
                </div>
              ))}
            </div>
          </section>

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">Loading production orders...</div>
          ) : (
            <div className="grid gap-6">
              {orders.map((order) => (
                <article key={order.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">{order.orderNumber}</div>
                      <h2 className="mt-2 text-2xl font-black">{order.productName}</h2>
                      <p className="text-sm text-slate-300">{order.productCode} · target {order.targetQuantity}</p>
                    </div>
                    <div className="text-sm text-slate-300">
                      <div>Status: <span className="font-black text-white">{order.status}</span></div>
                      <div>Deadline: {new Date(order.deadline).toLocaleDateString()}</div>
                      <div>Current stage: {order.currentStage || 'Not started'}</div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-slate-400">BOM</div>
                      <ul className="space-y-2 text-sm text-slate-200">
                        {order.bomItems?.map((item: any) => (
                          <li key={item.id} className="flex justify-between gap-4">
                            <span>{item.material?.name || item.materialId}</span>
                            <span className="font-mono">{item.requiredQuantity} {item.unit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-slate-400">Stages</div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {order.stages?.map((stage: any) => (
                          <div key={stage.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                            <div className="text-sm font-black">{stage.stageName}</div>
                            <div className="text-xs text-slate-400">{stage.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur">
          <form onSubmit={submit} className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <h3 className="text-2xl font-black">Create production order</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Product name" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
              <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Product code" value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} />
              <input type="number" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={form.targetQuantity} onChange={(e) => setForm({ ...form, targetQuantity: Number(e.target.value) })} />
              <input type="date" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="mt-6 flex gap-3">
              <button className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-2xl border border-white/10 px-5 py-3 font-bold">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
