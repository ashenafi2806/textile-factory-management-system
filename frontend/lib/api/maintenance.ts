import api from "./client";

export type MaintenanceType = "PREVENTIVE" | "CORRECTIVE";

export type MaintenancePriority = "NORMAL" | "CRITICAL";

export type MaintenanceStatus =
  | "OPEN"
  | "PENDING_APPROVAL"
  | "IN_PROGRESS"
  | "PENDING_COMPLETION"
  | "COMPLETED"
  | "CANCELLED";

export interface MaintenanceSparePartItem {
  id: string;
  name: string;
  unit: string;
}

export interface MaintenanceSparePart {
  id: string;
  taskId: string;
  itemId: string;
  item: MaintenanceSparePartItem;
  quantityUsed: number;
  deducted?: boolean;
}

export interface FailureReport {
  id: string;
  taskId: string;
  equipmentName: string;
  description: string;
  priority: MaintenancePriority;
  productionOrderId?: string | null;
  reportedById: string;
  createdAt: string;
}

export interface MaintenanceTask {
  id: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  equipmentName: string;
  description: string;
  scheduledDate?: string | null;
  assignedToId?: string | null;
  assignedTo?: {
    user: {
      username: string;
      email: string;
    };
  } | null;
  reportedById?: string | null;
  reportedBy?: {
    username: string;
    email: string;
  } | null;
  completedAt?: string | null;
  timeSpentMins?: number | null;
  notes?: string | null;
  spareParts?: MaintenanceSparePart[];
  failureReport?: FailureReport | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceTaskListResponse {
  data: MaintenanceTask[];
  total: number;
  page: number;
  totalPages: number;
  limit?: number;
}

export interface MaintenanceRequisition {
  id: string;
  status: string;
  itemId: string;
  quantityRequested: number;
  purpose: string;
  referenceId?: string | null;
  item?: { id: string; name: string; unit: string; quantity?: number };
  requestedBy?: { id: string; username: string; email: string };
}

export interface MaintenanceAnalytics {
  total: number;
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  avgCompletionMins: number;
  totalCompleted: number;
  perTechnician?: Array<{
    technicianId: string | null;
    username?: string | null;
    completedCount: number;
    avgTimeSpentMins: number;
  }>;
  topSpareParts?: Array<{ itemId: string; name: string; totalUsed: number }>;
  topEquipmentFailures?: Array<{ equipmentName: string; count: number }>;
  overdueCount?: number;
  avgDaysToComplete?: number;
}

export interface MaintenanceAdvancedReportsWindow {
  mttrMinutes: number;
  mtbfDays: number;
  totalDowntimeMinutes: number;
  totalSpareCost: number;
}

export interface MaintenanceAdvancedReports {
  current: MaintenanceAdvancedReportsWindow;
  prior: MaintenanceAdvancedReportsWindow;
  periodDays: number;
}

export interface MaintenancePlanningCalendar {
  total: number;
  byDate: Record<string, MaintenanceTask[]>;
  tasks: MaintenanceTask[];
}

export interface CreateTaskInput {
  type: MaintenanceType;
  priority?: MaintenancePriority;
  equipmentName: string;
  description: string;
  scheduledDate?: string;
  assignedToId?: string;
}

export interface AssignTaskInput {
  assignedToId: string;
}

export interface CompleteTaskInput {
  timeSpentMins: number;
  spareParts?: { itemId: string; quantityUsed: number }[];
  notes?: string;
}

export interface ReportFailureInput {
  equipmentName: string;
  description: string;
  priority?: MaintenancePriority;
  productionOrderId?: string;
}

export const maintenanceApi = {
  async schedulePreventiveTask(data: CreateTaskInput) {
    const response = await api.post<MaintenanceTask>(
      "/maintenance/tasks/preventive",
      { ...data, type: "PREVENTIVE" },
    );
    return response.data;
  },

  async assignTask(taskId: string, data: AssignTaskInput) {
    const response = await api.patch<MaintenanceTask>(
      `/maintenance/tasks/${taskId}/assign`,
      data,
    );
    return response.data;
  },

  async approveFailure(taskId: string, data: AssignTaskInput) {
    const response = await api.patch<MaintenanceTask>(
      `/maintenance/tasks/${taskId}/approve-failure`,
      data,
    );
    return response.data;
  },

  async startTask(taskId: string) {
    const response = await api.patch<MaintenanceTask>(
      `/maintenance/tasks/${taskId}/start`,
    );
    return response.data;
  },

  async submitCompletion(taskId: string, data: CompleteTaskInput) {
    const response = await api.patch<MaintenanceTask>(
      `/maintenance/tasks/${taskId}/submit-completion`,
      data,
    );
    return response.data;
  },

  async approveCompletion(taskId: string) {
    const response = await api.patch<MaintenanceTask>(
      `/maintenance/tasks/${taskId}/approve-completion`,
    );
    return response.data;
  },

  async getTasks(params?: {
    status?: MaintenanceStatus;
    type?: MaintenanceType;
    priority?: MaintenancePriority;
    assignedToId?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get<MaintenanceTaskListResponse>(
      "/maintenance/tasks",
      { params },
    );
    return response.data;
  },

  async getMyTasks() {
    const response = await api.get<MaintenanceTask[]>(
      "/maintenance/tasks/mine",
    );
    return response.data;
  },

  async getMyTaskHistory() {
    const response = await api.get<MaintenanceTask[]>(
      "/maintenance/tasks/mine/history",
    );
    return response.data;
  },

  async listFailureReports(params?: {
    status?: MaintenanceStatus;
    priority?: MaintenancePriority;
  }) {
    const response = await api.get<{
      data: MaintenanceTask[];
      total: number;
      summary: { status: string; count: number }[];
    }>("/maintenance/failures", { params });
    return response.data;
  },

  async getPendingFailures() {
    const response = await api.get<MaintenanceTask[]>(
      "/maintenance/failures/pending",
    );
    return response.data;
  },

  async getPendingCompletions() {
    const response = await api.get<MaintenanceTask[]>(
      "/maintenance/completions/pending",
    );
    return response.data;
  },

  async getPendingRequisitions() {
    const response = await api.get<MaintenanceRequisition[]>(
      "/maintenance/requisitions/pending",
    );
    return response.data;
  },

  async getTask(id: string) {
    const response = await api.get<MaintenanceTask>(`/maintenance/tasks/${id}`);
    return response.data;
  },

  async getAnalytics() {
    const response = await api.get<MaintenanceAnalytics>(
      "/maintenance/analytics",
    );
    return response.data;
  },

  async reportFailure(data: ReportFailureInput) {
    const response = await api.post<{
      task: MaintenanceTask;
      report: FailureReport;
      message: string;
    }>("/maintenance/failures", data);
    return response.data;
  },

  async getPlanningCalendar(params?: { from?: string; to?: string }) {
    const response = await api.get<MaintenancePlanningCalendar>(
      "/maintenance/planning/calendar",
      { params },
    );
    return response.data;
  },

  async requestSpareParts(
    taskId: string,
    data: { itemId: string; quantityRequested: number; purpose?: string },
  ) {
    const response = await api.post(
      `/maintenance/tasks/${taskId}/spare-parts-request`,
      data,
    );
    return response.data;
  },

  async getTechnicians() {
    const response = await api.get<
      {
        id: string;
        userId: string;
        username: string;
        email: string;
        position: string;
      }[]
    >("/maintenance/technicians");
    return response.data;
  },

  async cancelTask(taskId: string) {
    const response = await api.patch<MaintenanceTask>(
      `/maintenance/tasks/${taskId}/cancel`,
    );
    return response.data;
  },

  async getAdvancedReports(days = 90) {
    const response = await api.get<MaintenanceAdvancedReports>(
      `/maintenance/reports/advanced`,
      { params: { days } },
    );
    return response.data;
  },

  async approveRequisition(requisitionId: string) {
    const response = await api.patch(
      `/inventory/requisitions/${requisitionId}/approve`,
    );
    return response.data;
  },

  async rejectRequisition(requisitionId: string, reason: string) {
    const response = await api.patch(
      `/inventory/requisitions/${requisitionId}/reject`,
      { reason },
    );
    return response.data;
  },
};
