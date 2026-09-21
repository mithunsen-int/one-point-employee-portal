/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HrDecisionPanel } from "@/modules/stakeholder-panel-ui/components/HrDecisionPanel";
import { submitHrDecision } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

jest.mock("../services/transferRequestsService");

const mockedSubmitHrDecision = submitHrDecision as jest.MockedFunction<typeof submitHrDecision>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <HrDecisionPanel id="req-1" />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("HrDecisionPanel — stakeholder-panel-ui.AC7: HR Decision panel", () => {
  it("renders Approve and Reject controls", () => {
    renderWithQueryClient();

    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
  });

  it("Approve calls submitHrDecision with no reason required", async () => {
    mockedSubmitHrDecision.mockResolvedValue({ id: "req-1", status: "Pending: Payroll, IT, Facilities" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(mockedSubmitHrDecision).toHaveBeenCalledWith("req-1", { decision: "approve" }),
    );
  });

  it("Reject with an empty reason shows a validation error and does not submit", async () => {
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.click(screen.getByRole("button", { name: /reject/i }));

    expect(await screen.findByText(/reason is required/i)).toBeInTheDocument();
    expect(mockedSubmitHrDecision).not.toHaveBeenCalled();
  });

  it("Reject with a reason calls submitHrDecision with the reason", async () => {
    mockedSubmitHrDecision.mockResolvedValue({ id: "req-1", status: "Rejected" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.type(screen.getByLabelText(/reason/i), "Not eligible yet");
    await user.click(screen.getByRole("button", { name: /reject/i }));

    await waitFor(() =>
      expect(mockedSubmitHrDecision).toHaveBeenCalledWith("req-1", {
        decision: "reject",
        reason: "Not eligible yet",
      }),
    );
  });

  it("renders a server-side error via status when the decision call fails (e.g. eligibility conflict)", async () => {
    mockedSubmitHrDecision.mockRejectedValue(new Error("conflict"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.click(screen.getByRole("button", { name: /approve/i }));

    expect(await screen.findByText(/conflict/i)).toBeInTheDocument();
  });
});
