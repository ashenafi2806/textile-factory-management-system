"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  inventoryApi,
  type AlertItem,
  type InventoryCategory,
} from "@/lib/api/inventory";
import {
  Badge,
  Button,
  Table,
} from "@/components/modules/inventory/ui";
import { RestockModal } from "@/components/modules/inventory/RestockModal";
import { useAuth } from "@/context/auth-context";
import { useCanPerform } from "@/hooks/useCanPerform";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";

const REORDER_CATEGORIES: { value: InventoryCategory; label: string }[] = [
  { value: "SPARE_PART", label: "Machine spare parts" },
  { value: "RAW_MATERIAL", label: "Raw materials" },
  { value: "ACCESSORY", label: "Accessories" },
  { value: "FINISHED_GOOD", label: "Finished goods" },
];

export default function StorekeeperReorderAlertsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { contentOffset, isDesktop } = useSidebar();
  const [category, setCategory] = useState<InventoryCategory>("SPARE_PART");
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<string | undefined>();

  const canView = useCanPerform([
    "STOREKEEPER",
    "MANAGER",
    "PRODUCTION_MANAGER",
    "MAINTENANCE_MANAGER",
    "ADMIN",
  ]);
  const canAct = useCanPerform(["STOREKEEPER", "ADMIN"]);

  const alertsQuery = useQuery({
    queryKey: ["storekeeper-reorder-alerts", category],
    queryFn: () => inventoryApi.getAlerts({ category }),
    enabled: canView,
    refetchInterval: 30000,
  });

  const alerts: AlertItem[] = useMemo(
    () => alertsQuery.data?.alerts ?? [],
    [alertsQuery.data],
  );
  const criticalCount = useMemo(
    () => alerts.filter((a) => a.severity === "critical").length,
    [alerts],
  );

  const openRestock = (itemId: string) => {
    setRestockTarget(itemId);
    setRestockOpen(true);
  };

  const downloadCsv = async () => {
    try {
      const res = await api.get("/inventory/alerts/export", {
        params: { category },
        responseType: "text",
      });
      const text = typeof res.data === "string" ? res.data : String(res.data ?? "");
      const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reorder-alerts-${category}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({
      predicate: (q) =>
        String(q.queryKey[0]).startsWith("storekeeper") ||
        String(q.queryKey[0]).startsWith("inventory"),
    });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-slate-900" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8">
            <h1 className="text-3xl font-black tracking-tight text-rose-800">
              Access Denied
            </h1>
            <p className="mt-2 text-sm font-medium text-rose-700">
              Reorder alerts are restricted to storekeepers, production
              managers, maintenance managers, and admins.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <main
        style={
          isDesktop
            ? {
                marginLeft: contentOffset,
                width: `calc(100% - ${contentOffset}px)`,
              }
            : undefined
        }
        className="w-full px-4 pt-20 md:pt-24 pb-8 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-indigo-600">
                Reorder Alerts
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                Stock below minimum threshold
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
                Track machine spare parts and other inventory categories that
                are at or below their minimum thresholds. The system suggests a
                reorder quantity so the resulting stock lands comfortably above
                the threshold.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={refresh}>
                Refresh
              </Button>
              <Button variant="secondary" onClick={downloadCsv}>
                Export CSV
              </Button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {REORDER_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[.18em] transition-colors ${
                  category === c.value
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <section className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              title="Items below threshold"
              value={String(alerts.length)}
            />
            <KpiCard
              title="Out of stock"
              value={String(criticalCount)}
              accent={criticalCount > 0 ? "red" : "slate"}
            />
            <KpiCard
              title="Total suggested reorder"
              value={String(
                alerts.reduce(
                  (acc, a) =>
                    acc + (a.suggestedReorderQuantity ?? a.shortage),
                  0,
                ),
              )}
              accent="indigo"
            />
          </section>

          <section className="mt-8 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            {alertsQuery.isLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-3xl bg-slate-100"
                  />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50 px-6 py-10 text-center text-sm font-medium text-emerald-700">
                All {category.replace("_", " ").toLowerCase()} items are above
                their minimum threshold. Nothing to reorder right now.
              </div>
            ) : (
              <Table>
                <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">On Hand</th>
                    <th className="px-4 py-3">Threshold</th>
                    <th className="px-4 py-3">Shortage</th>
                    <th className="px-4 py-3">Suggested Reorder</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {alerts.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.sku}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-slate-600">
                          {item.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-rose-600">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        {item.minThreshold} {item.unit}
                      </td>
                      <td className="px-4 py-3 font-semibold text-rose-600">
                        {item.shortage} {item.unit}
                      </td>
                      <td className="px-4 py-3 font-bold text-indigo-600">
                        {item.suggestedReorderQuantity ?? item.shortage}{" "}
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {item.supplier || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            item.severity === "critical" ? "red" : "amber"
                          }
                        >
                          {item.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canAct ? (
                          <Button onClick={() => openRestock(item.id)}>
                            Reorder
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Read only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </section>
        </div>
      </main>

      <RestockModal
        isOpen={restockOpen}
        onClose={() => setRestockOpen(false)}
        onSuccess={refresh}
        preselectedItemId={restockTarget}
      />
    </div>
  );
}

function KpiCard({
  title,
  value,
  accent = "slate",
}: {
  title: string;
  value: string;
  accent?: "slate" | "red" | "indigo";
}) {
  const styles: Record<string, string> = {
    slate: "border-slate-200 bg-white text-slate-900",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };
  return (
    <div className={`rounded-[2rem] border p-6 shadow-sm ${styles[accent]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-70">
        {title}
      </p>
      <p className="mt-3 text-4xl font-black tracking-tight">{value}</p>
    </div>
  );
}
