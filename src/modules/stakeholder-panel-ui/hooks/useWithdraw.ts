import { useMutation, useQueryClient } from "@tanstack/react-query";
import { withdrawRequest } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

export function useWithdraw(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => withdrawRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "request-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "my-requests"] });
    },
  });
}
