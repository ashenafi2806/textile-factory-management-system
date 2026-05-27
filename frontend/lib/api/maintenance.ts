import api from './client';

export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE';

export type MaintenancePriority = 'NORMAL' | 'CRITICAL';

export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

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
  spareParts: MaintenanceSparePart[];
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

export interface MaintenanceAnalytics {
  total: number;
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  avgCompletionMins: number;
  totalCompleted: number;
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
  async createTask(data: CreateTaskInput) {
    const response = await api.post<MaintenanceTask>('/maintenance/tasks', data);
    return response.data;
  },

  async assignTask(taskId: string, data: AssignTaskInput) {
    const response = await api.patch<MaintenanceTask>(`/maintenance/tasks/${taskId}/assign`, data);
    return response.data;
  },

  async completeTask(taskId: string, data: CompleteTaskInput) {
    const response = await api.patch<MaintenanceTask>(`/maintenance/tasks/${taskId}/complete`, data);
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
    const response = await api.get<MaintenanceTaskListResponse>('/maintenance/tasks', { params });
    return response.data;
  },

  async getMyTasks() {
    const response = await api.get<MaintenanceTask[]>('/maintenance/tasks/mine');
    return response.data;
  },

  async getTask(id: string) {
    const response = await api.get<MaintenanceTask>(`/maintenance/tasks/${id}`);
    return response.data;
  },

  async getAnalytics() {
    const response = await api.get<MaintenanceAnalytics>('/maintenance/analytics');
    return response.data;
  },

  async reportFailure(data: ReportFailureInput) {
    const response = await api.post<{ task: MaintenanceTask; report: FailureReport; message: string }>('/maintenance/failures', data);
    return response.data;
  },
};