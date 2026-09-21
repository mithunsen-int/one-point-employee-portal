/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FacilitiesTaskForm } from "@/modules/stakeholder-panel-ui/components/FacilitiesTaskForm";
import { submitFacilitiesTask } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

jest.mock("../services/transferRequestsService");

const mockedSubmitFacilitiesTask = submitFacilitiesTask as jest.MockedFunction<typeof submitFacilitiesTask>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FacilitiesTaskForm id="req-1" />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("FacilitiesTaskForm — stakeholder-panel-ui.AC8: Facilities task-completion form", () => {
  it("renders the workspace, officeLogistics, and locationSetup fields, with no No Action Needed option", () => {
    renderWithQueryClient();

    expect(screen.getByLabelText(/workspace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/office logistics/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location setup/i)).toBeInTheDocument();
    expect(screen.queryByText(/no action needed/i)).not.toBeInTheDocument();
  });

  it("blocks submit with empty fields, showing required errors", async () => {
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.click(screen.getByRole("button", { name: /complete task/i }));

    expect(await screen.findByText(/workspace is required/i)).toBeInTheDocument();
    expect(mockedSubmitFacilitiesTask).not.toHaveBeenCalled();
  });

  it("submits the filled fields", async () => {
    mockedSubmitFacilitiesTask.mockResolvedValue({ id: "req-1", facilitiesTaskStatus: "Completed" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.type(screen.getByLabelText(/workspace/i), "Desk 12B");
    await user.type(screen.getByLabelText(/office logistics/i), "Badge issued");
    await user.type(screen.getByLabelText(/location setup/i), "Floor 3, East Wing");
    await user.click(screen.getByRole("button", { name: /complete task/i }));

    await waitFor(() =>
      expect(mockedSubmitFacilitiesTask).toHaveBeenCalledWith("req-1", {
        workspace: "Desk 12B",
        officeLogistics: "Badge issued",
        locationSetup: "Floor 3, East Wing",
      }),
    );
  });

  it("renders a server-side error via status when the call fails", async () => {
    mockedSubmitFacilitiesTask.mockRejectedValue(new Error("conflict"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await user.type(screen.getByLabelText(/workspace/i), "Desk 12B");
    await user.type(screen.getByLabelText(/office logistics/i), "Badge issued");
    await user.type(screen.getByLabelText(/location setup/i), "Floor 3, East Wing");
    await user.click(screen.getByRole("button", { name: /complete task/i }));

    expect(await screen.findByText(/conflict/i)).toBeInTheDocument();
  });
});
