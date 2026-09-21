import { signToken, verifyToken } from "@/services/auth/jwt";

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

function tamperWithPayload(token: string): string {
  const [header, payload, signature] = token.split(".");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  const mutatedPayload = Buffer.from(
    JSON.stringify({ ...decoded, role: "Admin" }),
  ).toString("base64url");
  return `${header}.${mutatedPayload}.${signature}`;
}

describe("signToken / verifyToken round-trip (rbac-api-security.AC10, rbac-api-security.UT11)", () => {
  it("produces a token that verifyToken decodes back to the original payload", () => {
    const token = signToken({ userId: "user-1", role: "Employee" });
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe("user-1");
    expect(decoded.role).toBe("Employee");
  });

  it("embeds an expiry claim, so a caller can derive expires_in as AC10 requires", () => {
    const token = signToken({ userId: "user-1", role: "Employee" });
    const decoded = verifyToken(token);
    expect(typeof decoded.exp).toBe("number");
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

describe(
  "verifyToken rejects invalid tokens " +
    "(cross-referenced from rbac-api-security.test_cases.md QT03/QT04/QT06/QT07 — " +
    "tagged AC1 there since they're phrased at the middleware/endpoint level, but they " +
    "exercise the exact verification mechanism this task builds, not a new scenario)",
  () => {
    it("rejects an empty or syntactically malformed token string (QT03)", () => {
      expect(() => verifyToken("")).toThrow();
      expect(() => verifyToken("not-a-jwt")).toThrow();
    });

    it("rejects an already-expired token (QT04)", () => {
      const token = signToken({ userId: "user-1", role: "Employee" }, { expiresInSeconds: -1 });
      expect(() => verifyToken(token)).toThrow();
    });

    it("rejects a token at the exact instant it expires — boundary, not just clearly-past (QT05)", () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      const token = signToken({ userId: "user-1", role: "Employee" }, { expiresInSeconds: 60 });
      jest.setSystemTime(new Date("2026-01-01T00:01:00.000Z"));
      expect(() => verifyToken(token)).toThrow();
      jest.useRealTimers();
    });

    it("rejects a token whose signature no longer matches the currently configured JWT_SECRET (QT06)", () => {
      const token = signToken({ userId: "user-1", role: "Employee" });
      process.env.JWT_SECRET = "a-different-secret-now-in-use";
      expect(() => verifyToken(token)).toThrow();
    });

    it("rejects a token whose payload has been tampered with after signing (QT07)", () => {
      const token = signToken({ userId: "user-1", role: "Employee" });
      const tampered = tamperWithPayload(token);
      expect(() => verifyToken(tampered)).toThrow();
    });
  },
);

describe("secret configuration (T01's own scope — environment-variable-based, never hardcoded)", () => {
  it("throws a clear configuration error if JWT_SECRET is unset, rather than silently signing with an undefined secret", () => {
    delete process.env.JWT_SECRET;
    expect(() => signToken({ userId: "user-1", role: "Employee" })).toThrow();
  });
});
