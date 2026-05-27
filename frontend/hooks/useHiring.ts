import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export function useHiringRequests() {
  return useQuery({
    queryKey: ["hiring", "requests"],
    queryFn: () => workforceService.getHiringRequests().then((r) => r.data),
  });
}

export function useCreateHiringRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => workforceService.createHiringRequest(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hiring", "requests"] }),
  });
}

export function useApproveHiring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workforceService.approveHiringRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hiring", "requests"] }),
  });
}
