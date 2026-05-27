'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { inventoryApi, type InventoryCategory, type InventoryItem } from '@/lib/api/inventory';
import { Badge, Button, Input, Select, Table } from '@/components/modules/inventory/ui';
import { RestockModal } from '@/components/modules/inventory/RestockModal';
import { IssueStockModal } from '@/components/modules/inventory/IssueStockModal';
import { CreateItemModal } from '@/components/modules/inventory/CreateItemModal';

const categories: Array<'ALL' | InventoryCategory> = ['ALL', 'RAW_MATERIAL', 'SPARE_PART', 'ACCESSORY', 'FINISHED_GOOD'];

function hasRole(roles: string[] | undefined, allowed: string[]) {
  return Boolean(roles?.some((role) => allowed.includes(role)));
}

function categoryBadgeVariant(category: InventoryCategory) {
  switch (category) {
    case 'RAW_MATERIAL':
      return 'blue';
    case 'SPARE_PART':
      return 'amber';
    case 'ACCESSORY':
      return 'teal';
    case 'FINISHED_GOOD':
      return 'green';
  }
}

function StatusBadge({ item }: { item: InventoryItem }) {
  const lowStock = item.quantity <= item.minThreshold;
  return <Badge variant={lowStock ? 'red' : 'green'}>{lowStock ? 'Low Stock' : 'In Stock'}</Badge>;
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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'ALL' | InventoryCategory>('ALL');
  const [page, setPage] = useState(1);
  const [restockOpen, setRestockOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);

  const debouncedSearch = useDebouncedValue(search, 300);
  const canRestockOrIssue = hasRole(user?.roles, ['STOREKEEPER']);
  const canCreate = hasRole(user?.roles, ['STOREKEEPER', 'ADMIN']);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['inventory-items', debouncedSearch, category, page],
    queryFn: () => inventoryApi.getItems({ category: category === 'ALL' ? undefined : category, search: debouncedSearch || undefined, page, limit: 20 }),
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  const items = data?.data ?? [];
  const lowStockCount = useMemo(() => items.filter((item) => item.quantity <= item.minThreshold).length, [items]);

  const refreshInventory = async () => {
    await queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('inventory') });
  };

  const openRestock = (itemId?: string) => {
    setSelectedItemId(itemId);
    setRestockOpen(true);
  };

  const openIssue = (itemId?: string) => {
    setSelectedItemId(itemId);
    setIssueOpen(true);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-600">Inventory Control</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Inventory Items</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">Track raw materials, spare parts, accessories, and finished goods in one place.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canRestockOrIssue ? <Button onClick={() => openRestock()}>Restock</Button> : null}
            {canRestockOrIssue ? <Button variant="secondary" onClick={() => openIssue()}>Issue Stock</Button> : null}
            {canCreate ? <Button variant="secondary" onClick={() => setCreateOpen(true)}>Add Item</Button> : null}
          </div>
        </div>

        {lowStockCount > 0 ? (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            ⚠ {lowStockCount} items below minimum threshold
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.5fr_0.8fr_0.8fr]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or SKU" />
          <Select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
            {categories.map((option) => <option key={option} value={option}>{option === 'ALL' ? 'All' : option}</option>)}
          </Select>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
            <span>{isFetching ? 'Refreshing...' : 'Live data'}</span>
            <span>{data?.total ?? 0} total</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
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
              {isLoading ? Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  {Array.from({ length: 9 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-4"><div className="h-4 rounded bg-slate-100" /></td>
                  ))}
                </tr>
              )) : null}

              {!isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm font-medium text-slate-500">No inventory items found.</td>
                </tr>
              ) : null}

              {!isLoading ? items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-4 font-semibold text-slate-900">{item.sku}</td>
                  <td className="px-4 py-4">{item.name}</td>
                  <td className="px-4 py-4"><Badge variant={categoryBadgeVariant(item.category)}>{item.category}</Badge></td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{item.quantity}</td>
                  <td className="px-4 py-4">{item.unit}</td>
                  <td className="px-4 py-4">{item.minThreshold}</td>
                  <td className="px-4 py-4">{item.location || '—'}</td>
                  <td className="px-4 py-4"><StatusBadge item={item} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {canRestockOrIssue ? <Button variant="secondary" onClick={() => openRestock(item.id)}>Restock</Button> : null}
                      {canRestockOrIssue ? <Button variant="ghost" onClick={() => openIssue(item.id)}>Issue</Button> : null}
                    </div>
                  </td>
                </tr>
              )) : null}
            </tbody>
          </Table>
        </div>

        {data ? (
          <div className="mt-6 flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-600">
              Showing page <span className="text-slate-900">{data.page}</span> of <span className="text-slate-900">{data.totalPages}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Previous</Button>
              <Button variant="secondary" onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))} disabled={page >= data.totalPages}>Next</Button>
            </div>
          </div>
        ) : null}
      </main>

      <RestockModal isOpen={restockOpen} onClose={() => setRestockOpen(false)} onSuccess={refreshInventory} preselectedItemId={selectedItemId} />
      <IssueStockModal isOpen={issueOpen} onClose={() => setIssueOpen(false)} onSuccess={refreshInventory} />
      <CreateItemModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSuccess={refreshInventory} />
    </div>
  );
}