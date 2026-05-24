import { useQuery } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export function useTeamSchedule(teamId: string | undefined) {
  return useQuery({
    queryKey: ["schedule", teamId],
    queryFn: () =>
      workforceService.getTeamSchedule(teamId || "").then((r) => r.data),
    enabled: !!teamId,
  });
}
