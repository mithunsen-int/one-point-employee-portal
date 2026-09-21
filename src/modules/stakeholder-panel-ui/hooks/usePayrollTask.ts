import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitPayrollTask, PayrollTaskPayload } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

export function usePayrollTask(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PayrollTaskPayload) => submitPayrollTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "request-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["stakeholder-panel-ui", "my-requests"] });
    },
  });
}
