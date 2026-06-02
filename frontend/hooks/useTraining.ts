import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import trainingService from "@/services/trainingService";
import type {
  TrainingMaterial,
  TrainingCourse,
  TrainingStep,
  TrainingEnrollment,
} from "@/services/trainingService";


export function useTrainingMaterials() {
  return useQuery({
    queryKey: ["training", "materials"],
    queryFn: () => trainingService.getTrainingMaterials().then((r) => r.data),
  });
}

export function useTrainingMaterial(id?: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["training", "material", id],
    enabled: Boolean(id),
    initialData: () => {
      if (!id) return undefined;
      const list = queryClient.getQueryData(["training", "materials"]) as any[] | undefined;
      return list ? list.find((x: any) => String(x.id) === String(id)) : undefined;
    },
    queryFn: () =>
      trainingService.getTrainingMaterial(id as string).then((r) => r.data),
  });
}

export function useCreateTrainingMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => trainingService.createTrainingMaterial(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training", "materials"] });
    },
  });
}

export function useUpdateTrainingMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TrainingMaterial> }) =>
      trainingService.updateTrainingMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training", "materials"] });
    },
  });
}

export function useDeleteTrainingMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trainingService.deleteTrainingMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training", "materials"] });
    },
  });
}

// ==================== Training Courses Hooks ====================

export function useTrainingCourses() {
  return useQuery({
    queryKey: ["training", "courses"],
    queryFn: () => trainingService.getTrainingCourses().then((r) => r.data),
  });
}

export function useTrainingCourse(id?: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["training", "course", id],
    enabled: Boolean(id),
    initialData: () => {
      if (!id) return undefined;
      const list = queryClient.getQueryData(["training", "courses"]) as any[] | undefined;
      return list ? list.find((x: any) => String(x.id) === String(id)) : undefined;
    },
    queryFn: () => trainingService.getTrainingCourse(id as string).then((r) => r.data),
  });
}

export function useCreateTrainingCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrainingCourse>) => trainingService.createTrainingCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training", "courses"] });
    },
  });
}

export function useUpdateTrainingCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TrainingCourse> }) =>
      trainingService.updateTrainingCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training", "courses"] });
    },
  });
}

export function useDeleteTrainingCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trainingService.deleteTrainingCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training", "courses"] });
    },
  });
}

// ==================== Training Steps Hooks ====================

export function useAddTrainingStep(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrainingStep>) =>
      trainingService.addTrainingStep(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training", "course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["training", "courses"] });
    },
  });
}

export function useUpdateTrainingStep(courseId: string, stepId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrainingStep>) =>
      trainingService.updateTrainingStep(courseId, stepId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training", "course", courseId] });
    },
  });
}

export function useDeleteTrainingStep(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => trainingService.deleteTrainingStep(courseId, stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training", "course", courseId] });
    },
  });
}

// ==================== Employee Enrollment & Progress Hooks ====================

export function useEnrollInCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workerId, courseId }: { workerId: string; courseId: string }) =>
      trainingService.enrollInCourse(workerId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training", "my-progress"] });
      queryClient.invalidateQueries({ queryKey: ["training", "courses"] });
    },
  });
}

export function useCompleteStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, stepId }: { enrollmentId: string; stepId: string }) =>
      trainingService.completeStep(enrollmentId, stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training", "my-progress"] });
      queryClient.invalidateQueries({ queryKey: ["training", "worker-progress"] });
    },
  });
}

export function useMyTrainingProgress() {
  return useQuery({
    queryKey: ["training", "my-progress"],
    queryFn: () => trainingService.getMyTrainingProgress().then((r) => r.data),
  });
}

export function useWorkerTrainingProgress(workerId?: string | null) {
  return useQuery({
    queryKey: ["training", "worker-progress", workerId],
    enabled: Boolean(workerId),
    queryFn: () =>
      trainingService.getWorkerTrainingProgress(workerId as string).then((r) => r.data),
  });
}

// ==================== Reports Hooks ====================

export function useTrainingCompletionReport() {
  return useQuery({
    queryKey: ["training", "reports", "completion"],
    queryFn: () => trainingService.getTrainingCompletionReport().then((r) => r.data),
  });
}

export function useCourseCompletionReport(courseId?: string | null) {
  return useQuery({
    queryKey: ["training", "reports", "course", courseId],
    enabled: Boolean(courseId),
    queryFn: () =>
      trainingService.getCourseCompletionReport(courseId as string).then((r) => r.data),
  });
}

export function useTrainingDashboardSummary() {
  return useQuery({
    queryKey: ["training", "dashboard", "summary"],
    queryFn: () => trainingService.getTrainingDashboardSummary().then((r) => r.data),
  });
}

// ==================== Combined Hook for Worker Training View ====================

export function useWorkerTraining(workerId?: string | null) {
  const { data: courses, isLoading: coursesLoading } = useTrainingCourses();
  const { data: progress, isLoading: progressLoading } = useWorkerTrainingProgress(workerId);

  const availableCourses = courses?.filter(
    (course: TrainingCourse) =>
      !progress?.some((p: TrainingEnrollment) => p.courseId === course.id)
  ) || [];

  const enrolledCourses = progress?.map((p: TrainingEnrollment) => ({
    ...p,
    course: courses?.find((c: TrainingCourse) => c.id === p.courseId),
  })) || [];

  return {
    availableCourses,
    enrolledCourses,
    progress,
    isLoading: coursesLoading || progressLoading,
  };
}

export default {
  useTrainingMaterials,
  useTrainingMaterial,
  useCreateTrainingMaterial,
  useUpdateTrainingMaterial,
  useDeleteTrainingMaterial,
  useTrainingCourses,
  useTrainingCourse,
  useCreateTrainingCourse,
  useUpdateTrainingCourse,
  useDeleteTrainingCourse,
  useAddTrainingStep,
  useUpdateTrainingStep,
  useDeleteTrainingStep,
  useEnrollInCourse,
  useCompleteStep,
  useMyTrainingProgress,
  useWorkerTrainingProgress,
  useTrainingCompletionReport,
  useCourseCompletionReport,
  useTrainingDashboardSummary,
  useWorkerTraining,
};