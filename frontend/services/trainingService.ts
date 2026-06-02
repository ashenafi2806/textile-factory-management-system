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
  _count?: {
    enrollments: number;
  };
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
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  currentStepIndex: number;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  course?: TrainingCourse;
  stepCompletions?: TrainingStepCompletion[];
}

export interface TrainingStepCompletion {
  id: string;
  enrollmentId: string;
  stepId: string;
  completedAt: string;
  notes?: string;
  step?: TrainingStep;
}

export interface TrainingCompletionReport {
  summary: {
    totalWorkers: number;
    totalCourses: number;
    totalEnrollments: number;
    completedCourses: number;
    inProgressCourses: number;
    notStartedCourses: number;
  };
  courseCompletion: Array<{
    courseId: string;
    courseTitle: string;
    totalEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    averageProgress: number;
    totalSteps: number;
  }>;
  generatedAt: string;
}

export const trainingService = {
  // Training Materials
  getTrainingMaterials: () => api.get("/training/materials"),
  getTrainingMaterial: (id: string) => api.get(`/training/materials/${id}`),
  createTrainingMaterial: (formData: FormData) =>
    api.post("/training/materials", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateTrainingMaterial: (id: string, data: Partial<TrainingMaterial>) =>
    api.put(`/training/materials/${id}`, data),
  deleteTrainingMaterial: (id: string) => api.delete(`/training/materials/${id}`),

  // Training Courses
  getTrainingCourses: () => api.get("/training/courses"),
  getTrainingCourse: (id: string) => api.get(`/training/courses/${id}`),
  createTrainingCourse: (data: Partial<TrainingCourse>) =>
    api.post("/training/courses", data),
  updateTrainingCourse: (id: string, data: Partial<TrainingCourse>) =>
    api.put(`/training/courses/${id}`, data),
  deleteTrainingCourse: (id: string) => api.delete(`/training/courses/${id}`),

  // Training Steps
  addTrainingStep: (courseId: string, data: Partial<TrainingStep>) =>
    api.post(`/training/courses/${courseId}/steps`, data),
  updateTrainingStep: (courseId: string, stepId: string, data: Partial<TrainingStep>) =>
    api.put(`/training/courses/${courseId}/steps/${stepId}`, data),
  deleteTrainingStep: (courseId: string, stepId: string) =>
    api.delete(`/training/courses/${courseId}/steps/${stepId}`),

  // Employee Enrollment & Progress
  enrollInCourse: (workerId: string, courseId: string) =>
    api.post("/training/enroll", { workerId, courseId }),
  completeStep: (enrollmentId: string, stepId: string) =>
    api.post("/training/complete-step", { enrollmentId, stepId }),
  getMyTrainingProgress: () => api.get("/training/my-training"),
  getWorkerTrainingProgress: (workerId: string) =>
    api.get(`/training/workers/${workerId}/training`),

  // Reports
  getTrainingCompletionReport: () => api.get("/training/reports/completion"),
  getCourseCompletionReport: (courseId: string) =>
    api.get(`/training/reports/courses/${courseId}`),
  getTrainingDashboardSummary: () => api.get("/training/dashboard/summary"),

  getMyTrainingMaterials: () => api.get("/training/materials"),
getMyEnrolledCourses: () => api.get("/training/my-training"),
getCourseContent: (courseId: string) => api.get(`/training/courses/${courseId}`),
startCourse: (courseId: string) => api.post("/training/enroll", { courseId }),
completeCourseStep: (stepId: string, enrollmentId: string) => 
  api.post("/training/complete-step", { stepId, enrollmentId }),
getStepDetails: (stepId: string) => api.get(`/training/steps/${stepId}`),
downloadTrainingMaterial: (materialId: string) => 
  api.get(`/training/materials/${materialId}/download`, { responseType: 'blob' }),
};

export default trainingService;