/**
 * @jest-environment jsdom
 */
import { signToken } from "@/services/auth/jwt";
import { persistSession, readSession } from "@/shared/auth/session";
import { authenticatedFetch } from "@/shared/auth/authenticatedFetch";
import { redirectToLogin } from "@/shared/auth/redirectToLogin";

jest.mock("@/shared/auth/redirectToLogin");

const ORIGINAL_ENV = process.env;

beforeAll(() => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
});

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("authenticatedFetch — admin-panel-ui.AC10 / stakeholder-panel-ui.AC2b support", () => {
  it("attaches the Authorization header and calls fetch when the session is valid and not expired", async () => {
    const token = signToken({ userId: "user-1", role: "Admin" });
    persistSession(token, 900);
    (global.fetch as jest.Mock).mockResolvedValue({ status: 200 });

    await authenticatedFetch("/api/admin/dashboard");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/dashboard",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${token}` }) }),
    );
  });

  it("does not call fetch, clears the session, and redirects to Login when expiresAt has passed", async () => {
    const token = signToken({ userId: "user-2", role: "Admin" });
    persistSession(token, -1);

    await expect(authenticatedFetch("/api/admin/dashboard")).rejects.toThrow();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(readSession()).toBeNull();
    expect(redirectToLogin).toHaveBeenCalled();
  });

  it("does not call fetch, clears the session (no-op), and redirects to Login when no session exists at all", async () => {
    await expect(authenticatedFetch("/api/admin/dashboard")).rejects.toThrow();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(redirectToLogin).toHaveBeenCalled();
  });

  it("clears the session and redirects to Login when the API responds 401, even though the stored expiresAt was still valid (fallback per stakeholder-panel-ui.AC2b)", async () => {
    const token = signToken({ userId: "user-3", role: "Admin" });
    persistSession(token, 900);
    (global.fetch as jest.Mock).mockResolvedValue({ status: 401 });

    await authenticatedFetch("/api/admin/dashboard");

    expect(readSession()).toBeNull();
    expect(redirectToLogin).toHaveBeenCalled();
  });
});
