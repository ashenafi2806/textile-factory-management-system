/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/api";

export interface TrainingMaterial {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  category: string;
  createdAt: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  description?: string;
  category: string;
  isRequired: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  steps?: TrainingStep[];
  _count?: { enrollments: number };
}

export interface TrainingStep {
  id: string;
  courseId: string;
  stepOrder: number;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  fileUrl?: string;
  requiresConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
  isCompleted?: boolean;
}

export interface TrainingEnrollment {
  id: string;
  workerId: string;
  courseId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress: number;
  currentStepIndex: number;
  startedAt: string;
  completedAt?: string;
  course?: TrainingCourse;
  stepCompletions?: TrainingStepCompletion[];
  totalSteps?: number;
  completedSteps?: number;
}

export interface TrainingStepCompletion {
  id: string;
  enrollmentId: string;
  stepId: string;
  completedAt: string;
  notes?: string;
  step?: TrainingStep;
}

export interface LearnerCoursePayload {
  course: TrainingCourse & { steps: TrainingStep[] };
  enrollment: TrainingEnrollment | null;
  workerId: string;
}

export const trainingService = {
  getTrainingMaterials: () => api.get("/training/materials"),
  getTrainingMaterial: (id: string) => api.get(`/training/materials/${id}`),
  createTrainingMaterial: (formData: FormData) =>
    api.post("/training/materials", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateTrainingMaterial: (id: string, data: Partial<TrainingMaterial>) =>
    api.put(`/training/materials/${id}`, data),
  deleteTrainingMaterial: (id: string) => api.delete(`/training/materials/${id}`),

  getTrainingCourses: () => api.get("/training/courses"),
  getTrainingCourse: (id: string) => api.get(`/training/courses/${id}`),
  getCourseForLearner: (id: string) => api.get(`/training/courses/${id}/learn`),
  createTrainingCourse: (data: Partial<TrainingCourse>) =>
    api.post("/training/courses", data),
  updateTrainingCourse: (id: string, data: Partial<TrainingCourse>) =>
    api.put(`/training/courses/${id}`, data),
  deleteTrainingCourse: (id: string) => api.delete(`/training/courses/${id}`),

  addTrainingStep: (courseId: string, data: Partial<TrainingStep>) =>
    api.post(`/training/courses/${courseId}/steps`, data),
  updateTrainingStep: (
    courseId: string,
    stepId: string,
    data: Partial<TrainingStep>,
  ) => api.put(`/training/courses/${courseId}/steps/${stepId}`, data),
  deleteTrainingStep: (courseId: string, stepId: string) =>
    api.delete(`/training/courses/${courseId}/steps/${stepId}`),

  enrollInCourse: (workerId: string, courseId: string) =>
    api.post("/training/enroll", { workerId, courseId }),
  enrollMe: (courseId: string) => api.post("/training/enroll-me", { courseId }),
  completeStep: (enrollmentId: string, stepId: string) =>
    api.post("/training/complete-step", { enrollmentId, stepId }),
  getMyTrainingProgress: () => api.get("/training/my-training"),
  getWorkerTrainingProgress: (workerId: string) =>
    api.get(`/training/workers/${workerId}/training`),

  getTrainingCompletionReport: () => api.get("/training/reports/completion"),
  getCourseCompletionReport: (courseId: string) =>
    api.get(`/training/reports/courses/${courseId}`),
  getTrainingDashboardSummary: () => api.get("/training/dashboard/summary"),
};

export default trainingService;
