import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitHrDecision, HrDecisionPayload } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

export function useHrDecision(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: HrDecisionPayload) => submitHrDecision(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "request-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "my-requests"] });
    },
  });
}
