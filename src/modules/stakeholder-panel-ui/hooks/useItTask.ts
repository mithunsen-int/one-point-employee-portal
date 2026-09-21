import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitItTask, ItTaskPayload } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

export function useItTask(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ItTaskPayload) => submitItTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "request-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "my-requests"] });
    },
  });
}
