'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryApi } from '@/lib/api/inventory';
import { Badge, Button, Dialog, Input, Select, Textarea } from './ui';

const schema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  referenceType: z.enum(['Production Order', 'Maintenance Task', 'Other']),
  referenceId: z.string().optional().or(z.literal('')),
  note: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function IssueStockModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { register, handleSubmit, reset, watch, setError, clearErrors, formState: { errors } } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { itemId: '', quantity: 1, referenceType: 'Production Order', referenceId: '', note: '' },
  });

  const { data } = useQuery({
    queryKey: ['inventory-issue-items'],
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

  useEffect(() => {
    if (!selectedItem) {
      clearErrors('quantity');
      return;
    }

    if (Number(quantity || 0) > selectedItem.quantity) {
      setError('quantity', { type: 'manual', message: `Only ${selectedItem.quantity} ${selectedItem.unit} available` });
    } else {
      clearErrors('quantity');
    }
  }, [clearErrors, quantity, selectedItem, setError]);

  useEffect(() => {
    if (!isOpen) {
      reset({ itemId: '', quantity: 1, referenceType: 'Production Order', referenceId: '', note: '' });
      setSearch('');
    }
  }, [isOpen, reset]);

  const issueMutation = useMutation({
    mutationFn: (payload: { itemId: string; quantity: number; referenceId?: string; note?: string }) => inventoryApi.issue(payload),
    onSuccess: async (response) => {
      toast.success('Stock issued');
      if (response.alert === 'LOW_STOCK') {
        toast('Item now below minimum threshold', { icon: '⚠️' });
      }
      await queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('inventory') });
      onSuccess();
      reset({ itemId: '', quantity: 1, referenceType: 'Production Order', referenceId: '', note: '' });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Issue stock failed');
    },
  });

  const projectedQuantity = selectedItem ? selectedItem.quantity - Number(quantity || 0) : null;
  const belowThreshold = Boolean(selectedItem && projectedQuantity !== null && projectedQuantity <= selectedItem.minThreshold && projectedQuantity >= 0);
  const isOverAvailable = Boolean(selectedItem && Number(quantity || 0) > selectedItem.quantity);

  const submit = handleSubmit((values) => {
    const noteParts = [] as string[];
    if (values.referenceType && values.referenceType !== 'Other') {
      noteParts.push(`Reference Type: ${values.referenceType}`);
    }
    if (values.note?.trim()) {
      noteParts.push(values.note.trim());
    }

    issueMutation.mutate({
      itemId: values.itemId,
      quantity: values.quantity,
      referenceId: values.referenceId?.trim() || undefined,
      note: noteParts.length ? noteParts.join('\n') : undefined,
    });
  });

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Issue Stock" description="Record material leaving inventory for production or maintenance.">
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">Current stock: {selectedItem.quantity} {selectedItem.unit}</p>
                <p className="mt-1 text-xs text-slate-500">Threshold: {selectedItem.minThreshold} {selectedItem.unit}</p>
              </div>
              <Badge variant={selectedItem.quantity > selectedItem.minThreshold ? 'green' : selectedItem.quantity > 0 ? 'amber' : 'red'}>
                {selectedItem.quantity > selectedItem.minThreshold ? `Available: ${selectedItem.quantity} ${selectedItem.unit}` : selectedItem.quantity > 0 ? `Low stock: ${selectedItem.quantity} ${selectedItem.unit} (below threshold)` : 'Out of stock'}
              </Badge>
            </div>
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Quantity</label>
          <Input type="number" step="0.01" min="0" {...register('quantity')} />
          {errors.quantity ? <p className="mt-1 text-xs font-medium text-rose-600">{errors.quantity.message}</p> : null}
          {belowThreshold ? <p className="mt-2 text-xs font-medium text-amber-700">Will go below minimum threshold</p> : null}
          {selectedItem && projectedQuantity !== null ? <p className="mt-2 text-xs font-medium text-slate-500">Remaining stock after issue: {projectedQuantity} {selectedItem.unit}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Reference Type</label>
          <Select {...register('referenceType')}>
            <option value="Production Order">Production Order</option>
            <option value="Maintenance Task">Maintenance Task</option>
            <option value="Other">Other</option>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Reference ID</label>
          <Input {...register('referenceId')} placeholder="Optional reference number" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Note</label>
          <Textarea {...register('note')} placeholder="Optional note" />
        </div>

        {issueMutation.error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {String((issueMutation.error as any)?.response?.data?.message || (issueMutation.error as any)?.message || 'Issue stock failed')}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={issueMutation.isPending || isOverAvailable || !selectedItem}>Issue Stock</Button>
        </div>
      </form>
    </Dialog>
  );
}