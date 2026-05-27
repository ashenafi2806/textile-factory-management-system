import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export function useIncidents() {
  return useQuery({
    queryKey: ["incidents", "list"],
    queryFn: () => workforceService.getIncidents().then((r) => r.data),
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => workforceService.createIncident(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents", "list"] }),
  });
}

export function useIncident(id?: string) {
  return useQuery({
    queryKey: ["incidents", "one", id],
    enabled: !!id,
    queryFn: () => workforceService.getIncident(id!).then((r) => r.data),
  });
}

export function useApproveIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workforceService.approveIncident(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents", "list"] });
      qc.invalidateQueries({ queryKey: ["incidents", "one"] });
    },
  });
}

export default useIncidents;
