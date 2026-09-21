import { useQuery } from "@tanstack/react-query";
import { fetchDepartments, fetchJobRoles } from "@/modules/stakeholder-panel-ui/services/orgStructureLookupService";

export function useDepartmentOptions() {
  return useQuery({ queryKey: ["stakeholder-panel-ui", "departments"], queryFn: fetchDepartments });
}

export function useJobRoleOptions() {
  return useQuery({ queryKey: ["stakeholder-panel-ui", "job-roles"], queryFn: fetchJobRoles });
}
