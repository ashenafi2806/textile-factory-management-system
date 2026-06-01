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
  category: string;
  quantity: number;
  unit?: string;
  minStockLevel?: number;
};

type Requisition = {
  id: string;
  status: string;
  itemId?: string;
  item?: { name: string; unit?: string };
  quantity?: number;
  purpose?: string;
  createdAt: string;
  requestedBy?: { username: string };
};

type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type ProductionOutput = {
  id: string;
  orderId?: string;
  order?: { orderNumber?: string; productName?: string };
  goodQuantity: number;
  defectiveQuantity?: number;
  shiftDate?: string;
  createdAt: string;
};

const TABS = [
  { id: "materials", label: "Request Materials" },
  { id: "requisitions", label: "My Requisitions" },
  { id: "spares", label: "Spare Parts" },
  { id: "monitor", label: "Critical Spares" },
  { id: "outputs", label: "Finished Products" },
  { id: "notifications", label: "Notifications" },
];

export default function ProductionSupervisorHub() {
  const { user } = useAuth();
  const [tab, setTab] = useState("materials");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryItem[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [outputs, setOutputs] = useState<ProductionOutput[]>([]);
  const [loading, setLoading] = useState(false);

  const canRequestMaterial = useCanPerform([
    "PRODUCTION_SUPERVISOR",
    "ADMIN",
  ]);
  const canReportFailure = useCanPerform([
    "PRODUCTION_SUPERVISOR",
    "MAINTENANCE_MANAGER",
    "ADMIN",
  ]);

  // material requisition form
  const [reqForm, setReqForm] = useState({
    itemId: "",
    quantity: 1,
    purpose: "",
  });

  // spare part request form
  const [spareForm, setSpareForm] = useState({
    equipmentName: "",
    description: "",
    priority: "MEDIUM",
  });

  // finished product transfer form
  const [finishForm, setFinishForm] = useState({
    itemId: "",
    quantity: 1,
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [itemsRes, alertsRes, reqRes, notifRes] = await Promise.allSettled(
        [
          api.get("/inventory/items?limit=200"),
          api.get("/inventory/alerts"),
          api.get("/inventory/requisitions"),
          api.get("/notifications"),
        ],
      );
      if (itemsRes.status === "fulfilled")
        setItems(itemsRes.value.data?.data || itemsRes.value.data || []);
      if (alertsRes.status === "fulfilled")
        setAlerts(alertsRes.value.data || []);
      if (reqRes.status === "fulfilled")
        setRequisitions(reqRes.value.data || []);
      if (notifRes.status === "fulfilled")
        setNotifications(notifRes.value.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handleRequestMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/inventory/requisitions", {
        itemId: reqForm.itemId,
        quantity: Number(reqForm.quantity),
        purpose: reqForm.purpose,
      });
      toast.success("Material requisition submitted");
      setReqForm({ itemId: "", quantity: 1, purpose: "" });
      void loadAll();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to submit requisition",
      );
    }
  };

  const handleSparePart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/maintenance/failures", {
        equipmentName: spareForm.equipmentName,
        description: spareForm.description,
        priority: spareForm.priority,
      });
      toast.success("Machine failure reported");
      setSpareForm({ equipmentName: "", description: "", priority: "MEDIUM" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to report");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      void loadAll();
    } catch {
      // ignore
    }
  };

  const allowed =
    !!user &&
    (user.roles.includes("PRODUCTION_SUPERVISOR") ||
      user.roles.includes("ADMIN"));

  if (!user) return null;
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
          <p className="mt-2 text-slate-600">
            Only Production Supervisors and Admins can use this page.
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
              Production Workspace
            </p>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">
              Production Supervisor Hub
            </h1>
            <p className="text-slate-500 mt-3 max-w-2xl">
              Manage materials, spare parts, finished products, and machine
              failures for your production lines.
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
                {t.id === "notifications" && notifications.filter((n) => !n.read).length > 0 ? (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {tab === "materials" && (
            canRequestMaterial ? (
            <form
              onSubmit={handleRequestMaterial}
              className="rounded border bg-white p-6 space-y-3"
            >
              <h3 className="font-bold text-slate-900">Request Materials</h3>
              <select
                value={reqForm.itemId}
                onChange={(e) =>
                  setReqForm({ ...reqForm, itemId: e.target.value })
                }
                className="input w-full"
                required
              >
                <option value="">Pick material…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.quantity} {i.unit || ""} on hand)
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={reqForm.quantity}
                onChange={(e) =>
                  setReqForm({ ...reqForm, quantity: Number(e.target.value) })
                }
                className="input w-full"
                placeholder="Quantity"
                required
              />
              <input
                value={reqForm.purpose}
                onChange={(e) =>
                  setReqForm({ ...reqForm, purpose: e.target.value })
                }
                className="input w-full"
                placeholder="Purpose (e.g. For order #1234)"
              />
              <button className="btn btn-primary w-full" type="submit">
                Submit Requisition
              </button>
            </form>
            ) : (
              <div className="rounded border bg-white p-6 text-sm text-slate-500">
                Your role can view inventory but cannot submit material requisitions.
              </div>
            )
          )}

          {tab === "requisitions" && (
            <div className="rounded border bg-white p-6">
              <h3 className="font-bold text-slate-900 mb-3">
                My Requisitions ({requisitions.length})
              </h3>
              {loading ? (
                <div className="text-slate-500 text-sm">Loading…</div>
              ) : requisitions.length === 0 ? (
                <div className="text-slate-500 text-sm">
                  No requisitions yet.
                </div>
              ) : (
                <ul className="divide-y">
                  {requisitions.map((r) => (
                    <li
                      key={r.id}
                      className="py-2 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold">
                          {r.item?.name || r.itemId}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.quantity} {r.item?.unit || ""} · {r.purpose} ·{" "}
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
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
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "spares" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {canReportFailure ? (
              <form
                onSubmit={handleSparePart}
                className="rounded border bg-white p-6 space-y-3"
              >
                <h3 className="font-bold text-slate-900">
                  Report Machine Failure
                </h3>
                <input
                  value={spareForm.equipmentName}
                  onChange={(e) =>
                    setSpareForm({
                      ...spareForm,
                      equipmentName: e.target.value,
                    })
                  }
                  className="input w-full"
                  placeholder="Equipment (e.g. Sewing Machine #5)"
                  required
                />
                <textarea
                  value={spareForm.description}
                  onChange={(e) =>
                    setSpareForm({
                      ...spareForm,
                      description: e.target.value,
                    })
                  }
                  className="input w-full"
                  rows={3}
                  placeholder="Describe the failure"
                  required
                />
                <select
                  value={spareForm.priority}
                  onChange={(e) =>
                    setSpareForm({ ...spareForm, priority: e.target.value })
                  }
                  className="input w-full"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
                <button className="btn btn-primary w-full" type="submit">
                  Report to Maintenance
                </button>
              </form>
              ) : (
                <div className="rounded border bg-white p-6 text-sm text-slate-500">
                  Your role can view spare parts but cannot report new failures.
                </div>
              )}

              <div className="rounded border bg-white p-6">
                <h3 className="font-bold text-slate-900 mb-3">
                  Maintenance Tips
                </h3>
                <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
                  <li>
                    Critical/COMPLEX equipment → flag as <b>CRITICAL</b>.
                  </li>
                  <li>
                    Spare parts will be issued from inventory; you'll get a
                    notification when approved.
                  </li>
                  <li>
                    For ongoing issues, attach the order ID in the description.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {tab === "monitor" && (
            <div className="rounded border bg-white p-6">
              <h3 className="font-bold text-slate-900 mb-3">
                Critical Spare-Part Availability
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Items at or below minimum stock.
              </p>
              {alerts.length === 0 ? (
                <div className="text-slate-500 text-sm">
                  No items below threshold.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2">Item</th>
                      <th className="py-2">On hand</th>
                      <th className="py-2">Min</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="py-2 font-bold">{a.name}</td>
                        <td className="py-2">
                          {a.quantity} {a.unit || ""}
                        </td>
                        <td className="py-2">{a.minStockLevel ?? 0}</td>
                        <td className="py-2">
                          <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-700 px-2 py-1 rounded">
                            Critical
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "outputs" && (
            <div className="rounded border bg-white p-6">
              <h3 className="font-bold text-slate-900 mb-3">
                Record Finished Products
              </h3>
              <p className="text-sm text-slate-500 mb-3">
                Submit completed output to inventory. Use the existing{" "}
                <code>POST /production/:id/output</code> endpoint from the order
                detail page.
              </p>
              <a
                href="/production"
                className="inline-block bg-indigo-600 text-white font-bold rounded-2xl px-4 py-2 text-sm"
              >
                Go to Production Orders
              </a>
            </div>
          )}

          {tab === "notifications" && (
            <div className="rounded border bg-white p-6">
              <h3 className="font-bold text-slate-900 mb-3">My Notifications</h3>
              {notifications.length === 0 ? (
                <div className="text-slate-500 text-sm">No notifications.</div>
              ) : (
                <ul className="divide-y">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className="py-2 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div
                          className={`text-sm ${
                            n.read ? "text-slate-500" : "font-bold text-slate-900"
                          }`}
                        >
                          {n.message}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.id)}
                          className="text-xs text-indigo-600 font-bold"
                        >
                          Mark read
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
