'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { maintenanceApi, type MaintenanceTask } from '@/lib/api/maintenance';
import { Badge, Button, Dialog, Input, Select } from './ui';

const schema = z.object({
  assignedToId: z.string().min(1, 'Select a technician'),
});

type FormValues = z.infer<typeof schema>;

type TechnicianOption = {
  id: string;
  username: string;
  position: string;
  email?: string;
};

function normalizeTechnician(worker: any): TechnicianOption | null {
  const profile = worker?.workerProfile ?? worker;
  const user = profile?.user ?? worker?.user;
  const username = user?.username ?? worker?.username;
  const position = profile?.position ?? worker?.position ?? 'Technician';

  if (!worker?.id || !username) return null;

  return { id: worker.id, username, position, email: user?.email };
}

async function fetchTechnicians() {
  const endpoints = ['/maintenance/technicians', '/hr/workers'];

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      const payload = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
      return payload.map(normalizeTechnician).filter(Boolean) as TechnicianOption[];
    } catch {
      continue;
    }
  }

  return [];
}

export function AssignTaskModal({
  isOpen,
  onClose,
  onSuccess,
  task,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: MaintenanceTask | null;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const techniciansQuery = useQuery({
    queryKey: ['maintenance-technicians'],
    queryFn: fetchTechnicians,
    enabled: isOpen,
  });

  const technicians = useMemo(() => {
    const items = techniciansQuery.data ?? [];
    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter((item) => `${item.username} ${item.position} ${item.email ?? ''}`.toLowerCase().includes(term));
  }, [search, techniciansQuery.data]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { assignedToId: '' },
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ assignedToId: '' });
      setSearch('');
    }
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (payload: FormValues) => maintenanceApi.assignTask(task?.id ?? '', payload),
    onSuccess: async () => {
      toast.success('Task assigned successfully');
      await queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('maintenance') });
      await queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('inventory') });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to assign task');
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));

  if (!task) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Assign Maintenance Task" description="Choose the technician who should handle this work order.">
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-900">{task.equipmentName}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={task.type === 'PREVENTIVE' ? 'blue' : 'amber'}>{task.type}</Badge>
            <Badge variant={task.priority === 'CRITICAL' ? 'red' : 'slate'}>{task.priority}</Badge>
            <Badge variant={task.status === 'OPEN' ? 'amber' : 'blue'}>{task.status}</Badge>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Search Technicians</label>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by username or position" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Assign To</label>
          <Select {...register('assignedToId')}>
            <option value="">Select technician</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.username} — {technician.position}
              </option>
            ))}
          </Select>
          {errors.assignedToId ? <p className="mt-1 text-xs font-medium text-rose-600">{errors.assignedToId.message}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>Assign Task</Button>
        </div>
      </form>
    </Dialog>
  );
}