import { signToken } from "@/services/auth/jwt";
import { authenticateRequest } from "@/services/auth/authenticate";

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

function tamperWithPayload(token: string): string {
  const [header, payload, signature] = token.split(".");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  const mutatedPayload = Buffer.from(
    JSON.stringify({ ...decoded, role: "Admin" }),
  ).toString("base64url");
  return `${header}.${mutatedPayload}.${signature}`;
}

describe("authenticateRequest — success (rbac-api-security.AC1 / API01, positive path)", () => {
  // Not a distinct QT row — AC1/UT01 only specify the 401 case — but this is the
  // necessary positive-path counterpart the API01 contract text itself implies
  // ("attaches the decoded identity/role... for downstream use"). Not fabricated
  // as if backed by a QA row that doesn't exist.
  it("attaches the decoded identity/role for a valid bearer token", () => {
    const token = signToken({ userId: "user-1", role: "Manager" });
    const result = authenticateRequest(requestWithAuthHeader(`Bearer ${token}`));

    expect(result.authenticated).toBe(true);
    if (result.authenticated) {
      expect(result.identity).toEqual({ userId: "user-1", role: "Manager" });
    }
  });
});

describe("authenticateRequest — rejects (rbac-api-security.AC1/UT01, QT01-QT07)", () => {
  it("responds 401 UNAUTHENTICATED when no Authorization header is present at all (QT01)", async () => {
    const result = authenticateRequest(requestWithAuthHeader(null));

    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body.error.code).toBe("UNAUTHENTICATED");
      expect(typeof body.error.message).toBe("string");
    }
  });

  it("responds 401 UNAUTHENTICATED when the header is present but missing the Bearer prefix (QT02)", async () => {
    const token = signToken({ userId: "user-1", role: "Employee" });
    const result = authenticateRequest(requestWithAuthHeader(token));

    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.response.status).toBe(401);
      expect((await result.response.json()).error.code).toBe("UNAUTHENTICATED");
    }
  });

  it("responds 401 UNAUTHENTICATED for 'Bearer ' with an empty token string (QT03)", async () => {
    const result = authenticateRequest(requestWithAuthHeader("Bearer "));

    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.response.status).toBe(401);
      expect((await result.response.json()).error.code).toBe("UNAUTHENTICATED");
    }
  });

  it("responds 401 UNAUTHENTICATED for a token that expired 1 second before the request (QT04)", async () => {
    const token = signToken({ userId: "user-1", role: "Employee" }, { expiresInSeconds: -1 });
    const result = authenticateRequest(requestWithAuthHeader(`Bearer ${token}`));

    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.response.status).toBe(401);
    }
  });

  it("responds 401 UNAUTHENTICATED for a token that expires at the exact instant of the request (QT05)", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    try {
      const token = signToken({ userId: "user-1", role: "Employee" }, { expiresInSeconds: 60 });
      jest.setSystemTime(new Date("2026-01-01T00:01:00.000Z"));
      const result = authenticateRequest(requestWithAuthHeader(`Bearer ${token}`));

      expect(result.authenticated).toBe(false);
      if (!result.authenticated) {
        expect(result.response.status).toBe(401);
      }
    } finally {
      jest.useRealTimers();
    }
  });

  it("responds 401 UNAUTHENTICATED for a token signed with an invalid/wrong secret (QT06)", async () => {
    const token = signToken({ userId: "user-1", role: "Employee" });
    process.env.JWT_SECRET = "a-different-secret-now-in-use";
    const result = authenticateRequest(requestWithAuthHeader(`Bearer ${token}`));

    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.response.status).toBe(401);
    }
  });

  it("responds 401 UNAUTHENTICATED for a token with a tampered payload (QT07)", async () => {
    const token = signToken({ userId: "user-1", role: "Employee" });
    const tampered = tamperWithPayload(token);
    const result = authenticateRequest(requestWithAuthHeader(`Bearer ${tampered}`));

    expect(result.authenticated).toBe(false);
    if (!result.authenticated) {
      expect(result.response.status).toBe(401);
    }
  });
});
