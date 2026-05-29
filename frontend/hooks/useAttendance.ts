import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export function useTeamAttendance(teamId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ["attendance", teamId, date],
    queryFn: () =>
      workforceService.getTeamAttendance(teamId || "", date).then((r: any) => {
        try {
          // eslint-disable-next-line no-console
          console.debug("useTeamAttendance response", {
            teamId,
            date,
            status: r.status,
            data: r.data,
          });
        } catch (e) {}
        return r.data;
      }),
    enabled: !!teamId,
  });
}

export function usePostAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => workforceService.postAttendance(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["attendance"], exact: false }),
  });
}

export function useUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      workforceService.updateAttendance(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["attendance"], exact: false }),
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workforceService.deleteAttendance(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["attendance"], exact: false }),
  });
}
