'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/auth-context';
import { maintenanceApi, type MaintenanceTask } from '@/lib/api/maintenance';
import { Badge, Button, Card, Select, Table } from '@/components/modules/maintenance/ui';
import { AssignTaskModal } from '@/components/modules/maintenance/AssignTaskModal';
import { CreateTaskModal } from '@/components/modules/maintenance/CreateTaskModal';
import { TaskDetailsModal } from '@/components/modules/maintenance/TaskDetailsModal';

function hasRole(roles: string[] | undefined, allowed: string[]) {
  return Boolean(roles?.some((role) => allowed.includes(role)));
}

function formatMinutes(minutes: number) {
  const total = Math.max(0, Math.round(minutes || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${mins}m`;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

function badgeVariantForType(type: string) {
  return type === 'PREVENTIVE' ? 'blue' : 'amber';
}

function badgeVariantForPriority(priority: string) {
  return priority === 'CRITICAL' ? 'red' : 'slate';
}

function badgeVariantForStatus(status: string) {
  switch (status) {
    case 'OPEN':
      return 'amber';
    case 'IN_PROGRESS':
      return 'blue';
    case 'COMPLETED':
      return 'green';
    default:
      return 'slate';
  }
}

export default function MaintenanceDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);

  const canManage = hasRole(user?.roles, ['MAINTENANCE_MANAGER', 'ADMIN']);

  const analyticsQuery = useQuery({
    queryKey: ['maintenance-analytics'],
    queryFn: () => maintenanceApi.getAnalytics(),
    enabled: canManage,
  });

  const tasksQuery = useQuery({
    queryKey: ['maintenance-tasks', page, status, type, priority],
    queryFn: () => maintenanceApi.getTasks({
      page,
      limit: 10,
      status: (status || undefined) as any,
      type: (type || undefined) as any,
      priority: (priority || undefined) as any,
    }),
    enabled: canManage,
  });

  const failureReports = useMemo(() => (tasksQuery.data?.data ?? []).filter((task) => task.failureReport).slice(0, 5), [tasksQuery.data?.data]);

  const openCount = analyticsQuery.data?.byStatus.find((item) => item.status === 'OPEN')?.count ?? 0;
  const inProgressCount = analyticsQuery.data?.byStatus.find((item) => item.status === 'IN_PROGRESS')?.count ?? 0;
  const criticalCount = analyticsQuery.data?.byPriority.find((item) => item.priority === 'CRITICAL')?.count ?? 0;
  const avgCompletion = formatMinutes(analyticsQuery.data?.avgCompletionMins ?? 0);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-slate-900" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Maintenance access restricted</h1>
            <p className="mt-3 text-sm font-medium text-slate-500">Your role does not have access to the maintenance dashboard.</p>
          </div>
        </main>
      </div>
    );
  }

  const tasks = tasksQuery.data?.data ?? [];
  const totalPages = tasksQuery.data?.totalPages ?? 1;

  const refreshMaintenance = async () => {
    await queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('maintenance') });
  };

  const openAssign = (task: MaintenanceTask) => {
    setSelectedTask(task);
    setAssignOpen(true);
  };

  const openDetails = (task: MaintenanceTask) => {
    setSelectedTask(task);
    setDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-600">Maintenance Dashboard</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Equipment Care Command Center</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">Track maintenance workload, open issues, task progress, and failure response in one operational view.</p>
          </div>
          {canManage ? <Button onClick={() => setCreateOpen(true)}>Schedule Task</Button> : null}
        </div>

        <section className="grid gap-4 lg:grid-cols-4">
          <KpiCard title="Open Tasks" value={String(openCount)} accent={openCount > 0 ? 'amber' : 'slate'} />
          <KpiCard title="In Progress" value={String(inProgressCount)} />
          <KpiCard title="Critical Issues" value={String(criticalCount)} accent={criticalCount > 0 ? 'red' : 'slate'} />
          <KpiCard title="Avg Completion Time" value={avgCompletion} />
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Maintenance Tasks</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Review work orders, assignments, and completion progress.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </Select>
              <Select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
                <option value="">All Types</option>
                <option value="PREVENTIVE">PREVENTIVE</option>
                <option value="CORRECTIVE">CORRECTIVE</option>
              </Select>
              <Select value={priority} onChange={(event) => { setPriority(event.target.value); setPage(1); }}>
                <option value="">All Priorities</option>
                <option value="NORMAL">NORMAL</option>
                <option value="CRITICAL">CRITICAL</option>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
            <Table>
              <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Scheduled</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {tasksQuery.isLoading ? Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-4"><div className="h-4 rounded bg-slate-100" /></td>
                    ))}
                  </tr>
                )) : null}

                {!tasksQuery.isLoading && tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm font-medium text-slate-500">No maintenance tasks found</td>
                  </tr>
                ) : null}

                {!tasksQuery.isLoading ? tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{task.equipmentName}</div>
                      <div className="text-xs text-slate-500">{task.description}</div>
                    </td>
                    <td className="px-4 py-4"><Badge variant={badgeVariantForType(task.type)}>{task.type}</Badge></td>
                    <td className="px-4 py-4"><Badge variant={badgeVariantForPriority(task.priority)}>{task.priority}</Badge></td>
                    <td className="px-4 py-4"><Badge variant={badgeVariantForStatus(task.status)}>{task.status}</Badge></td>
                    <td className="px-4 py-4 font-medium text-slate-700">{task.assignedTo?.user?.username ?? 'Unassigned'}</td>
                    <td className="px-4 py-4 font-medium text-slate-700">{formatDate(task.scheduledDate)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {task.status === 'OPEN' && canManage ? <Button variant="secondary" onClick={() => openAssign(task)}>Assign</Button> : null}
                        <Button variant="ghost" onClick={() => openDetails(task)}>View</Button>
                      </div>
                    </td>
                  </tr>
                )) : null}
              </tbody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">Page {tasksQuery.data?.page ?? 1} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1 || tasksQuery.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
              <Button variant="secondary" disabled={page >= totalPages || tasksQuery.isFetching} onClick={() => setPage((current) => current + 1)}>Next</Button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Failure Reports</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Recent machine failure reports that spawned corrective work.</p>

            <div className="mt-6 grid gap-4">
              {failureReports.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm font-medium text-slate-500">No failure reports found</div>
              ) : failureReports.map((task) => (
                <div key={task.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-slate-900">{task.failureReport?.equipmentName ?? task.equipmentName}</h3>
                      <p className="mt-2 text-sm font-medium text-slate-600">{task.failureReport?.description ?? task.description}</p>
                    </div>
                    <Badge variant={badgeVariantForPriority(task.failureReport?.priority ?? task.priority)}>{task.failureReport?.priority ?? task.priority}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                    <span>Reported by {task.reportedBy?.username ?? 'Unknown'}</span>
                    <span>•</span>
                    <span>{formatDate(task.failureReport?.createdAt ?? task.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Operational Notes</h2>
            <div className="mt-4 space-y-4 text-sm font-medium text-slate-600">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">Open tasks turn amber when work is waiting.</div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">Critical issues should be addressed first to avoid production downtime.</div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">Completion deducts spare parts from stock and records an inventory issue transaction.</div>
            </div>
          </Card>
        </section>
      </main>

      <CreateTaskModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSuccess={refreshMaintenance} />
      <AssignTaskModal isOpen={assignOpen} onClose={() => setAssignOpen(false)} onSuccess={refreshMaintenance} task={selectedTask} />
      <TaskDetailsModal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} task={selectedTask} />
    </div>
  );
}

function KpiCard({ title, value, accent = 'slate' }: { title: string; value: string; accent?: 'slate' | 'red' | 'amber' }) {
  const accentStyles = {
    slate: 'border-slate-200 bg-white text-slate-900',
    red: 'border-rose-200 bg-rose-50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return (
    <Card className={`p-6 ${accentStyles[accent]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-70">{title}</p>
      <p className="mt-3 text-4xl font-black tracking-tight">{value}</p>
    </Card>
  );
}