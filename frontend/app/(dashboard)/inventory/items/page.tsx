"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";
import {
  inventoryApi,
  type InventoryCategory,
  type InventoryItem,
} from "@/lib/api/inventory";
import {
  Badge,
  Button,
  Input,
  Select,
  Table,
} from "@/components/modules/inventory/ui";
import { RestockModal } from "@/components/modules/inventory/RestockModal";
import { IssueStockModal } from "@/components/modules/inventory/IssueStockModal";
import { CreateItemModal } from "@/components/modules/inventory/CreateItemModal";
import { EditItemModal } from "@/components/modules/inventory/EditItemModal";
import { TransactionHistoryModal } from "@/components/modules/inventory/TransactionHistoryModal";

const categories: Array<"ALL" | InventoryCategory> = [
  "ALL",
  "RAW_MATERIAL",
  "SPARE_PART",
  "ACCESSORY",
  "FINISHED_GOOD",
];

function hasRole(roles: string[] | undefined, allowed: string[]) {
  return Boolean(roles?.some((role) => allowed.includes(role)));
}

function categoryBadgeVariant(category: InventoryCategory) {
  switch (category) {
    case "RAW_MATERIAL":
      return "blue";
    case "SPARE_PART":
      return "amber";
    case "ACCESSORY":
      return "teal";
    case "FINISHED_GOOD":
      return "green";
  }
}

function StatusBadge({ item }: { item: InventoryItem }) {
  const lowStock = item.quantity <= item.minThreshold;
  return (
    <Badge variant={lowStock ? "red" : "green"}>
      {lowStock ? "Low Stock" : "In Stock"}
    </Badge>
  );
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debounced;
}

