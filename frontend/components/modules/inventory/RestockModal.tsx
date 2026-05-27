'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryApi, type InventoryItem } from '@/lib/api/inventory';
import { Badge, Button, Dialog, Input, Textarea } from './ui';

const schema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  note: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function RestockModal({ isOpen, onClose, onSuccess, preselectedItemId }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; preselectedItemId?: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { itemId: '', quantity: 1, note: '' },
  });

  const { data } = useQuery({
    queryKey: ['inventory-restock-items'],
    queryFn: () => inventoryApi.getItems({ page: 1, limit: 1000 }),
    enabled: isOpen,
  });

  const items = data?.data ?? [];
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term));
  }, [items, search]);

  const selectedItemId = watch('itemId');
  const quantity = watch('quantity');
  const selectedItem = filteredItems.find((item) => item.id === selectedItemId) || items.find((item) => item.id === selectedItemId);

  const restockMutation = useMutation({
    mutationFn: (payload: FormOutput) => inventoryApi.restock(payload),
    onSuccess: async (response) => {
      toast.success(`Restocked. New quantity: ${response.item.quantity} ${response.item.unit}`);
      await queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('inventory') });
      onSuccess();
      reset({ itemId: preselectedItemId ?? '', quantity: 1, note: '' });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Restock failed');
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ itemId: '', quantity: 1, note: '' });
      setSearch('');
      return;
    }

    if (preselectedItemId) {
      setValue('itemId', preselectedItemId);
    }
  }, [isOpen, preselectedItemId, reset, setValue]);

  const projectedQuantity = selectedItem ? selectedItem.quantity + Number(quantity || 0) : null;

  const submit = handleSubmit((values) => restockMutation.mutate(values));

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Restock Inventory" description="Record incoming stock against an existing inventory item.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Search Item</label>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by SKU or name" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Item</label>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            {...register('itemId')}
          >
            <option value="">Select item</option>
            {filteredItems.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.sku}] {item.name} — {item.quantity} {item.unit} in stock
              </option>
            ))}
          </select>
          {errors.itemId ? <p className="mt-1 text-xs font-medium text-rose-600">{errors.itemId.message}</p> : null}
        </div>

        {selectedItem ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">Current stock: {selectedItem.quantity} {selectedItem.unit}</p>
                <p className="mt-1 text-xs text-slate-500">Threshold: {selectedItem.minThreshold} {selectedItem.unit}</p>
              </div>
              <Badge variant={selectedItem.quantity <= selectedItem.minThreshold ? 'amber' : 'green'}>
                {selectedItem.quantity <= selectedItem.minThreshold ? 'Low stock' : 'Healthy'}
              </Badge>
            </div>
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Quantity</label>
          <Input type="number" step="0.01" min="0" {...register('quantity')} />
          {errors.quantity ? <p className="mt-1 text-xs font-medium text-rose-600">{errors.quantity.message}</p> : null}
          {selectedItem && projectedQuantity !== null ? (
            <p className="mt-2 text-xs font-medium text-slate-500">
              Stock will increase to {projectedQuantity} {selectedItem.unit}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Note</label>
          <Textarea {...register('note')} placeholder="Optional batch, supplier, or received date notes" />
        </div>

        {restockMutation.error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {String((restockMutation.error as any)?.response?.data?.message || (restockMutation.error as any)?.message || 'Failed to restock')}
          </p>
        ) : null}

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-white pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={restockMutation.isPending || !selectedItem}>Save Restock</Button>
        </div>
      </form>
    </Dialog>
  );
}