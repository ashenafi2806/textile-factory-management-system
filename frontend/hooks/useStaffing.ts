import { useQuery } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export function useStaffingDashboard() {
  return useQuery({
    queryKey: ["staffing", "dashboard"],
    queryFn: () => workforceService.getStaffingDashboard().then((r) => r.data),
  });
}
