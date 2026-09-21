/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ItTaskForm } from "@/modules/stakeholder-panel-ui/components/ItTaskForm";
import { submitItTask } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

jest.mock("../services/transferRequestsService");

const mockedSubmitItTask = submitItTask as jest.MockedFunction<typeof submitItTask>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ItTaskForm id="req-1" />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("ItTaskForm — stakeholder-panel-ui.AC8: IT task-completion form", () => {
  it("renders the systemsAccess, permissions, and devices fields, with no No Action Needed option", () => {
    renderWithQueryClient();

    expect(screen.getByLabelText(/systems access/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/permissions/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/devices/i)).toBeInTheDocument();
    expect(screen.queryByText(/no action needed/i)).not.toBeInTheDocument();
  });

  it("blocks submit with empty fields, showing required errors", async () => {
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.click(screen.getByRole("button", { name: /complete task/i }));

    expect(await screen.findByText(/systems access is required/i)).toBeInTheDocument();
    expect(mockedSubmitItTask).not.toHaveBeenCalled();
  });

  it("submits comma-separated entries split into trimmed arrays", async () => {
    mockedSubmitItTask.mockResolvedValue({ id: "req-1", itTaskStatus: "Completed" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.type(screen.getByLabelText(/systems access/i), "VPN, Email ");
    await user.type(screen.getByLabelText(/permissions/i), "Admin,ReadOnly");
    await user.type(screen.getByLabelText(/devices/i), "Laptop");
    await user.click(screen.getByRole("button", { name: /complete task/i }));

    await waitFor(() =>
      expect(mockedSubmitItTask).toHaveBeenCalledWith("req-1", {
        systemsAccess: ["VPN", "Email"],
        permissions: ["Admin", "ReadOnly"],
        devices: ["Laptop"],
      }),
    );
  });

  it("renders a server-side error via status when the call fails", async () => {
    mockedSubmitItTask.mockRejectedValue(new Error("conflict"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.type(screen.getByLabelText(/systems access/i), "VPN");
    await user.type(screen.getByLabelText(/permissions/i), "Admin");
    await user.type(screen.getByLabelText(/devices/i), "Laptop");
    await user.click(screen.getByRole("button", { name: /complete task/i }));

    expect(await screen.findByText(/conflict/i)).toBeInTheDocument();
  });
});
