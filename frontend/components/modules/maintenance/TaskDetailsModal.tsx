'use client';

import { type MaintenanceTask } from '@/lib/api/maintenance';
import { Badge, Button, Dialog } from './ui';

function dateLabel(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not set';
}

export function TaskDetailsModal({
  isOpen,
  onClose,
  task,
}: {
  isOpen: boolean;
  onClose: () => void;
  task: MaintenanceTask | null;
}) {
  if (!task) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Maintenance Task Details" description="Review the task summary, assignment, and completion records.">
      <div className="space-y-5">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <div className="text-xl font-black tracking-tight text-slate-900">{task.equipmentName}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={task.type === 'PREVENTIVE' ? 'blue' : 'amber'}>{task.type}</Badge>
            <Badge variant={task.priority === 'CRITICAL' ? 'red' : 'slate'}>{task.priority}</Badge>
            <Badge variant={task.status === 'OPEN' ? 'amber' : task.status === 'IN_PROGRESS' ? 'blue' : task.status === 'COMPLETED' ? 'green' : 'slate'}>{task.status}</Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoBlock label="Assigned To" value={task.assignedTo?.user?.username ?? 'Unassigned'} />
          <InfoBlock label="Reported By" value={task.reportedBy?.username ?? 'Unknown'} />
          <InfoBlock label="Scheduled" value={dateLabel(task.scheduledDate)} />
          <InfoBlock label="Completed" value={dateLabel(task.completedAt)} />
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-slate-700">Description</div>
          <p className="rounded-[1.25rem] border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">{task.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoBlock label="Time Spent" value={task.timeSpentMins != null ? `${task.timeSpentMins} mins` : 'Not completed'} />
          <InfoBlock label="Notes" value={task.notes || 'No notes provided'} />
        </div>

        {task.spareParts.length > 0 ? (
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">Spare Parts Used</div>
            <div className="space-y-2">
              {task.spareParts.map((sparePart) => (
                <div key={sparePart.id} className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm">
                  <div>
                    <div className="font-bold text-slate-900">{sparePart.item.name}</div>
                    <div className="text-xs text-slate-500">{sparePart.item.unit}</div>
                  </div>
                  <div className="font-bold text-slate-700">{sparePart.quantityUsed}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {task.failureReport ? <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Failure report linked to this task.</div> : null}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Dialog>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}