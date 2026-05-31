'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  urgent: boolean;
  createdAt: string;
};

export function UnreadNotificationsPanel({ title }: { title: string }) {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = async () => {
    const res = await api.get('/notifications');
    setItems(res.data);
  };

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const res = await api.get('/notifications');
        if (alive) setItems(res.data);
      } catch {
        // ignore
      }
    };
    void run();
    const timer = window.setInterval(() => void run(), 10000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    await load();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.24em] text-slate-400">
            Alerts
          </p>
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
          {items.length} unread
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No unread notifications.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className={`rounded-2xl border p-4 ${item.urgent ? 'border-rose-200 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[.24em] text-slate-400">
                    {item.type} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => void markRead(item.id)}
                  className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-black uppercase tracking-[.24em] text-white"
                >
                  Read
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
