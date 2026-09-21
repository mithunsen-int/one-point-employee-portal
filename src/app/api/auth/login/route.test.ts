import { NextRequest } from "next/server";

// `src/services/auth/userLookup.ts` does not exist yet. It is scoped inside
// rbac-api-security's own `services/auth/` directory (not user-management-console's),
// consistent with "credential lookup/verification" being named in T02's own task
// line — it does NOT create the `Users` Mongoose schema itself (that stays
// `user-management-console.T01`'s job), only a read boundary T02 codes against now,
// per the minimal read-contract (username, passwordHash, role, deletedAt) already
// named in rbac-api-security.plan.md.
//
// Mocked via a path relative to this file, not the `@/` alias: Jest's
// `moduleNameMapper` tries to resolve `@/...` specifiers before honoring
// `virtual: true`, which throws "Could not locate module" for a file that doesn't
// exist yet. A relative path bypasses that resolution step. Once
// `userLookup.ts` actually exists, this is a normal (non-virtual) mock like any
// other — this is a test-plumbing detail, not a constraint on how the real
// module gets imported elsewhere.
jest.mock(
  "../../../../services/auth/userLookup",
  () => ({
    __esModule: true,
    findUserForLogin: jest.fn(),
  }),
  { virtual: true },
);

// `bcrypt` is the hashing library `user-management-console.plan.md` already decided
// on (12 rounds), but it is not yet an installed dependency in this project —
// installing it is Green-phase/implementation work, out of this workflow's scope.
// Virtual-mocking it here lets the test reference the expected call shape without
// requiring the package to be on disk yet. Plain package name (not `@/`-aliased),
// so `moduleNameMapper` doesn't intercept it.
jest.mock(
  "bcrypt",
  () => ({
    __esModule: true,
    default: { compare: jest.fn() },
    compare: jest.fn(),
  }),
  { virtual: true },
);

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
  jest.resetModules();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

async function callLogin(body: unknown) {
  // `@/app/api/auth/login/route` does not exist yet — this import is expected
  // to fail until T02's implementation is written.
  const { POST } = await import("@/app/api/auth/login/route");
  const request = new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const response = await POST(request);
  const json = await response.json();
  return { status: response.status, json };
}

