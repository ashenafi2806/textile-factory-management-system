'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
};

type Requisition = {
  id: string;
  quantityRequested: number;
  purpose: string;
  status: string;
  rejectedReason?: string | null;
  item: InventoryItem;
};

export default function InventoryRequisitionsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [itemId, setItemId] = useState('');
  const [quantityRequested, setQuantityRequested] = useState('');
  const [purpose, setPurpose] = useState('');
  const selectedItem = items.find((item) => item.id === itemId);
  const requestedQty = Number(quantityRequested || 0);
  const availableQty = selectedItem?.quantity ?? 0;
  const shortBy = Math.max(0, requestedQty - availableQty);
  const canFulfill = itemId ? availableQty >= requestedQty && requestedQty > 0 : false;

  const load = async () => {
    const [itemsRes, reqRes] = await Promise.all([
      api.get('/inventory/items?limit=100'),
      api.get('/inventory/requisitions'),
    ]);
    setItems(itemsRes.data.data ?? itemsRes.data);
    setRequisitions(reqRes.data);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const submit = async () => {
    await api.post('/inventory/requisitions', {
      itemId,
      quantityRequested: Number(quantityRequested),
      purpose,
    });
    setQuantityRequested('');
    setPurpose('');
    await load();
  };

  const approve = async (id: string) => {
    await api.patch(`/inventory/requisitions/${id}/approve`);
    await load();
  };

  const reject = async (id: string) => {
    const reason = window.prompt('Rejection reason');
    if (!reason) return;
    await api.patch(`/inventory/requisitions/${id}/reject`, { reason });
    await load();
  };

  const isManager = user?.roles?.includes('MANAGER') || user?.roles?.includes('ADMIN');

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900">Inventory Requisitions</h1>
        <p className="text-slate-500">Submit and approve stock requests for production and maintenance.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black mb-4">Create Requisition</h2>
          <div className="space-y-4">
            <select className="w-full rounded-2xl border px-4 py-3" value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">Select item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku}) - {item.quantity} {item.unit}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-2xl border px-4 py-3"
              placeholder="Quantity requested"
              value={quantityRequested}
              onChange={(e) => setQuantityRequested(e.target.value)}
            />
            <textarea
              className="w-full rounded-2xl border px-4 py-3"
              placeholder="Purpose, e.g. Production Order PO-001"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
            {selectedItem ? (
              <div className={`rounded-2xl border p-4 text-sm ${canFulfill ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                <p className="font-bold">{selectedItem.name}</p>
                <p>Available: {availableQty} {selectedItem.unit}</p>
                <p>Requested: {requestedQty || 0} {selectedItem.unit}</p>
                <p>{canFulfill ? 'Enough stock is available for this requisition.' : `Short by ${shortBy} ${selectedItem.unit}.`}</p>
              </div>
            ) : null}
            <button className="rounded-2xl bg-slate-900 px-4 py-3 text-white" onClick={submit}>
              Submit Request
            </button>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black mb-4">Requisition Queue</h2>
          <div className="space-y-4">
            {requisitions.map((req) => (
              <div key={req.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">{req.item.name}</p>
                    <p className="text-sm text-slate-500">{req.quantityRequested} {req.item.unit} - {req.purpose}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{req.status}</p>
                    {req.rejectedReason ? <p className="text-sm text-rose-600">{req.rejectedReason}</p> : null}
                  </div>
                  {isManager && req.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <button className="rounded-2xl bg-emerald-600 px-3 py-2 text-white" onClick={() => approve(req.id)}>
                        Approve
                      </button>
                      <button className="rounded-2xl bg-rose-600 px-3 py-2 text-white" onClick={() => reject(req.id)}>
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
