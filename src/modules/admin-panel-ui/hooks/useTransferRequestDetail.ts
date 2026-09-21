import { useQuery } from "@tanstack/react-query";
import { fetchTransferRequestDetail } from "@/modules/admin-panel-ui/services/monitoringService";

export function useTransferRequestDetail(id: string) {
  return useQuery({
    queryKey: ["admin-panel-ui", "transfer-request-detail", id],
    queryFn: () => fetchTransferRequestDetail(id),
  });
}
