import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  submitManagerDecision,
  ManagerDecisionPayload,
} from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

export function useManagerDecision(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManagerDecisionPayload) => submitManagerDecision(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "request-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "my-requests"] });
    },
  });
}
