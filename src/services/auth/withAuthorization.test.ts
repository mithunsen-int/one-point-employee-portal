import { signToken } from "@/services/auth/jwt";
import { withAuthorization } from "@/services/auth/withAuthorization";

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

function requestWithAuthHeader(headerValue: string | null): Request {
  const headers = new Headers();
  if (headerValue !== null) {
    headers.set("authorization", headerValue);
  }
  return new Request("http://localhost/api/protected", { headers });
}

// No real protected route exists anywhere in this codebase yet — the only route
// (`POST /auth/login`) is the one endpoint this mechanism must NOT wrap. So this
// task's actual deliverable — the reusable wiring mechanism itself — is tested
// directly against a stand-in handler, the same way `T04`/`T05` were tested
// against their own inputs before any route consumed them.
describe("withAuthorization (rbac-api-security.AC1/AC2, T04+T05 composition)", () => {
  it("responds 401 UNAUTHENTICATED and never calls the wrapped handler when no valid bearer token is present (AC1)", async () => {
    const handler = jest.fn();
    const wrapped = withAuthorization("transfer.initiate", handler);

    const response = await wrapped(requestWithAuthHeader(null));

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
    expect(handler).not.toHaveBeenCalled();
  });

  it("responds 403 FORBIDDEN and never calls the wrapped handler when the role isn't permitted for the action (AC2)", async () => {
    const handler = jest.fn();
    const wrapped = withAuthorization("admin.userManagement", handler);
    const token = signToken({ userId: "user-1", role: "Employee" });

    const response = await wrapped(requestWithAuthHeader(`Bearer ${token}`));

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("FORBIDDEN");
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls the wrapped handler with the request and decoded identity, returning its response unmodified, when authorized", async () => {
    const handler = jest.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const wrapped = withAuthorization("transfer.initiate", handler);
    const token = signToken({ userId: "user-1", role: "Employee" });
    const request = requestWithAuthHeader(`Bearer ${token}`);

    const response = await wrapped(request);

    expect(handler).toHaveBeenCalledWith(request, { userId: "user-1", role: "Employee" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