export default function InventoryItemsPage() {
  const { user } = useAuth();
  const { contentOffset, isDesktop } = useSidebar();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"ALL" | InventoryCategory>("ALL");
  const [page, setPage] = useState(1);
  const [restockOpen, setRestockOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(
    undefined,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | undefined>(undefined);

  const debouncedSearch = useDebouncedValue(search, 300);
  const canRestockOrIssue = hasRole(user?.roles, ["STOREKEEPER", "ADMIN"]);
  const canCreate = hasRole(user?.roles, ["STOREKEEPER", "ADMIN"]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["inventory-items", debouncedSearch, category, page],
    queryFn: () =>
      inventoryApi.getItems({
        category: category === "ALL" ? undefined : category,
        search: debouncedSearch || undefined,
        page,
        limit: 20,
      }),
  });

  const alertsQuery = useQuery({
    queryKey: ["inventory-alerts"],
    queryFn: () => inventoryApi.getAlerts(),
  });

  const summaryQuery = useQuery({
    queryKey: ["inventory-summary"],
    queryFn: () => inventoryApi.getSummary(),
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  const items = data?.data ?? [];
  const lowStockCount = useMemo(() => {
    if (alertsQuery.data?.alerts) return alertsQuery.data.alerts.length;
    return items.filter((item) => item.quantity <= item.minThreshold).length;
  }, [items, alertsQuery.data]);

  const categoriesAtRisk = useMemo(() => {
    const set = new Set<string>();
    (alertsQuery.data?.alerts ?? []).forEach((a) => set.add(a.category));
    return set.size;
  }, [alertsQuery.data]);

  const refreshInventory = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) => String(query.queryKey[0]).startsWith("inventory"),
    });
  };

  // Note: +/- buttons open the existing Restock / Issue modals so the user
  // can enter the amount to add or remove. Those modals accept a
  // `preselectedItemId` prop which we set via `openRestock` / `openIssue`.
  <TransactionHistoryModal
    isOpen={txOpen}
    onClose={() => setTxOpen(false)}
    itemId={selectedItemId}
  />;

  const openRestock = (itemId?: string) => {
    setSelectedItemId(itemId);
    setRestockOpen(true);
  };

  const openIssue = (itemId?: string) => {
    setSelectedItemId(itemId);
    setIssueOpen(true);
  };

  const openHistory = (itemId?: string) => {
    setSelectedItemId(itemId);
    setTxOpen(true);
  };

  const openEdit = (itemId?: string) => {
    setEditItemId(itemId);
    setEditOpen(true);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-slate-900" />
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
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-indigo-600">
                Inventory Control
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                Inventory Items
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
                Track raw materials, spare parts, accessories, and finished
                goods in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {canRestockOrIssue ? (
                <Button onClick={() => openRestock()}>Restock</Button>
              ) : null}
              {canRestockOrIssue ? (
                <Button variant="secondary" onClick={() => openIssue()}>
                  Issue Stock
                </Button>
              ) : null}
              {canCreate ? (
                <Button variant="secondary" onClick={() => setCreateOpen(true)}>
                  Add Item
                </Button>
              ) : null}
            </div>
          </div>

          {lowStockCount > 0 ? (
            <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              ⚠ {lowStockCount} items below minimum threshold
            </div>
          ) : null}

          <div className="mb-6 grid gap-4 lg:grid-cols-[1.5fr_0.8fr_0.8fr]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or SKU"
            />
            <Select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as typeof category)
              }
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All" : option}
                </option>
              ))}
            </Select>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              <span>{isFetching ? "Refreshing..." : "Live data"}</span>
              <span>{data?.total ?? 0} total</span>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-4xl border p-4 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Total Items
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {data?.total ?? 0}
              </p>
            </div>
            <div className="rounded-4xl border p-4 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Low Stock
              </p>
              <p className="mt-2 text-2xl font-black text-rose-700">
                {lowStockCount}
              </p>
            </div>
            <div className="rounded-4xl border p-4 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Categories At Risk
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {categoriesAtRisk}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            <div className="hidden md:block">
              <Table>
                <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-4">SKU</th>
                    <th className="px-4 py-4">Name</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Quantity</th>
                    <th className="px-4 py-4">Unit</th>
                    <th className="px-4 py-4">Min Threshold</th>
                    <th className="px-4 py-4">Location</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="animate-pulse">
                          {Array.from({ length: 9 }).map((__, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-4">
                              <div className="h-4 rounded bg-slate-100" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : null}

                  {!isLoading && items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-16 text-center text-sm font-medium text-slate-500"
                      >
                        No inventory items found.
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading
                    ? items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-4 font-semibold text-slate-900">
                            {item.sku}
                          </td>
                          <td className="px-4 py-4">{item.name}</td>
                          <td className="px-4 py-4">
                            <Badge
                              variant={categoryBadgeVariant(item.category)}
                            >
                              {item.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4">{item.unit}</td>
                          <td className="px-4 py-4">{item.minThreshold}</td>
                          <td className="px-4 py-4">{item.location || "—"}</td>
                          <td className="px-4 py-4">
                            <StatusBadge item={item} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {canRestockOrIssue ? (
                                  <>
                                    <button
                                      onClick={() => openRestock(item.id)}
                                      className="h-8 w-8 rounded-md bg-slate-100 text-sm font-bold"
                                      title="Add amount"
                                      aria-label={`Add amount to ${item.name}`}
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => openIssue(item.id)}
                                      className="h-8 w-8 rounded-md bg-slate-100 text-sm font-bold"
                                      title="Remove amount"
                                      aria-label={`Remove amount from ${item.name}`}
                                    >
                                      −
                                    </button>
                                  </>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {canRestockOrIssue ? (
                                  <Button
                                    variant="secondary"
                                    onClick={() => openRestock(item.id)}
                                  >
                                    Restock
                                  </Button>
                                ) : null}
                                {canRestockOrIssue ? (
                                  <Button
                                    variant="ghost"
                                    onClick={() => openIssue(item.id)}
                                  >
                                    Issue
                                  </Button>
                                ) : null}
                                {canCreate ? (
                                  <Button
                                    variant="ghost"
                                    onClick={() => openEdit(item.id)}
                                  >
                                    Edit
                                  </Button>
                                ) : null}
                                <Button
                                  variant="ghost"
                                  onClick={() => openHistory(item.id)}
                                >
                                  History
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden bg-white dark:bg-slate-800">
              <div className="divide-y divide-slate-100">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="animate-pulse p-4">
                        <div className="h-6 w-3/5 rounded bg-slate-100" />
                        <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
                      </div>
                    ))
                  : null}

                {!isLoading && items.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    No inventory items found.
                  </div>
                ) : null}

                {!isLoading
                  ? items.map((item) => (
                      <div key={item.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-black text-slate-900">
                              {item.name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.sku}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-slate-900">
                              {item.quantity}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.unit}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {canRestockOrIssue ? (
                              <>
                                <button
                                  onClick={() => openRestock(item.id)}
                                  className="h-8 w-8 rounded-md bg-slate-100 text-sm font-bold"
                                  title="Add amount"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => openIssue(item.id)}
                                  className="h-8 w-8 rounded-md bg-slate-100 text-sm font-bold"
                                  title="Remove amount"
                                >
                                  −
                                </button>
                              </>
                            ) : null}
                            <Badge
                              variant={categoryBadgeVariant(item.category)}
                            >
                              {item.category}
                            </Badge>
                          </div>

                          <div className="flex gap-2">
                            {canRestockOrIssue ? (
                              <Button
                                variant="secondary"
                                onClick={() => openRestock(item.id)}
                              >
                                Restock
                              </Button>
                            ) : null}
                            {canRestockOrIssue ? (
                              <Button
                                variant="ghost"
                                onClick={() => openIssue(item.id)}
                              >
                                Issue
                              </Button>
                            ) : null}
                            {canCreate ? (
                              <Button
                                variant="ghost"
                                onClick={() => openEdit(item.id)}
                              >
                                Edit
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            </div>
          </div>

          {data ? (
            <div className="mt-6 flex flex-col gap-4 rounded-4xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-600">
                Showing page <span className="text-slate-900">{data.page}</span>{" "}
                of <span className="text-slate-900">{data.totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setPage((current) => Math.min(data.totalPages, current + 1))
                  }
                  disabled={page >= data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <RestockModal
        isOpen={restockOpen}
        onClose={() => setRestockOpen(false)}
        onSuccess={refreshInventory}
        preselectedItemId={selectedItemId}
      />
      <IssueStockModal
        isOpen={issueOpen}
        onClose={() => setIssueOpen(false)}
        onSuccess={refreshInventory}
      />
      <CreateItemModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refreshInventory}
      />
      <EditItemModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        itemId={editItemId}
        onSuccess={refreshInventory}
      />
    </div>
  );
}
