import { useQuery } from "@tanstack/react-query";
import { fetchRequestDetail } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

export function useRequestDetail(id: string) {
  return useQuery({
    queryKey: ["stakeholder-panel-ui", "request-detail", id],
    queryFn: () => fetchRequestDetail(id),
  });
}
