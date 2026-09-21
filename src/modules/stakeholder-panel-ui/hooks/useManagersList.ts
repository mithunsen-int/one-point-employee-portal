import { useQuery } from "@tanstack/react-query";
import { fetchManagers } from "@/modules/stakeholder-panel-ui/services/managersLookupService";

export function useManagersList() {
  return useQuery({ queryKey: ["stakeholder-panel-ui", "managers"], queryFn: fetchManagers });
}
