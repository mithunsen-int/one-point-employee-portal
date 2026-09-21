import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchJobRoles,
  createJobRole,
  editJobRole,
  deleteJobRole,
} from "@/modules/admin-panel-ui/services/orgStructureService";

const JOB_ROLES_QUERY_KEY = ["admin-panel-ui", "job-roles"];

export function useJobRoles() {
  return useQuery({ queryKey: JOB_ROLES_QUERY_KEY, queryFn: fetchJobRoles });
}

export function useCreateJobRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string }) => createJobRole(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: JOB_ROLES_QUERY_KEY }),
  });
}

export function useEditJobRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => editJobRole(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: JOB_ROLES_QUERY_KEY }),
  });
}

export function useDeleteJobRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJobRole(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: JOB_ROLES_QUERY_KEY }),
  });
}
