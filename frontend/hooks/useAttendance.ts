import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export function useTeamAttendance(teamId: string | undefined) {
  return useQuery({
    queryKey: ["attendance", teamId],
    queryFn: () =>
      workforceService.getTeamAttendance(teamId || "").then((r) => r.data),
    enabled: !!teamId,
  });
}

export function usePostAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => workforceService.postAttendance(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"], exact: false }),
  });
}
