/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signToken } from "@/services/auth/jwt";
import { persistSession, readSession } from "@/shared/auth/session";
import { AdminPanelLayout } from "@/modules/admin-panel-ui/components/AdminPanelLayout";

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
    <AdminPanelLayout>
      <div>Protected content</div>
    </AdminPanelLayout>,
  );
}

describe("AdminPanelLayout — admin-panel-ui.AC9/UT09: no session", () => {
  it("redirects to Login and does not render children when no session exists", async () => {
    renderLayout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});

describe("AdminPanelLayout — admin-panel-ui.AC8/UT08/QT16: full 6-role sweep, non-Admin blocked", () => {
  it.each(["Employee", "Manager", "HR", "Payroll", "IT", "Facilities"])(
    "%s is redirected to Login, content not rendered",
    async (role) => {
      const token = signToken({ userId: "user-1", role });
      persistSession(token, 900);

      renderLayout();

      await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
      expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    },
  );
});

describe("AdminPanelLayout — admin-panel-ui.QT17/QT19: corrupted token/session treated as no session", () => {
  it("redirects to Login when the stored token is not a valid JWT (corrupted role claim)", async () => {
    localStorage.setItem("stakeholder-panel-ui.session.token", "not-a-jwt");
    localStorage.setItem("stakeholder-panel-ui.session.expiresAt", String(Date.now() + 900 * 1000));

    renderLayout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});

describe("AdminPanelLayout — admin-panel-ui.AC1(building block)/happy path: valid Admin session", () => {
  it("renders children and does not redirect when the session is a valid, unexpired Admin session", async () => {
    const token = signToken({ userId: "admin-1", role: "Admin" });
    persistSession(token, 900);

    renderLayout();

    await screen.findByText("Protected content");
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("AdminPanelLayout — admin-panel-ui.AC12/UT12: navigation bar", () => {
  it("links to all 5 screens once authorized", async () => {
    const token = signToken({ userId: "admin-3", role: "Admin" });
    persistSession(token, 900);

    renderLayout();
    await screen.findByText("Protected content");

    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /monitoring/i })).toHaveAttribute("href", "/transfer-requests");
    expect(screen.getByRole("link", { name: /user management/i })).toHaveAttribute("href", "/users");
    expect(screen.getByRole("link", { name: /department management/i })).toHaveAttribute("href", "/departments");
    expect(screen.getByRole("link", { name: /job role management/i })).toHaveAttribute("href", "/job-roles");
  });

  it("does not render the nav bar before authorization resolves", () => {
    renderLayout();

    expect(screen.queryByRole("link", { name: /dashboard/i })).not.toBeInTheDocument();
  });
});

describe("AdminPanelLayout — admin-panel-ui.AC11/UT11: Logout control", () => {
  it("clears the session and redirects to Login when Logout is clicked", async () => {
    const token = signToken({ userId: "admin-2", role: "Admin" });
    persistSession(token, 900);
    const user = userEvent.setup();

    renderLayout();
    await screen.findByText("Protected content");

    await user.click(screen.getByRole("button", { name: /logout/i }));

    expect(readSession()).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
