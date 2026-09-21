import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "@/modules/admin-panel-ui/services/dashboardService";

export function useDashboard() {
  return useQuery({
    queryKey: ["admin-panel-ui", "dashboard"],
    queryFn: fetchDashboard,
  });
}
