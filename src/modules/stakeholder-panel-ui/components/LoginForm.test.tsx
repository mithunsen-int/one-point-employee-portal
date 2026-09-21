/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "@/modules/stakeholder-panel-ui/components/LoginForm";
import { login } from "@/modules/stakeholder-panel-ui/services/authService";
import { readSession, persistSession } from "@/shared/auth/session";

jest.mock("../services/authService");

const mockedLogin = login as jest.MockedFunction<typeof login>;

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("LoginForm — stakeholder-panel-ui.AC1/UT01: valid credentials", () => {
  it("persists the session and routes an Employee into this panel's landing screen, not admin-panel-ui", async () => {
    const token = "header.eyJ1c2VySWQiOiJ1LTEiLCJyb2xlIjoiRW1wbG95ZWUifQ.sig";
    mockedLogin.mockResolvedValue({ access_token: token, token_type: "Bearer", expires_in: 900 });
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.type(screen.getByLabelText(/username/i), "jdoe");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/my-requests"));
    expect(readSession()?.token).toBe(token);
  });

  it("routes an Admin to admin-panel-ui's dashboard, not this panel", async () => {
    const token = "header.eyJ1c2VySWQiOiJhLTEiLCJyb2xlIjoiQWRtaW4ifQ.sig";
    mockedLogin.mockResolvedValue({ access_token: token, token_type: "Bearer", expires_in: 900 });
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.type(screen.getByLabelText(/username/i), "admin1");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});

describe("LoginForm — stakeholder-panel-ui.QT02 (resolved): client-side empty-field validation", () => {
  it("blocks submission and shows field errors when both fields are left empty, without calling the API", async () => {
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it("blocks submission when only the password is left empty", async () => {
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.type(screen.getByLabelText(/username/i), "jdoe");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });
});

describe("LoginForm — stakeholder-panel-ui.AC12/UT12d: already-authenticated session visits Login directly", () => {
  it("redirects to the role's home page instead of rendering the form (Employee)", async () => {
    persistSession("header.eyJ1c2VySWQiOiJ1LTEiLCJyb2xlIjoiRW1wbG95ZWUifQ.sig", 900);

    renderWithQueryClient();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/my-requests"));
  });

  it("redirects to /dashboard for an already-authenticated Admin", async () => {
    persistSession("header.eyJ1c2VySWQiOiJhLTEiLCJyb2xlIjoiQWRtaW4ifQ.sig", 900);

    renderWithQueryClient();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});

describe("LoginForm — stakeholder-panel-ui.AC2/UT02: invalid credentials", () => {
  it("shows an on-screen error and does not establish a session on a 401", async () => {
    mockedLogin.mockRejectedValue(new Error("invalid_credentials"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.type(screen.getByLabelText(/username/i), "jdoe");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/invalid_credentials/i)).toBeInTheDocument();
    expect(readSession()).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });
});
