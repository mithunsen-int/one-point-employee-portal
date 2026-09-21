/**
 * @jest-environment jsdom
 */
import { signToken } from "@/services/auth/jwt";
import { persistSession, readSession, isSessionExpired, clearSession } from "@/shared/auth/session";

const ORIGINAL_ENV = process.env;

beforeAll(() => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
});

afterEach(() => {
  localStorage.clear();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("persistSession / readSession — stakeholder-panel-ui.AC1 support: token + role, expiresAt computed from expires_in", () => {
  it("stores the token and computes expiresAt from expiresInSeconds", () => {
    const token = signToken({ userId: "user-1", role: "Employee" });
    const before = Date.now();

    persistSession(token, 900);

    const session = readSession();
    expect(session).not.toBeNull();
    expect(session?.token).toBe(token);
    expect(session?.expiresAt).toBeGreaterThanOrEqual(before + 900 * 1000);
    expect(session?.expiresAt).toBeLessThanOrEqual(Date.now() + 900 * 1000 + 1000);
  });

  it("decodes the role from the stored token, for the caller (e.g. the Login screen) to decide routing", () => {
    const token = signToken({ userId: "user-2", role: "Admin" });

    persistSession(token, 900);

    expect(readSession()?.role).toBe("Admin");
  });
});

describe("readSession — stakeholder-panel-ui.AC10/admin-panel-ui.AC9 support: no session state", () => {
  it("returns null when no session has ever been stored", () => {
    expect(readSession()).toBeNull();
  });
});

describe("readSession / isSessionExpired — corrupted storage (admin-panel-ui.QT17/QT19, stakeholder-panel-ui.QT22 support)", () => {
  it("readSession returns null, not a thrown error, when the stored token is not a valid JWT", () => {
    localStorage.setItem("stakeholder-panel-ui.session.token", "not-a-jwt");
    localStorage.setItem("stakeholder-panel-ui.session.expiresAt", String(Date.now() + 900 * 1000));

    expect(() => readSession()).not.toThrow();
    expect(readSession()).toBeNull();
  });

  it("isSessionExpired treats a corrupted token as expired, not as a crash", () => {
    localStorage.setItem("stakeholder-panel-ui.session.token", "not-a-jwt");
    localStorage.setItem("stakeholder-panel-ui.session.expiresAt", String(Date.now() + 900 * 1000));

    expect(() => isSessionExpired()).not.toThrow();
    expect(isSessionExpired()).toBe(true);
  });

  it("isSessionExpired treats a non-numeric stored expiresAt as expired, not as valid forever", () => {
    const token = signToken({ userId: "user-6", role: "Employee" });
    localStorage.setItem("stakeholder-panel-ui.session.token", token);
    localStorage.setItem("stakeholder-panel-ui.session.expiresAt", "garbage");

    expect(isSessionExpired()).toBe(true);
  });
});

describe("isSessionExpired — stakeholder-panel-ui.AC2b support", () => {
  it("returns false when the stored expiresAt is still in the future", () => {
    const token = signToken({ userId: "user-3", role: "Employee" });
    persistSession(token, 900);

    expect(isSessionExpired()).toBe(false);
  });

  it("returns true when the stored expiresAt has passed", () => {
    const token = signToken({ userId: "user-4", role: "Employee" });
    persistSession(token, -1);

    expect(isSessionExpired()).toBe(true);
  });

  it("returns true when no session exists at all, so a guard checking expiry alone still redirects safely", () => {
    expect(isSessionExpired()).toBe(true);
  });
});

describe("clearSession — stakeholder-panel-ui.AC2b (force-logout) / AC11 (voluntary logout) support", () => {
  it("removes the stored token and expiresAt, so a subsequent readSession returns null", () => {
    const token = signToken({ userId: "user-5", role: "Employee" });
    persistSession(token, 900);

    clearSession();

    expect(readSession()).toBeNull();
    expect(isSessionExpired()).toBe(true);
  });
});
