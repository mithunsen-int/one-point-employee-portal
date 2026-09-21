/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signToken } from "@/services/auth/jwt";
import { persistSession, readSession } from "@/shared/auth/session";
import { StakeholderPanelLayout } from "@/modules/stakeholder-panel-ui/components/StakeholderPanelLayout";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const ORIGINAL_ENV = process.env;

beforeAll(() => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

function renderLayout() {
  return render(
    <StakeholderPanelLayout>
      <div>Protected content</div>
    </StakeholderPanelLayout>,
  );
}

describe("StakeholderPanelLayout — stakeholder-panel-ui.AC10/UT10: no session", () => {
  it("redirects to Login and does not render children when no session exists", async () => {
    renderLayout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects to Login when the stored session is corrupted, not a crash", async () => {
    localStorage.setItem("stakeholder-panel-ui.session.token", "not-a-jwt");
    localStorage.setItem("stakeholder-panel-ui.session.expiresAt", String(Date.now() + 900 * 1000));

    renderLayout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});

describe("StakeholderPanelLayout — happy path: any authenticated non-Admin role", () => {
  it.each(["Employee", "Manager", "HR", "Payroll", "IT", "Facilities"])(
    "renders children for an authenticated %s session, no redirect",
    async (role) => {
      const token = signToken({ userId: "user-1", role });
      persistSession(token, 900);

      renderLayout();

      await screen.findByText("Protected content");
      expect(replace).not.toHaveBeenCalled();
    },
  );
});

describe("StakeholderPanelLayout — stakeholder-panel-ui.AC13/UT13: navigation bar", () => {
  it("shows Submit Request only for an Employee, alongside My Requests (UT13)", async () => {
    const token = signToken({ userId: "user-3", role: "Employee" });
    persistSession(token, 900);

    renderLayout();
    await screen.findByText("Protected content");

    expect(screen.getByRole("link", { name: /my requests/i })).toHaveAttribute("href", "/my-requests");
    expect(screen.getByRole("link", { name: /submit request/i })).toHaveAttribute(
      "href",
      "/transfer-requests/new",
    );
  });

  it.each(["Manager", "HR", "Payroll", "IT", "Facilities"])(
    "does not show Submit Request for %s, only My Requests (UT13b)",
    async (role) => {
      const token = signToken({ userId: "user-4", role });
      persistSession(token, 900);

      renderLayout();
      await screen.findByText("Protected content");

      expect(screen.getByRole("link", { name: /my requests/i })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /submit request/i })).not.toBeInTheDocument();
    },
  );
});

describe("StakeholderPanelLayout — stakeholder-panel-ui.AC11/UT11: Logout control", () => {
  it("clears the session and redirects to Login when Logout is clicked", async () => {
    const token = signToken({ userId: "user-2", role: "Employee" });
    persistSession(token, 900);
    const user = userEvent.setup();

    renderLayout();
    await screen.findByText("Protected content");

    await user.click(screen.getByRole("button", { name: /logout/i }));

    expect(readSession()).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
