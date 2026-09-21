import { NextResponse } from "next/server";
import { authenticateRequest, AuthenticatedIdentity } from "@/services/auth/authenticate";
import { checkPermission, Action } from "@/services/auth/permissions";

export type AuthorizedHandler = (request: Request, identity: AuthenticatedIdentity) => Promise<Response> | Response;

export function withAuthorization(action: Action, handler: AuthorizedHandler) {
  return async function authorizedRouteHandler(request: Request): Promise<Response> {
    const authResult = authenticateRequest(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    if (!checkPermission(authResult.identity.role, action)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Your role is not permitted to perform this action." } },
        { status: 403 },
      );
    }

    return handler(request, authResult.identity);
  };
}