describe("POST /auth/login — success (rbac-api-security.AC10, UT11)", () => {
  it("responds 200 with access_token, token_type Bearer, and expires_in for valid credentials", async () => {
    const { findUserForLogin } = await import("../../../../services/auth/userLookup");
    const { default: bcrypt } = await import("bcrypt");
    (findUserForLogin as jest.Mock).mockResolvedValue({
      userId: "user-1",
      username: "jane.doe",
      passwordHash: "hashed-password",
      role: "Employee",
      deletedAt: null,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const { status, json } = await callLogin({ username: "jane.doe", password: "correct-password" });

    expect(status).toBe(200);
    expect(typeof json.access_token).toBe("string");
    expect(json.token_type).toBe("Bearer");
    expect(typeof json.expires_in).toBe("number");
  });
});

describe("POST /auth/login — invalid credentials (rbac-api-security.AC11, UT12/QT21/QT22)", () => {
  it("responds 401 invalid_credentials with no token for a wrong password (UT12/QT22)", async () => {
    const { findUserForLogin } = await import("../../../../services/auth/userLookup");
    const { default: bcrypt } = await import("bcrypt");
    (findUserForLogin as jest.Mock).mockResolvedValue({
      userId: "user-1",
      username: "jane.doe",
      passwordHash: "hashed-password",
      role: "Employee",
      deletedAt: null,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const { status, json } = await callLogin({ username: "jane.doe", password: "wrong-password" });

    expect(status).toBe(401);
    expect(json).toEqual({ error: "invalid_credentials" });
    expect(json.access_token).toBeUndefined();
  });

  it("responds 401 invalid_credentials, identical shape, for a non-existent username (QT21 — no enumeration)", async () => {
    const { findUserForLogin } = await import("../../../../services/auth/userLookup");
    (findUserForLogin as jest.Mock).mockResolvedValue(null);

    const { status, json } = await callLogin({ username: "no-such-user", password: "anything" });

    expect(status).toBe(401);
    expect(json).toEqual({ error: "invalid_credentials" });
  });
});

describe("POST /auth/login — validation errors (rbac-api-security.AC12, UT13/QT23/QT25)", () => {
  it("responds 400 validation_error naming password when password is missing (UT13/QT24)", async () => {
    const { status, json } = await callLogin({ username: "jane.doe" });

    expect(status).toBe(400);
    expect(json.error).toBe("validation_error");
    expect(json.fields).toEqual(expect.arrayContaining(["password"]));
  });

  it("responds 400 validation_error naming username when username is missing (QT23)", async () => {
    const { status, json } = await callLogin({ password: "correct-password" });

    expect(status).toBe(400);
    expect(json.error).toBe("validation_error");
    expect(json.fields).toEqual(expect.arrayContaining(["username"]));
  });

  it("responds 400 validation_error naming username when username is a non-string type (QT25)", async () => {
    const { status, json } = await callLogin({ username: 12345, password: "correct-password" });

    expect(status).toBe(400);
    expect(json.error).toBe("validation_error");
    expect(json.fields).toEqual(expect.arrayContaining(["username"]));
  });
});

describe("POST /auth/login — rate limiting (rbac-api-security.AC13, UT14/QT27-QT30)", () => {
  async function mockLookup(usernameToUser: Record<string, { passwordHash: string; role: string; deletedAt: string | null }>) {
    const { findUserForLogin } = await import("../../../../services/auth/userLookup");
    (findUserForLogin as jest.Mock).mockImplementation(async (username: string) => {
      const user = usernameToUser[username];
      return user ? { userId: `${username}-id`, username, ...user } : null;
    });
    const { default: bcrypt } = await import("bcrypt");
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
  }

  it("still evaluates the 5th failed attempt normally, not yet rate-limited (QT27)", async () => {
    await mockLookup({ "jane.doe": { passwordHash: "hashed-password", role: "Employee", deletedAt: null } });

    for (let i = 0; i < 4; i++) {
      const { status } = await callLogin({ username: "jane.doe", password: "wrong-password" });
      expect(status).toBe(401);
    }
    const fifth = await callLogin({ username: "jane.doe", password: "wrong-password" });
    expect(fifth.status).toBe(401);
  });

  it("blocks the 6th failed attempt for the same username with 429 rate_limited (UT14/QT28)", async () => {
    await mockLookup({ "jane.doe": { passwordHash: "hashed-password", role: "Employee", deletedAt: null } });

    for (let i = 0; i < 5; i++) {
      const { status } = await callLogin({ username: "jane.doe", password: "wrong-password" });
      expect(status).toBe(401);
    }
    const sixth = await callLogin({ username: "jane.doe", password: "wrong-password" });
    expect(sixth.status).toBe(429);
    expect(sixth.json).toEqual({ error: "rate_limited", retry_after: expect.any(Number) });
  });

  it("does not let failed attempts against one username affect a different username (QT29)", async () => {
    await mockLookup({
      "jane.doe": { passwordHash: "hashed-password", role: "Employee", deletedAt: null },
      "john.smith": { passwordHash: "hashed-password", role: "Employee", deletedAt: null },
    });

    for (let i = 0; i < 6; i++) {
      await callLogin({ username: "jane.doe", password: "wrong-password" });
    }
    const janeAttempt = await callLogin({ username: "jane.doe", password: "wrong-password" });
    expect(janeAttempt.status).toBe(429);

    const johnAttempt = await callLogin({ username: "john.smith", password: "wrong-password" });
    expect(johnAttempt.status).toBe(401);
  });

  it("evaluates a previously-limited username normally again after the 15-minute window elapses (QT30)", async () => {
    jest.useFakeTimers();
    try {
      await mockLookup({ "jane.doe": { passwordHash: "hashed-password", role: "Employee", deletedAt: null } });

      for (let i = 0; i < 6; i++) {
        await callLogin({ username: "jane.doe", password: "wrong-password" });
      }
      const limited = await callLogin({ username: "jane.doe", password: "wrong-password" });
      expect(limited.status).toBe(429);

      jest.advanceTimersByTime(15 * 60 * 1000 + 1);

      const afterWindow = await callLogin({ username: "jane.doe", password: "wrong-password" });
      expect(afterWindow.status).toBe(401);
    } finally {
      jest.useRealTimers();
    }
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT19 (AC10, username whitespace) and QT20 (AC10, username casing) are recorded
//   as Open QA Questions in rbac-api-security.test_cases.md, not resolved behavior —
//   per this workflow's Do-not #3, no test is written for them until they're resolved.
// - QT26 (AC12, unexpected extra field) is likewise an Open QA Question.
// - The `deletedAt` soft-delete rejection named in T02's own prompt file and in
//   rbac-api-security.plan.md's Data Model ("rejected with the same 401 as a wrong
//   password") is a real, decided requirement, but it is not backed by any row in
//   rbac-api-security.spec.md's Unit Test Cases table or in
//   rbac-api-security.test_cases.md — per Steps 3/4 and Do-not #3, that gap is
//   flagged in the Red-confirmation report rather than tested here.
// - T03's own prompt file states "successful logins must not count toward, or be
//   blocked by, the failed-attempt counter" — a real requirement, but it is not
//   backed by any row in the spec's Unit Test Cases table or in
//   rbac-api-security.test_cases.md (QT27–QT30 all describe *failed* attempts only).
//   Flagged per Do-not #3 rather than fabricated as a QA scenario; the
//   implementation still honors it (only failed attempts increment the counter).
