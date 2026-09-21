import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  submitFacilitiesTask,
  FacilitiesTaskPayload,
} from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

export function useFacilitiesTask(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FacilitiesTaskPayload) => submitFacilitiesTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "request-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "my-requests"] });
    },
  });
}
