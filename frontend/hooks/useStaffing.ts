import { useQuery } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export function useStaffingDashboard(department?: string) {
  return useQuery({
    queryKey: ["staffing", "dashboard", department ?? "default"],
    queryFn: () =>
      workforceService.getStaffingDashboard(department).then((r) => r.data),
    refetchOnWindowFocus: true,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => workforceService.getDepartments().then((r) => r.data ?? []),
  });
}
