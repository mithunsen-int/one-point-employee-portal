import { useQuery } from "@tanstack/react-query";
import { fetchMyRequests } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

export function useMyRequests() {
  return useQuery({
    queryKey: ["stakeholder-panel-ui", "my-requests"],
    queryFn: fetchMyRequests,
  });
}
