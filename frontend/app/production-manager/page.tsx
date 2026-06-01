"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useCanPerform } from "@/hooks/useCanPerform";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  minStockLevel?: number;
};

type Requisition = {
  id: string;
  status: string;
  itemId?: string;
  item?: { name: string };
  quantity?: number;
  purpose?: string;
  createdAt: string;
  requestedBy?: { username: string };
};

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  targetQuantity: number;
  status: string;
  assignedSupervisorId?: string;
};

const TABS = [
  { id: "stock", label: "Available Stock" },
  { id: "spares", label: "Spare Parts for Maintenance" },
  { id: "consumption", label: "Consumption Trends" },
  { id: "requisitions", label: "Approve Emergency Requisitions" },
  { id: "targets", label: "Approve / Adjust Targets" },
  { id: "reports", label: "Production Reports" },
];

export default function ProductionManagerHub() {
  const { user } = useAuth();
  const [tab, setTab] = useState("stock");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryItem[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [consumption, setConsumption] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [perf, setPerf] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [targetForm, setTargetForm] = useState<{
    orderId: string;
    targetQuantity: number;
  }>({ orderId: "", targetQuantity: 0 });

  const canApproveRequisition = useCanPerform([
    "MANAGER",
    "PRODUCTION_MANAGER",
    "ADMIN",
  ]);
  const canAdjustTargets = useCanPerform([
    "PRODUCTION_MANAGER",
    "ADMIN",
  ]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [it, al, rq, c, ord, pr] = await Promise.allSettled([
        api.get("/inventory/items?limit=200"),
        api.get("/inventory/alerts"),
        api.get("/inventory/requisitions"),
        api.get("/inventory/consumption?days=30"),
        api.get("/production"),
        api.get("/production/reports/performance"),
      ]);
      if (it.status === "fulfilled")
        setItems(it.value.data?.data || it.value.data || []);
      if (al.status === "fulfilled")
        setAlerts(al.value.data?.alerts ?? al.value.data ?? []);
      if (rq.status === "fulfilled") setRequisitions(rq.value.data || []);
      if (c.status === "fulfilled") setConsumption(c.value.data);
      if (ord.status === "fulfilled") setOrders(ord.value.data || []);
      if (pr.status === "fulfilled") setPerf(pr.value.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/inventory/requisitions/${id}/approve`);
      toast.success("Requisition approved");
      void loadAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejection?");
    if (!reason) return;
    try {
      await api.patch(`/inventory/requisitions/${id}/reject`, { reason });
      toast.success("Requisition rejected");
      void loadAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject");
    }
  };

  const handleAdjustTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/production/${targetForm.orderId}`, {
        targetQuantity: Number(targetForm.targetQuantity),
      });
      toast.success("Target updated");
      void loadAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update target");
    }
  };

  const allowed =
    !!user &&
    (user.roles.includes("PRODUCTION_MANAGER") ||
      user.roles.includes("ADMIN"));

  if (!user) return null;
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
          <p className="mt-2 text-slate-600">
            Only Production Managers and Admins can use this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-16">
        <div className="max-w-7xl mx-auto space-y-6">
          <header>
            <p className="text-indigo-600 font-black uppercase tracking-[.3em] text-[10px] mb-2">
              Production Planning
            </p>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">
              Production Manager Hub
            </h1>
            <p className="text-slate-500 mt-3 max-w-2xl">
              View stock, approve requisitions, manage targets, and monitor
              production performance.
            </p>
          </header>

          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-t font-bold text-sm ${
                  tab === t.id
                    ? "bg-white text-indigo-600 border border-slate-200 border-b-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t.label}
                {t.id === "requisitions" &&
                  requisitions.filter((r) => r.status === "PENDING").length >
                    0 ? (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                    {requisitions.filter((r) => r.status === "PENDING").length}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {tab === "stock" && (
            <div className="rounded border bg-white p-6">
              <h3 className="font-bold text-slate-900 mb-3">
                Available Stock ({items.length})
              </h3>
              {loading ? (
                <div className="text-slate-500 text-sm">Loading…</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2">Item</th>
                      <th className="py-2">On hand</th>
                      <th className="py-2">Min</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id} className="border-t">
                        <td className="py-2 font-bold">{i.name}</td>
                        <td className="py-2">
                          {i.quantity} {i.unit || ""}
                        </td>
                        <td className="py-2">{i.minStockLevel ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "spares" && (
            <div className="rounded border bg-white p-6">
              <h3 className="font-bold text-slate-900 mb-3">
                Spare-Part Availability for Maintenance
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Below-minimum stock items (use before scheduling heavy
                maintenance).
              </p>
              {alerts.length === 0 ? (
                <div className="text-slate-500 text-sm">
                  No items at risk.
                </div>
              ) : (
                <ul className="space-y-2">
                  {alerts.map((a) => (
                    <li
                      key={a.id}
                      className="flex justify-between border-b py-2"
                    >
                      <span className="font-bold">{a.name}</span>
                      <span className="text-rose-600 font-bold">
                        {a.quantity} {a.unit || ""} (min{" "}
                        {a.minStockLevel ?? 0})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "consumption" && (
            <div className="rounded border bg-white p-6">
              <h3 className="font-bold text-slate-900 mb-3">
                Material Consumption Trends (30 days)
              </h3>
              {consumption ? (
                <pre className="bg-slate-50 rounded p-3 text-xs overflow-auto max-h-96">
                  {JSON.stringify(consumption, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-500 text-sm">
                  No data available.
                </div>
              )}
            </div>
          )}

          {tab === "requisitions" && (
            <div className="rounded border bg-white p-6">
              <h3 className="font-bold text-slate-900 mb-3">
                Emergency Material Requisitions
              </h3>
              {requisitions.length === 0 ? (
                <div className="text-slate-500 text-sm">
                  No requisitions.
                </div>
              ) : (
                <ul className="divide-y">
                  {requisitions.map((r) => (
                    <li
                      key={r.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold">
                          {r.item?.name || r.itemId}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.quantity} · {r.purpose} ·{" "}
                          {r.requestedBy?.username || "—"} ·{" "}
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                            r.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : r.status === "REJECTED"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {r.status}
                        </span>
                        {r.status === "PENDING" && canApproveRequisition ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(r.id)}
                              className="rounded bg-emerald-600 text-white text-xs font-black px-3 py-1"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(r.id)}
                              className="rounded bg-white border border-rose-200 text-rose-600 text-xs font-black px-3 py-1"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "targets" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {canAdjustTargets ? (
              <form
                onSubmit={handleAdjustTarget}
                className="rounded border bg-white p-6 space-y-3"
              >
                <h3 className="font-bold text-slate-900">Adjust Target</h3>
                <select
                  value={targetForm.orderId}
                  onChange={(e) => {
                    const o = orders.find((x) => x.id === e.target.value);
                    setTargetForm({
                      orderId: e.target.value,
                      targetQuantity: o?.targetQuantity || 0,
                    });
                  }}
                  className="input w-full"
                  required
                >
                  <option value="">Pick order…</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.productName} ({o.targetQuantity})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={targetForm.targetQuantity || ""}
                  onChange={(e) =>
                    setTargetForm({
                      ...targetForm,
                      targetQuantity: Number(e.target.value),
                    })
                  }
                  className="input w-full"
                  placeholder="New target quantity"
                />
                <button className="btn btn-primary w-full" type="submit">
                  Update Target
                </button>
              </form>
              ) : (
                <div className="rounded border bg-white p-6 text-sm text-slate-500">
                  Your role can view orders but cannot adjust production targets.
                </div>
              )}

              <div className="rounded border bg-white p-6">
                <h3 className="font-bold text-slate-900 mb-3">Open Orders</h3>
                <ul className="text-sm space-y-1 max-h-80 overflow-y-auto">
                  {orders.map((o) => (
                    <li
                      key={o.id}
                      className="flex justify-between border-b py-1"
                    >
                      <span className="font-bold">{o.orderNumber}</span>
                      <span className="text-slate-500">
                        {o.productName} · target {o.targetQuantity} ·{" "}
                        {o.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === "reports" && (
            <div className="rounded border bg-white p-6">
              <h3 className="font-bold text-slate-900 mb-3">
                Production Reports
              </h3>
              {perf ? (
                <pre className="bg-slate-50 rounded p-3 text-xs overflow-auto max-h-96">
                  {JSON.stringify(perf, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-500 text-sm">Loading…</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
