/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import trainingService from "@/services/trainingService";

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
  isCompleted?: boolean;
  completedAt?: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  description?: string;
  category: string;
  isRequired: boolean;
  steps: TrainingStep[];
}

export interface TrainingEnrollment {
  id: string;
  courseId: string;
  course?: TrainingCourse;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  currentStepIndex: number;
  startedAt: string;
  completedAt?: string;
  stepCompletions?: Array<{
    stepId: string;
    completedAt: string;
  }>;
}

export interface TrainingMaterial {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  category: string;
  createdAt: string;
}

// Get all training materials for worker
export function useWorkerTrainingMaterials() {
  return useQuery({
    queryKey: ["worker", "training", "materials"],
    queryFn: () => trainingService.getTrainingMaterials().then((r) => r.data),
  });
}

// Get worker's enrolled courses with progress
export function useWorkerEnrolledCourses() {
  return useQuery({
    queryKey: ["worker", "training", "enrolled-courses"],
    queryFn: () => trainingService.getMyTrainingProgress().then((r) => r.data),
  });
}

// Get single course with all content
export function useWorkerCourseContent(courseId?: string | null) {
  return useQuery({
    queryKey: ["worker", "training", "course", courseId],
    enabled: Boolean(courseId),
    queryFn: () => trainingService.getTrainingCourse(courseId as string).then((r) => r.data),
  });
}

// Get step details
export function useWorkerStepDetails(stepId?: string | null) {
  return useQuery({
    queryKey: ["worker", "training", "step", stepId],
    enabled: Boolean(stepId),
    queryFn: () => trainingService.getStepDetails(stepId as string).then((r) => r.data),
  });
}

// Start/Enroll in a course
export function useStartCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (courseId: string) => trainingService.enrollInCourse("current-user", courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker", "training", "enrolled-courses"] });
    },
  });
}

// Complete a step in a course
export function useCompleteCourseStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ stepId, enrollmentId }: { stepId: string; enrollmentId: string }) =>
      trainingService.completeStep(enrollmentId, stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker", "training", "enrolled-courses"] });
      queryClient.invalidateQueries({ queryKey: ["worker", "training", "course"] });
    },
  });
}

// Download training material
export function useDownloadTrainingMaterial() {
  return useMutation({
    mutationFn: async (materialId: string) => {
      const response = await trainingService.downloadTrainingMaterial(materialId);
      return response.data;
    },
  });
}

// Get available courses (not yet started)
export function useAvailableCourses() {
  const { data: allCourses, isLoading: coursesLoading } = useWorkerTrainingMaterials();
  const { data: enrolledCourses, isLoading: enrolledLoading } = useWorkerEnrolledCourses();
  
  const enrolledCourseIds = enrolledCourses?.map((e: any) => e.courseId) || [];
  const availableCourses = allCourses?.filter(
    (course: any) => !enrolledCourseIds.includes(course.id)
  ) || [];
  
  return {
    data: availableCourses,
    isLoading: coursesLoading || enrolledLoading,
  };
}

// Get required courses (must complete)
export function useRequiredCourses() {
  const { data: enrolledCourses, isLoading } = useWorkerEnrolledCourses();
  
  const requiredCourses = enrolledCourses?.filter(
    (enrollment: any) => enrollment.course?.isRequired && enrollment.status !== 'COMPLETED'
  ) || [];
  
  return {
    data: requiredCourses,
    isLoading,
  };
}

// Get overall training progress
export function useOverallTrainingProgress() {
  const { data: enrolledCourses, isLoading } = useWorkerEnrolledCourses();
  
  const totalCourses = enrolledCourses?.length || 0;
  const completedCourses = enrolledCourses?.filter(
    (e: any) => e.status === 'COMPLETED'
  ).length || 0;
  const inProgressCourses = enrolledCourses?.filter(
    (e: any) => e.status === 'IN_PROGRESS'
  ).length || 0;
  const overallProgress = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
  
  return {
    data: {
      totalCourses,
      completedCourses,
      inProgressCourses,
      overallProgress,
      enrollments: enrolledCourses,
    },
    isLoading,
  };
}