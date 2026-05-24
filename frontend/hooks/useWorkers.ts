import { useQuery } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

export function useWorkers() {
  return useQuery({
    queryKey: ["workers"],
    queryFn: () => workforceService.getWorkers().then((r) => r.data),
  });
}
