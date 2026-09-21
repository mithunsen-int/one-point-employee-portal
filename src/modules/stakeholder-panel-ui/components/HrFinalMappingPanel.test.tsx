/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HrFinalMappingPanel } from "@/modules/stakeholder-panel-ui/components/HrFinalMappingPanel";
import { submitHrFinalMapping } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";
import { fetchManagers } from "@/modules/stakeholder-panel-ui/services/managersLookupService";

jest.mock("../services/transferRequestsService");
jest.mock("../services/managersLookupService");

const mockedSubmitHrFinalMapping = submitHrFinalMapping as jest.MockedFunction<typeof submitHrFinalMapping>;
const mockedFetchManagers = fetchManagers as jest.MockedFunction<typeof fetchManagers>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <HrFinalMappingPanel id="req-1" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockedFetchManagers.mockResolvedValue([
    { id: "mgr-1", username: "alice.manager", role: "Manager" },
    { id: "mgr-2", username: "bob.manager", role: "Manager" },
  ]);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("HrFinalMappingPanel — stakeholder-panel-ui.AC9: HR Final Mapping panel", () => {
  it("renders a Manager selector populated from useManagersList", async () => {
    renderWithQueryClient();

    expect(await screen.findByRole("option", { name: "alice.manager" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "bob.manager" })).toBeInTheDocument();
  });

  it("blocks submit with no manager selected, showing a validation error", async () => {
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("option", { name: "alice.manager" });
    await user.click(screen.getByRole("button", { name: /complete final mapping/i }));

    expect(await screen.findByText(/manager is required/i)).toBeInTheDocument();
    expect(mockedSubmitHrFinalMapping).not.toHaveBeenCalled();
  });

  it("submits the chosen manager's id", async () => {
    mockedSubmitHrFinalMapping.mockResolvedValue({ id: "req-1", status: "Completed" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("option", { name: "bob.manager" });
    await user.selectOptions(screen.getByLabelText(/manager/i), "mgr-2");
    await user.click(screen.getByRole("button", { name: /complete final mapping/i }));

    await waitFor(() =>
      expect(mockedSubmitHrFinalMapping).toHaveBeenCalledWith("req-1", { newManagerId: "mgr-2" }),
    );
  });

  it("renders a server-side error via status when the call fails", async () => {
    mockedSubmitHrFinalMapping.mockRejectedValue(new Error("conflict"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("option", { name: "alice.manager" });
    await user.selectOptions(screen.getByLabelText(/manager/i), "mgr-1");
    await user.click(screen.getByRole("button", { name: /complete final mapping/i }));

    expect(await screen.findByText(/conflict/i)).toBeInTheDocument();
  });
});
