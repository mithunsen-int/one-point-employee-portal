import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitRequest, SubmitRequestPayload } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

export function useSubmitRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitRequestPayload) => submitRequest(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "my-requests"] }),
  });
}
