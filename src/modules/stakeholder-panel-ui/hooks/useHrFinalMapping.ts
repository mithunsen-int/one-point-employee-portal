import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  submitHrFinalMapping,
  HrFinalMappingPayload,
} from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

export function useHrFinalMapping(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: HrFinalMappingPayload) => submitHrFinalMapping(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "request-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "my-requests"] });
    },
  });
}
