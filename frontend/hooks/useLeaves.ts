import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export function usePendingLeaves() {
  return useQuery({
    queryKey: ["leaves", "pending"],
    queryFn: () => workforceService.getPendingLeaves().then((r) => r.data),
  });
}

export function useMyLeaves() {
  return useQuery({
    queryKey: ["leaves", "me"],
    queryFn: () => workforceService.getMyLeaves().then((r) => r.data),
  });
}

export function useRequestLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => workforceService.requestLeave(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaves", "me"] }),
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workforceService.approveLeave(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaves", "pending"] }),
  });
}
