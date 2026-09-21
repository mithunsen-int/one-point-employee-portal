import { useMutation } from "@tanstack/react-query";
import { login } from "@/modules/stakeholder-panel-ui/services/authService";

export function useLogin() {
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => login(username, password),
  });
}
