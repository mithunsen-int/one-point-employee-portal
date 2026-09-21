/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PayrollTaskForm } from "@/modules/stakeholder-panel-ui/components/PayrollTaskForm";
import { submitPayrollTask } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

jest.mock("../services/transferRequestsService");

const mockedSubmitPayrollTask = submitPayrollTask as jest.MockedFunction<typeof submitPayrollTask>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PayrollTaskForm id="req-1" />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("PayrollTaskForm — stakeholder-panel-ui.AC8: Payroll task-completion form", () => {
  it("renders the action selector and the update fields by default", () => {
    renderWithQueryClient();

    expect(screen.getByLabelText(/action/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/salary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/compensation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tax/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cost center/i)).toBeInTheDocument();
  });

  it("blocks submit with empty update fields, showing required errors", async () => {
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.click(screen.getByRole("button", { name: /complete task/i }));

    expect(await screen.findByText(/salary is required/i)).toBeInTheDocument();
    expect(mockedSubmitPayrollTask).not.toHaveBeenCalled();
  });

  it("submits the filled update fields", async () => {
    mockedSubmitPayrollTask.mockResolvedValue({ id: "req-1", payrollTaskStatus: "Completed" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.type(screen.getByLabelText(/salary/i), "60000");
    await user.type(screen.getByLabelText(/compensation/i), "Standard package");
    await user.type(screen.getByLabelText(/tax/i), "Tax bracket B");
    await user.type(screen.getByLabelText(/cost center/i), "CC-102");
    await user.click(screen.getByRole("button", { name: /complete task/i }));

    await waitFor(() =>
      expect(mockedSubmitPayrollTask).toHaveBeenCalledWith("req-1", {
        action: "update",
        salary: "60000",
        compensation: "Standard package",
        tax: "Tax bracket B",
        costCenter: "CC-102",
      }),
    );
  });

  it("selecting No Action Needed hides the update fields and submits with no other fields", async () => {
    mockedSubmitPayrollTask.mockResolvedValue({ id: "req-1", payrollTaskStatus: "Completed" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.selectOptions(screen.getByLabelText(/action/i), "no_action_needed");
    expect(screen.queryByLabelText(/salary/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /complete task/i }));

    await waitFor(() =>
      expect(mockedSubmitPayrollTask).toHaveBeenCalledWith("req-1", { action: "no_action_needed" }),
    );
  });

  it("renders a server-side error via status when the call fails", async () => {
    mockedSubmitPayrollTask.mockRejectedValue(new Error("conflict"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.selectOptions(screen.getByLabelText(/action/i), "no_action_needed");
    await user.click(screen.getByRole("button", { name: /complete task/i }));

    expect(await screen.findByText(/conflict/i)).toBeInTheDocument();
  });
});
