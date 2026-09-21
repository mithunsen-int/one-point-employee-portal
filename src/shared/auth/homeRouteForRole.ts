// stakeholder-panel-ui.AC12: the one place this Admin-vs-everyone-else
// routing decision lives — reused by the root route redirect and by
// LoginForm's own post-login/already-authenticated redirects.
export function homeRouteForRole(role: string | undefined): string {
  return role === "Admin" ? "/dashboard" : "/my-requests";
}
