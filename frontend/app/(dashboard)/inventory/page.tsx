"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
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
  type CategorySummary,
  type TransactionWithDetails,
} from "@/lib/api/inventory";
import { Badge, Button, Table } from "@/components/modules/inventory/ui";
import { RestockModal } from "@/components/modules/inventory/RestockModal";

function hasRole(roles: string[] | undefined, allowed: string[]) {
  return Boolean(roles?.some((role) => allowed.includes(role)));
}

function categoryBadgeVariant(category: string) {
  switch (category) {
    case "RAW_MATERIAL":
      return "blue";
    case "SPARE_PART":
      return "amber";
    case "ACCESSORY":
      return "teal";
    case "FINISHED_GOOD":
      return "green";
    default:
      return "slate";
  }
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
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(
    undefined,
  );

  const [isDark, setIsDark] = useState(false);

  const canView = hasRole(user?.roles, [
    "STOREKEEPER",
    "MANAGER",
    "PRODUCTION_MANAGER",
    "ADMIN",
  ]);

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

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark")),
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
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
    queryFn: () => inventoryApi.getTransactions({ page: 1, limit: 10 }),
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
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-slate-900" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Inventory access restricted
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-500">
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
    category: item.category,
    totalItems: item.totalItems,
  }));

  const openRestock = (itemId: string) => {
    setSelectedItemId(itemId);
    setRestockOpen(true);
  };

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
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-indigo-600">
                Inventory Dashboard
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                Stock Intelligence Center
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
                Monitor quantities, stock risk, transaction activity, and
                category balance in one operational view.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/inventory/items">
                <Button variant="secondary">View Items</Button>
              </Link>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total Items" value={String(totalItems)} />
            <KpiCard
              title="Low Stock Items"
              value={String(lowStockItems)}
              accent={lowStockItems > 0 ? "red" : "slate"}
            />
            <KpiCard
              title="Categories at Risk"
              value={String(categoriesAtRisk)}
              accent={categoriesAtRisk > 0 ? "amber" : "slate"}
            />
            <KpiCard
              title="Transactions Today"
              value={String(totalTransactionsToday)}
            />
          </section>

          <section className="mt-8 rounded-4xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Low Stock Alerts
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Items that are at or below the minimum threshold.
                </p>
              </div>
            </div>

            {alertsQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-40 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-700"
                  />
                ))}
              </div>
            ) : lowStockAlerts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {lowStockAlerts.map((item) => (
                  <AlertCard
                    key={item.id}
                    item={item}
                    onRestock={() => openRestock(item.id)}
                  />
                ))}
              </div>
              : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 px-6 py-10 text-center text-sm font-medium text-slate-500">
                All stock levels are healthy
              </div>
            )}
          </section>

          <section className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-4xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Category Summary
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Number of items per inventory category.
              </p>
              <div className="mt-6 h-56 md:h-80">
                {summaryQuery.isLoading ? (
                  <div className="flex h-full items-center justify-center rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-500">
                    Loading chart...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="category"
                        tick={{ fontSize: 12, fill: "#475569" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "#475569" }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="totalItems"
                        fill="#0f172a"
                        radius={[12, 12, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-4xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Recent Transactions
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Latest activity across inventory operations.
              </p>

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                <div className="hidden md:block">
                  <Table>
                    <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Performed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {recentTransactionsQuery.isLoading
                        ? Array.from({ length: 5 }).map((_, index) => (
                            <tr key={index} className="animate-pulse">
                              {Array.from({ length: 5 }).map(
                                (__, cellIndex) => (
                                  <td key={cellIndex} className="px-4 py-3">
                                    <div className="h-4 rounded bg-slate-100" />
                                  </td>
                                ),
                              )}
                            </tr>
                          ))
                        : null}
                      {!recentTransactionsQuery.isLoading &&
                      recentTransactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-10 text-center text-sm font-medium text-slate-500"
                          >
                            No recent transactions
                          </td>
                        </tr>
                      ) : null}
                      {!recentTransactionsQuery.isLoading
                        ? recentTransactions.map((transaction) => (
                            <tr
                              key={transaction.id}
                              className="hover:bg-slate-50/80"
                            >
                              <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                                {new Date(
                                  transaction.createdAt,
                                ).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">
                                  {transaction.item.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {transaction.item.sku}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={transactionBadgeVariant(
                                    transaction.type,
                                  )}
                                >
                                  {transaction.type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {transaction.quantity}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-700">
                                {transaction.performedBy.username}
                              </td>
                            </tr>
                          ))
                        : null}
                    </tbody>
                  </Table>
                </div>

                {/* Mobile transaction cards */}
                <div className="md:hidden divide-y divide-slate-100 bg-white dark:bg-slate-800">
                  {recentTransactionsQuery.isLoading
                    ? Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="animate-pulse p-4">
                          <div className="h-4 w-3/5 rounded bg-slate-100 dark:bg-slate-700" />
                          <div className="mt-2 h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-700" />
                        </div>
                      ))
                    : null}

                  {!recentTransactionsQuery.isLoading &&
                  recentTransactions.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      No recent transactions
                    </div>
                  ) : null}

                  {!recentTransactionsQuery.isLoading
                    ? recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-xs text-slate-500">
                                {new Date(
                                  transaction.createdAt,
                                ).toLocaleString()}
                              </div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {transaction.item.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {transaction.item.sku}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={transactionBadgeVariant(
                                  transaction.type,
                                )}
                              >
                                {transaction.type}
                              </Badge>
                              <div className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">
                                {transaction.quantity}
                              </div>
                              <div className="text-xs text-slate-500">
                                {transaction.performedBy.username}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white dark:bg-slate-800 p-4">
              <h3 className="text-lg font-black">Top Inventory Value</h3>
              <p className="mt-1 text-sm text-slate-500">
                Highest total value items
              </p>
              <div className="mt-4 space-y-3">
                {valuationQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded bg-slate-100"
                    />
                  ))
                ) : valuationQuery.data && valuationQuery.data.length > 0 ? (
                  valuationQuery.data.slice(0, 5).map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {v.name}
                        </div>
                        <div className="text-xs text-slate-500">{v.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {v.totalValue.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {v.quantity} {v.quantity === 1 ? "unit" : "units"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">
                    No valuation data
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white dark:bg-slate-800 p-4">
              <h3 className="text-lg font-black">Aging (days)</h3>
              <p className="mt-1 text-sm text-slate-500">
                Weighted average age of stock
              </p>
              <div className="mt-4 space-y-3">
                {agingQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded bg-slate-100"
                    />
                  ))
                ) : agingQuery.data && agingQuery.data.length > 0 ? (
                  agingQuery.data.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {a.name}
                        </div>
                        <div className="text-xs text-slate-500">{a.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {Math.round(a.weightedAverageAgeDays)}d
                        </div>
                        <div className="text-xs text-slate-500">
                          {a.quantity} units
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No aging data</div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white dark:bg-slate-800 p-4">
              <h3 className="text-lg font-black">Consumption (30d)</h3>
              <p className="mt-1 text-sm text-slate-500">
                Most consumed items (30 days)
              </p>
              <div className="mt-4 space-y-3">
                {consumptionQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded bg-slate-100"
                    />
                  ))
                ) : consumptionQuery.data &&
                  consumptionQuery.data.length > 0 ? (
                  consumptionQuery.data.slice(0, 5).map((c) => (
                    <div
                      key={c.itemId}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {c.name}
                        </div>
                        <div className="text-xs text-slate-500">{c.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{c.issued}</div>
                        <div className="text-xs text-slate-500">
                          {c.dailyRate.toFixed(2)}/day
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">
                    No consumption data
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

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
  title,
  value,
  accent = "slate",
}: {
  title: string;
  value: string;
  accent?: "slate" | "red" | "amber";
}) {
  const accentStyles = {
    slate: "border-slate-200 bg-white text-slate-900",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div
      className={`rounded-[2rem] border p-6 shadow-sm ${accentStyles[accent]}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-70">
        {title}
      </p>
      <p className="mt-3 text-4xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function AlertCard({
  item,
  onRestock,
}: {
  item: AlertItem;
  onRestock: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900">
            {item.name}
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {item.sku}
          </p>
        </div>
        <Badge variant={item.severity === "critical" ? "red" : "amber"}>
          {item.severity}
        </Badge>
      </div>
      <div className="mt-4 text-sm font-semibold text-slate-700">
        {item.quantity} / {item.minThreshold} {item.unit}
      </div>
      <div className="mt-5 flex items-center justify-end">
        <Button onClick={onRestock}>Restock</Button>
      </div>
    </div>
  );
}
