/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManagerDecisionPanel } from "@/modules/stakeholder-panel-ui/components/ManagerDecisionPanel";
import { submitManagerDecision } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

jest.mock("../services/transferRequestsService");

const mockedSubmitManagerDecision = submitManagerDecision as jest.MockedFunction<typeof submitManagerDecision>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ManagerDecisionPanel id="req-1" />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("ManagerDecisionPanel — stakeholder-panel-ui.AC6: Manager Decision panel", () => {
  it("renders Approve and Reject controls", () => {
    renderWithQueryClient();

    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
  });

  it("Approve calls submitManagerDecision with no reason required", async () => {
    mockedSubmitManagerDecision.mockResolvedValue({ id: "req-1", status: "Pending: HR" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(mockedSubmitManagerDecision).toHaveBeenCalledWith("req-1", { decision: "approve" }),
    );
  });

  it("Reject with an empty reason shows a validation error and does not submit", async () => {
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.click(screen.getByRole("button", { name: /reject/i }));

    expect(await screen.findByText(/reason is required/i)).toBeInTheDocument();
    expect(mockedSubmitManagerDecision).not.toHaveBeenCalled();
  });

  it("Reject with a reason calls submitManagerDecision with the reason", async () => {
    mockedSubmitManagerDecision.mockResolvedValue({ id: "req-1", status: "Rejected" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.type(screen.getByLabelText(/reason/i), "Not a good fit for the team");
    await user.click(screen.getByRole("button", { name: /reject/i }));

    await waitFor(() =>
      expect(mockedSubmitManagerDecision).toHaveBeenCalledWith("req-1", {
        decision: "reject",
        reason: "Not a good fit for the team",
      }),
    );
  });

  it("renders a server-side error via status when the decision call fails", async () => {
    mockedSubmitManagerDecision.mockRejectedValue(new Error("conflict"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.click(screen.getByRole("button", { name: /approve/i }));

    expect(await screen.findByText(/conflict/i)).toBeInTheDocument();
  });
});
