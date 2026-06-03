"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  Clock,
  Package,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";
import {
  inventoryApi,
  type AlertItem,
} from "@/lib/api/inventory";
import { Badge, Button } from "@/components/modules/inventory/ui";
import { RestockModal } from "@/components/modules/inventory/RestockModal";

function hasRole(roles: string[] | undefined, allowed: string[]) {
  if (!roles?.length) return false;
  if (roles.includes("ADMIN")) return true;
  return Boolean(roles.some((role) => allowed.includes(role)));
}

function categoryLabel(category: string) {
  return category.replace(/_/g, " ");
}

function transactionBadgeVariant(type: string) {
  switch (type) {
    case "RESTOCK":
      return "green";
    case "ISSUE":
      return "amber";
    case "ADJUSTMENT":
      return "blue";
    case "RETURN":
      return "teal";
    default:
      return "slate";
  }
}

export default function InventoryDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { contentOffset, isDesktop } = useSidebar();
  const [restockOpen, setRestockOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();

  const canView = hasRole(user?.roles, [
    "STOREKEEPER",
    "MANAGER",
    "PRODUCTION_MANAGER",
    "ADMIN",
  ]);

  const canWrite = hasRole(user?.roles, ["STOREKEEPER", "ADMIN"]);

  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, []);

  const itemsQuery = useQuery({
    queryKey: ["inventory-dashboard-items"],
    queryFn: () => inventoryApi.getItems({ page: 1, limit: 1 }),
    enabled: canView,
  });

  const alertsQuery = useQuery({
    queryKey: ["inventory-dashboard-alerts"],
    queryFn: () => inventoryApi.getAlerts(),
    enabled: canView,
  });

  const summaryQuery = useQuery({
    queryKey: ["inventory-dashboard-summary"],
    queryFn: () => inventoryApi.getSummary(),
    enabled: canView,
  });

  const valuationQuery = useQuery({
    queryKey: ["inventory-dashboard-valuation"],
    queryFn: () => inventoryApi.getValuation(),
    enabled: canView,
  });

  const agingQuery = useQuery({
    queryKey: ["inventory-dashboard-aging"],
    queryFn: () => inventoryApi.getAging(),
    enabled: canView,
  });

  const consumptionQuery = useQuery({
    queryKey: ["inventory-dashboard-consumption"],
    queryFn: () => inventoryApi.getConsumption(30),
    enabled: canView,
  });

  const todayTransactionsQuery = useQuery({
    queryKey: [
      "inventory-dashboard-today-transactions",
      todayRange.startDate,
      todayRange.endDate,
    ],
    queryFn: () =>
      inventoryApi.getTransactions({
        startDate: todayRange.startDate,
        endDate: todayRange.endDate,
        page: 1,
        limit: 100,
      }),
    enabled: canView,
  });

  const recentTransactionsQuery = useQuery({
    queryKey: ["inventory-dashboard-recent-transactions"],
    queryFn: () => inventoryApi.getTransactions({ page: 1, limit: 8 }),
    enabled: canView,
  });

  const refreshInventory = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) => String(query.queryKey[0]).startsWith("inventory"),
    });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <Navbar />
        <main className="mx-auto max-w-2xl p-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <h1 className="text-2xl font-bold text-rose-800">
              Inventory access restricted
            </h1>
            <p className="mt-3 text-sm text-rose-700">
              Your role does not have access to inventory management.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const totalItems = itemsQuery.data?.total ?? 0;
  const lowStockAlerts = alertsQuery.data?.alerts ?? [];
  const lowStockItems = lowStockAlerts.length;
  const categoriesAtRisk = new Set(lowStockAlerts.map((item) => item.category))
    .size;
  const totalTransactionsToday = todayTransactionsQuery.data?.total ?? 0;
  const summary = summaryQuery.data ?? [];
  const recentTransactions = recentTransactionsQuery.data?.data ?? [];
  const chartData = summary.map((item) => ({
    category: categoryLabel(item.category),
    totalItems: item.totalItems,
  }));

  const openRestock = (itemId: string) => {
    setSelectedItemId(itemId);
    setRestockOpen(true);
  };

  const isRefreshing =
    itemsQuery.isFetching ||
    alertsQuery.isFetching ||
    summaryQuery.isFetching;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white pt-20 md:pt-16"
      style={isDesktop ? { paddingLeft: contentOffset } : undefined}
    >
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl shadow-emerald-200/40 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
                Inventory Control
              </p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
                Stock intelligence center
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-emerald-50 sm:text-base">
                Monitor quantities, stock risk, transaction activity, and
                category balance — all in one operational view.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/inventory/items">
                <Button
                  variant="secondary"
                  className="border-white/30 bg-white/15 text-white hover:bg-white/25"
                >
                  <Package className="mr-2 h-4 w-4" />
                  View all items
                </Button>
              </Link>
              {canWrite ? (
                <Button
                  className="bg-white text-emerald-700 hover:bg-emerald-50"
                  onClick={() => {
                    setSelectedItemId(undefined);
                    setRestockOpen(true);
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Quick restock
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        {/* KPI row */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={<Boxes className="h-5 w-5" />}
            title="Total items"
            value={String(totalItems)}
            hint="SKUs tracked in inventory"
            loading={itemsQuery.isLoading}
          />
          <KpiCard
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Low stock alerts"
            value={String(lowStockItems)}
            hint="At or below minimum threshold"
            loading={alertsQuery.isLoading}
            variant={lowStockItems > 0 ? "danger" : "default"}
          />
          <KpiCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Categories at risk"
            value={String(categoriesAtRisk)}
            hint="Categories with low-stock items"
            loading={alertsQuery.isLoading}
            variant={categoriesAtRisk > 0 ? "warning" : "default"}
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Transactions today"
            value={String(totalTransactionsToday)}
            hint="Restocks, issues, and adjustments"
            loading={todayTransactionsQuery.isLoading}
          />
        </section>

        {/* Low stock alerts */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Low stock alerts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Items that need attention before production is affected.
              </p>
            </div>
            {isRefreshing ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Updating…
              </span>
            ) : null}
          </div>

          {alertsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : lowStockAlerts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {lowStockAlerts.map((item) => (
                <AlertCard
                  key={item.id}
                  item={item}
                  onRestock={() => openRestock(item.id)}
                  canRestock={canWrite}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Package className="h-7 w-7" />
              </div>
              <p className="mt-4 font-semibold text-emerald-800">
                All stock levels are healthy
              </p>
              <p className="mt-1 text-sm text-emerald-600">
                No items are currently below their minimum threshold.
              </p>
            </div>
          )}
        </section>

        {/* Chart + recent transactions */}
        <section className="grid gap-6 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-3">
            <h2 className="text-lg font-bold text-slate-900">
              Items by category
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Distribution of inventory across material types.
            </p>
            <div className="mt-6 h-64 sm:h-72">
              {summaryQuery.isLoading ? (
                <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
                  Loading chart…
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
                  No category data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={32}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Bar
                      dataKey="totalItems"
                      fill="#059669"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent activity
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Latest inventory movements.
                </p>
              </div>
              <Link
                href="/inventory/items"
                className="hidden text-xs font-semibold text-indigo-600 hover:text-indigo-700 sm:inline-flex sm:items-center sm:gap-1"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentTransactionsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No recent transactions
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {tx.item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {tx.performedBy.username}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant={transactionBadgeVariant(tx.type)}>
                        {tx.type}
                      </Badge>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {tx.quantity}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Analytics trio */}
        <section className="grid gap-4 lg:grid-cols-3">
          <InsightCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            title="Top inventory value"
            description="Highest total value items in stock"
            loading={valuationQuery.isLoading}
            empty="No valuation data"
            rows={
              valuationQuery.data?.slice(0, 5).map((v) => ({
                id: v.id,
                primary: v.name,
                secondary: v.sku,
                value: v.totalValue.toFixed(2),
                meta: `${v.quantity} units`,
              })) ?? []
            }
          />
          <InsightCard
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            title="Stock aging"
            description="Weighted average age of inventory"
            loading={agingQuery.isLoading}
            empty="No aging data"
            rows={
              agingQuery.data?.slice(0, 5).map((a) => ({
                id: a.id,
                primary: a.name,
                secondary: a.sku,
                value: `${Math.round(a.weightedAverageAgeDays)}d`,
                meta: `${a.quantity} units`,
              })) ?? []
            }
          />
          <InsightCard
            icon={<TrendingDown className="h-5 w-5 text-rose-600" />}
            title="Consumption (30 days)"
            description="Most issued items this month"
            loading={consumptionQuery.isLoading}
            empty="No consumption data"
            rows={
              consumptionQuery.data?.slice(0, 5).map((c) => ({
                id: c.itemId,
                primary: c.name,
                secondary: c.sku,
                value: String(c.issued),
                meta: `${c.dailyRate.toFixed(1)}/day`,
              })) ?? []
            }
          />
        </section>
      </div>

      <RestockModal
        isOpen={restockOpen}
        onClose={() => setRestockOpen(false)}
        onSuccess={refreshInventory}
        preselectedItemId={selectedItemId}
      />
    </div>
  );
}

function KpiCard({
  icon,
  title,
  value,
  hint,
  loading,
  variant = "default",
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  hint: string;
  loading?: boolean;
  variant?: "default" | "danger" | "warning";
}) {
  const styles = {
    default: "border-slate-200 bg-white",
    danger: "border-rose-200 bg-rose-50/80",
    warning: "border-amber-200 bg-amber-50/80",
  };
  const valueStyles = {
    default: "text-slate-900",
    danger: "text-rose-700",
    warning: "text-amber-700",
  };

  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${styles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            variant === "danger"
              ? "bg-rose-100 text-rose-600"
              : variant === "warning"
                ? "bg-amber-100 text-amber-600"
                : "bg-emerald-100 text-emerald-600"
          }`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </p>
      {loading ? (
        <div className="mt-2 h-9 w-16 animate-pulse rounded-lg bg-slate-200" />
      ) : (
        <p className={`mt-1 text-3xl font-bold ${valueStyles[variant]}`}>
          {value}
        </p>
      )}
      <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
    </article>
  );
}

function AlertCard({
  item,
  onRestock,
  canRestock,
}: {
  item: AlertItem;
  onRestock: () => void;
  canRestock: boolean;
}) {
  const pct =
    item.minThreshold > 0
      ? Math.min(100, Math.round((item.quantity / item.minThreshold) * 100))
      : 0;
  const critical = item.severity === "critical";

  return (
    <article
      className={`rounded-2xl border p-4 transition hover:shadow-md ${
        critical
          ? "border-rose-200 bg-gradient-to-br from-rose-50 to-white"
          : "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-900">{item.name}</h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {item.sku}
          </p>
        </div>
        <Badge variant={critical ? "red" : "amber"}>{item.severity}</Badge>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-slate-600">Stock level</span>
          <span className="font-bold text-slate-900">
            {item.quantity} / {item.minThreshold} {item.unit}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className={`h-full rounded-full transition-all ${
              critical ? "bg-rose-500" : "bg-amber-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {pct}% of minimum threshold
        </p>
      </div>

      {canRestock ? (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={onRestock}
            className="bg-slate-900 hover:bg-slate-800"
          >
            Restock now
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function InsightCard({
  icon,
  title,
  description,
  rows,
  loading,
  empty,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  rows: Array<{
    id: string;
    primary: string;
    secondary: string;
    value: string;
    meta: string;
  }>;
  loading?: boolean;
  empty: string;
}) {
  const max = Math.max(...rows.map((r) => parseFloat(r.value) || 0), 1);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))
        ) : rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">{empty}</p>
        ) : (
          rows.map((row) => {
            const num = parseFloat(row.value) || 0;
            return (
              <div key={row.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {row.primary}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {row.secondary}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-900">{row.value}</p>
                    <p className="text-xs text-slate-400">{row.meta}</p>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(num / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}
