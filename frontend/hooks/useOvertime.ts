import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export function usePendingOvertime() {
  return useQuery({
    queryKey: ["overtime", "pending"],
    queryFn: () => workforceService.getOvertimePending().then((r) => r.data),
  });
}

export function useApproveOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workforceService.approveOvertime(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["overtime", "pending"] }),
  });
}
