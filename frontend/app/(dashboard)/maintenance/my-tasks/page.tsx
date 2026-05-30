"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/auth-context";
import { maintenanceApi, type MaintenanceTask } from "@/lib/api/maintenance";
import { Badge, Button, Card } from "@/components/modules/maintenance/ui";
import { CompleteTaskModal } from "@/components/modules/maintenance/CompleteTaskModal";

function hasRole(roles: string[] | undefined, allowed: string[]) {
  return Boolean(roles?.some((role) => allowed.includes(role)));
}

function formatDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}

function badgeVariantForType(type: string) {
  return type === "PREVENTIVE" ? "blue" : "amber";
}

function badgeVariantForPriority(priority: string) {
  return priority === "CRITICAL" ? "red" : "slate";
}

function badgeVariantForStatus(status: string) {
  return status === "OPEN" ? "amber" : "blue";
}

export default function MaintenanceMyTasksPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(
    null,
  );

  const canView = hasRole(user?.roles, ["MAINTENANCE_TECHNICIAN"]);

  const tasksQuery = useQuery({
    queryKey: ["maintenance-my-tasks"],
    queryFn: () => maintenanceApi.getMyTasks(),
    enabled: canView,
  });

  const tasks = useMemo(() => {
    const items = tasksQuery.data ?? [];
    return [...items].sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority === "CRITICAL" ? -1 : 1;
      }

      const leftDate = left.scheduledDate
        ? new Date(left.scheduledDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      const rightDate = right.scheduledDate
        ? new Date(right.scheduledDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    });
  }, [tasksQuery.data]);

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
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-4xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Technician access restricted
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-500">
              This view is available to maintenance technicians only.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const refreshMaintenance = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) => String(query.queryKey[0]).startsWith("maintenance"),
    });
  };

  const openComplete = (task: MaintenanceTask) => {
    setSelectedTask(task);
    setCompleteOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-600">
            My Maintenance Tasks
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
            Technician Workbench
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Complete the tasks assigned to you and record the parts you used.
          </p>
        </div>

        {tasksQuery.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-4xl bg-white shadow-sm"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              No tasks assigned to you currently
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Check back later or ask a maintenance manager to assign work.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card key={task.id} className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900">
                        {task.equipmentName}
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant={badgeVariantForType(task.type)}>
                          {task.type}
                        </Badge>
                        <Badge variant={badgeVariantForPriority(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant={badgeVariantForStatus(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="max-w-3xl text-sm leading-6 font-medium text-slate-600">
                      {task.description}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                      {task.scheduledDate ? (
                        <span>Scheduled: {formatDate(task.scheduledDate)}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch gap-3 md:min-w-44 md:items-end">
                    <Button onClick={() => openComplete(task)}>
                      Complete Task
                    </Button>
                  </div>
                </div>

                {task.failureReport ? (
                  <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    Machine failure report — reported by{" "}
                    {task.reportedBy?.username ?? "Unknown"}
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </main>

      <CompleteTaskModal
        isOpen={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onSuccess={refreshMaintenance}
        task={selectedTask}
      />
    </div>
  );
}
