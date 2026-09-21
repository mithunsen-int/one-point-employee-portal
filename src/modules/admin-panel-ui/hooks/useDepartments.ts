import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDepartments,
  createDepartment,
  editDepartment,
  deleteDepartment,
} from "@/modules/admin-panel-ui/services/orgStructureService";

const DEPARTMENTS_QUERY_KEY = ["admin-panel-ui", "departments"];

export function useDepartments() {
  return useQuery({ queryKey: DEPARTMENTS_QUERY_KEY, queryFn: fetchDepartments });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => createDepartment(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY }),
  });
}

export function useEditDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => editDepartment(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY }),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY }),
  });
}
