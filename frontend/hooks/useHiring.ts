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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hiring"] }),
  });
}

export function useHiringRequest(id?: string | null) {
  const qc = useQueryClient();

  return useQuery({
    queryKey: ["hiring", "request", id],
    enabled: Boolean(id),
    // Use cached list item as initialData so UI can show details even
    // if backend in-memory store was restarted and the detail endpoint
    // returns 404. This makes the dialog snappy and resilient.
    initialData: () => {
      if (!id) return undefined;
      const list = qc.getQueryData(["hiring", "requests"]) as any[] | undefined;
      return list ? list.find((x) => String(x.id) === String(id)) : undefined;
    },
    queryFn: () =>
      workforceService.getHiringRequest(id as string).then((r) => {
        const body = (r as any).data;
        return body && body.data ? body.data : body;
      }),
  });
}

export function useApproveHiring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workforceService.approveHiringRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hiring"] }),
  });
}

export function useRejectHiring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workforceService.rejectHiringRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hiring"] }),
  });
}
