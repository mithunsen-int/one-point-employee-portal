import { NextRequest } from "next/server";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { User } from "@/services/users/User";
import { __resetForTests as resetSelfRegisterRateLimiter } from "@/services/users/selfRegisterRateLimiter";
import { POST } from "@/app/api/admin/self-register/route";

beforeAll(async () => {
  await startTestDatabase();
  await User.init();
}, 60000);

beforeEach(() => {
  resetSelfRegisterRateLimiter();
});

afterEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await stopTestDatabase();
});

async function callSelfRegister(body: unknown, ip = "203.0.113.1") {
  const headers = new Headers({ "content-type": "application/json", "x-forwarded-for": ip });
  const request = new NextRequest("http://localhost/api/admin/self-register", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const response = await POST(request);
  const json = await response.json();
  return { status: response.status, json };
}

describe("POST /admin/self-register — AC14/UT17: first self-registration", () => {
  it("creates the Admin account and responds 201 when no Admin exists yet", async () => {
    const { status, json } = await callSelfRegister({ username: "the.admin", password: "SomeP@ssw0rd" });
    expect(status).toBe(201);
    expect(json).toEqual({ id: expect.any(String), username: "the.admin", role: "Admin" });
  });

  it("succeeds with no Authorization header at all — the one deliberately unauthenticated endpoint", async () => {
    const request = new NextRequest("http://localhost/api/admin/self-register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" },
      body: JSON.stringify({ username: "no.auth.header", password: "SomeP@ssw0rd" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});

describe("POST /admin/self-register — AC15/UT18: second self-registration", () => {
  it("responds 409 admin_already_exists once an Admin already exists", async () => {
    await callSelfRegister({ username: "first.admin", password: "SomeP@ssw0rd" });
    const { status, json } = await callSelfRegister({ username: "second.admin", password: "SomeP@ssw0rd" });
    expect(status).toBe(409);
    expect(json.error).toBe("admin_already_exists");
  });
});

describe("POST /admin/self-register — AC14/QT21: concurrency guarantees exactly one Admin", () => {
  it("of two simultaneous calls when no Admin exists, exactly one succeeds", async () => {
    const [first, second] = await Promise.all([
      callSelfRegister({ username: "racer.one", password: "SomeP@ssw0rd" }, "203.0.113.2"),
      callSelfRegister({ username: "racer.two", password: "SomeP@ssw0rd" }, "203.0.113.3"),
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);

    const adminCount = await User.countDocuments({ role: "Admin", deletedAt: null });
    expect(adminCount).toBe(1);
  });
});

describe("POST /admin/self-register — AC14/QT22: soft-deleted Admin does not block re-registration", () => {
  it("allows a new self-registration after the sole Admin is soft-deleted", async () => {
    const first = await callSelfRegister({ username: "old.admin", password: "SomeP@ssw0rd" });
    await User.findByIdAndUpdate(first.json.id, { deletedAt: new Date() });

    const { status, json } = await callSelfRegister({ username: "new.admin", password: "SomeP@ssw0rd" });
    expect(status).toBe(201);
    expect(json.role).toBe("Admin");
  });
});

describe("POST /admin/self-register — AC15/QT23-QT24: dedicated rate limit, 5/IP/hour", () => {
  it("all 5 requests from one IP within the window receive 409 once an Admin exists, none rate-limited yet (QT23)", async () => {
    await callSelfRegister({ username: "existing.admin", password: "SomeP@ssw0rd" }, "203.0.113.4");

    for (let i = 0; i < 5; i++) {
      const { status, json } = await callSelfRegister({ username: `attempt-${i}`, password: "SomeP@ssw0rd" }, "203.0.113.5");
      expect(status).toBe(409);
      expect(json.error).toBe("admin_already_exists");
    }
  });

  it("the 6th request from the same IP within the window is 429, distinct from the 409 (QT24)", async () => {
    await callSelfRegister({ username: "existing.admin", password: "SomeP@ssw0rd" }, "203.0.113.6");

    for (let i = 0; i < 5; i++) {
      await callSelfRegister({ username: `attempt-${i}`, password: "SomeP@ssw0rd" }, "203.0.113.7");
    }
    const { status, json } = await callSelfRegister({ username: "attempt-6", password: "SomeP@ssw0rd" }, "203.0.113.7");
    expect(status).toBe(429);
    expect(json).toEqual({ error: "rate_limited", retry_after: expect.any(Number) });
  });
});

describe("POST /admin/self-register — AC06 validation errors", () => {
  it("missing username responds 400 naming username", async () => {
    const { status, json } = await callSelfRegister({ password: "SomeP@ssw0rd" }, "203.0.113.8");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["username"]));
  });

  it("missing password responds 400 naming password", async () => {
    const { status, json } = await callSelfRegister({ username: "the.admin" }, "203.0.113.10");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["password"]));
  });
});
