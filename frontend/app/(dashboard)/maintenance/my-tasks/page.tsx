"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { maintenanceApi, type MaintenanceTask } from "@/lib/api/maintenance";
import { Badge, Button, Card } from "@/components/modules/maintenance/ui";
import { CompleteTaskModal } from "@/components/modules/maintenance/CompleteTaskModal";
import { RequestSparePartsModal } from "@/components/modules/maintenance/RequestSparePartsModal";
import toast from "react-hot-toast";

function hasRole(roles: string[] | undefined, allowed: string[]) {
  if (!roles?.length) return false;
  if (roles.includes("ADMIN")) return true;
  return Boolean(roles.some((role) => allowed.includes(role)));
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
  switch (status) {
    case "OPEN":
      return "amber";
    case "IN_PROGRESS":
      return "blue";
    case "PENDING_COMPLETION":
      return "amber";
    case "COMPLETED":
      return "green";
    default:
      return "slate";
  }
}

function TaskCard({
  task,
  onStart,
  onComplete,
  onRequestParts,
  starting,
}: {
  task: MaintenanceTask;
  onStart?: () => void;
  onComplete?: () => void;
  onRequestParts?: () => void;
  starting?: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {task.equipmentName}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={badgeVariantForType(task.type)}>{task.type}</Badge>
              <Badge variant={badgeVariantForPriority(task.priority)}>
                {task.priority}
              </Badge>
              <Badge variant={badgeVariantForStatus(task.status)}>
                {task.status}
              </Badge>
            </div>
          </div>
          <p className="max-w-3xl text-sm font-medium leading-6 text-slate-600">
            {task.description}
          </p>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
            {task.scheduledDate ? (
              <span>Scheduled: {formatDate(task.scheduledDate)}</span>
            ) : null}
            {task.completedAt ? (
              <span>Completed: {formatDate(task.completedAt)}</span>
            ) : null}
            {task.timeSpentMins != null ? (
              <span>Time: {task.timeSpentMins} mins</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 md:min-w-44">
          {task.status === "OPEN" && onStart ? (
            <Button onClick={onStart} disabled={starting}>
              Start work
            </Button>
          ) : null}
          {task.status === "IN_PROGRESS" && onRequestParts ? (
            <Button variant="secondary" onClick={onRequestParts}>
              Request materials
            </Button>
          ) : null}
          {task.status === "IN_PROGRESS" && onComplete ? (
            <Button onClick={onComplete}>Submit completion</Button>
          ) : null}
          {task.status === "PENDING_COMPLETION" ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800">
              Awaiting manager approval
            </p>
          ) : null}
        </div>
      </div>

      {task.failureReport ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          Corrective work from failure report — reported by{" "}
          {task.reportedBy?.username ?? "supervisor"}
        </div>
      ) : null}

      {(task.spareParts ?? []).length > 0 ? (
        <div className="mt-4 text-xs font-semibold text-slate-500">
          Parts logged: {(task.spareParts ?? [])
            .map((p) => `${p.item?.name ?? "Item"} × ${p.quantityUsed}`)
            .join(", ")}
        </div>
      ) : null}
    </Card>
  );
}

export default function MaintenanceMyTasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"active" | "history">("active");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [partsOpen, setPartsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);

  const canView = hasRole(user?.roles, ["MAINTENANCE_TECHNICIAN", "ADMIN"]);
  const isManagerOnly =
    hasRole(user?.roles, ["MAINTENANCE_MANAGER"]) &&
    !hasRole(user?.roles, ["MAINTENANCE_TECHNICIAN", "ADMIN"]);

  const activeQuery = useQuery({
    queryKey: ["maintenance-my-tasks"],
    queryFn: () => maintenanceApi.getMyTasks(),
    enabled: canView && tab === "active",
  });

  const historyQuery = useQuery({
    queryKey: ["maintenance-my-tasks-history"],
    queryFn: () => maintenanceApi.getMyTaskHistory(),
    enabled: canView && tab === "history",
  });

  const startMutation = useMutation({
    mutationFn: (taskId: string) => maintenanceApi.startTask(taskId),
    onSuccess: async () => {
      toast.success("Work started");
      await queryClient.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("maintenance"),
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cannot start task yet");
    },
  });

  const activeTasks = useMemo(() => {
    const items = activeQuery.data ?? [];
    return [...items].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === "CRITICAL" ? -1 : 1;
      }
      const left = a.scheduledDate
        ? new Date(a.scheduledDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      const right = b.scheduledDate
        ? new Date(b.scheduledDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      return left - right;
    });
  }, [activeQuery.data]);

  const historyTasks = historyQuery.data ?? [];

  useEffect(() => {
    if (user && isManagerOnly) {
      router.replace("/maintenance");
    }
  }, [user, isManagerOnly, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-slate-900" />
      </div>
    );
  }

  if (isManagerOnly) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">Redirecting to manager dashboard…</p>
      </main>
    );
  }

  if (!canView) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-4xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">Access restricted</h1>
          <p className="mt-3 text-sm text-slate-500">
            This page is for maintenance technicians only.
          </p>
        </div>
      </main>
    );
  }

  const refresh = async () => {
    await queryClient.invalidateQueries({
      predicate: (q) => String(q.queryKey[0]).startsWith("maintenance"),
    });
  };

  const tasks = tab === "active" ? activeTasks : historyTasks;
  const loading = tab === "active" ? activeQuery.isLoading : historyQuery.isLoading;
  const error = tab === "active" ? activeQuery.error : historyQuery.error;

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-600">
            Maintenance Technician
          </p>
          <h1 className="mt-2 text-4xl font-black text-slate-900">
            My Tasks
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Scheduled preventive work appears on its due date. Start work,
            request materials, then submit completion for manager approval.
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              tab === "active"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Active ({activeTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              tab === "history"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            History ({historyTasks.length})
          </button>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {(error as { response?: { status?: number } })?.response?.status ===
            404
              ? "No worker profile linked to your account. Ask HR to set up your technician profile."
              : (error as Error).message || "Failed to load tasks"}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-4xl bg-white shadow-sm"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-black text-slate-900">
              {tab === "active"
                ? "No active tasks assigned"
                : "No completed work yet"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {tab === "active"
                ? "Preventive tasks show up on their scheduled date. Corrective tasks appear after the manager assigns you."
                : "Completed tasks will appear here after your manager approves them."}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                starting={startMutation.isPending}
                onStart={
                  tab === "active" && task.status === "OPEN"
                    ? () => startMutation.mutate(task.id)
                    : undefined
                }
                onRequestParts={
                  tab === "active" && task.status === "IN_PROGRESS"
                    ? () => {
                        setSelectedTask(task);
                        setPartsOpen(true);
                      }
                    : undefined
                }
                onComplete={
                  tab === "active" && task.status === "IN_PROGRESS"
                    ? () => {
                        setSelectedTask(task);
                        setCompleteOpen(true);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </main>

      <CompleteTaskModal
        isOpen={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onSuccess={refresh}
        task={selectedTask}
      />
      <RequestSparePartsModal
        isOpen={partsOpen}
        onClose={() => setPartsOpen(false)}
        onSuccess={refresh}
        task={selectedTask}
      />
    </>
  );
}
