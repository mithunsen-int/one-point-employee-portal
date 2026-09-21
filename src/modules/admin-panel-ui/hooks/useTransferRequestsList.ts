import { useQuery } from "@tanstack/react-query";
import { fetchTransferRequestsList } from "@/modules/admin-panel-ui/services/monitoringService";

export function useTransferRequestsList() {
  return useQuery({
    queryKey: ["admin-panel-ui", "transfer-requests-list"],
    queryFn: fetchTransferRequestsList,
  });
}
