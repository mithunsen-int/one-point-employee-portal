/**
 * @jest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { JobRoleManagement } from "@/modules/admin-panel-ui/components/JobRoleManagement";
import {
  fetchJobRoles,
  createJobRole,
  editJobRole,
  deleteJobRole,
  JobRoleListItem,
} from "@/modules/admin-panel-ui/services/orgStructureService";

jest.mock("../services/orgStructureService");

const mockedFetchJobRoles = fetchJobRoles as jest.MockedFunction<typeof fetchJobRoles>;
const mockedCreateJobRole = createJobRole as jest.MockedFunction<typeof createJobRole>;
const mockedEditJobRole = editJobRole as jest.MockedFunction<typeof editJobRole>;
const mockedDeleteJobRole = deleteJobRole as jest.MockedFunction<typeof deleteJobRole>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <JobRoleManagement />
    </QueryClientProvider>,
  );
}

const twoJobRoles: JobRoleListItem[] = [
  { id: "role-1", title: "Software Engineer" },
  { id: "role-2", title: "Recruiter" },
];

afterEach(() => {
  jest.clearAllMocks();
});

describe("JobRoleManagement — admin-panel-ui.AC7: lists every job role", () => {
  it("renders every job role returned by API09", async () => {
    mockedFetchJobRoles.mockResolvedValue(twoJobRoles);

    renderWithQueryClient();

    expect(await screen.findByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Recruiter")).toBeInTheDocument();
  });

  it("does not render any per-row 'view detail' action — no detail endpoint exists", async () => {
    mockedFetchJobRoles.mockResolvedValue(twoJobRoles);

    renderWithQueryClient();
    await screen.findByText("Software Engineer");

    expect(screen.queryByRole("button", { name: /view|detail/i })).not.toBeInTheDocument();
  });
});

describe("JobRoleManagement — admin-panel-ui.AC7: create", () => {
  it("submits the entered title to createJobRole", async () => {
    mockedFetchJobRoles.mockResolvedValue([]);
    mockedCreateJobRole.mockResolvedValue({ id: "role-3", title: "Product Manager" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("button", { name: /create job role/i });

    await user.type(screen.getByLabelText(/title/i), "Product Manager");
    await user.click(screen.getByRole("button", { name: /create job role/i }));

    expect(mockedCreateJobRole).toHaveBeenCalledWith({ title: "Product Manager" });
  });

  it("displays a duplicate-title error from the API on the form, not silently dropped — using the API's real error code (name_exists, not title_exists)", async () => {
    mockedFetchJobRoles.mockResolvedValue([]);
    mockedCreateJobRole.mockRejectedValue(new Error("name_exists"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("button", { name: /create job role/i });

    await user.type(screen.getByLabelText(/title/i), "Software Engineer");
    await user.click(screen.getByRole("button", { name: /create job role/i }));

    expect(await screen.findByText(/name_exists/i)).toBeInTheDocument();
  });
});

describe("JobRoleManagement — admin-panel-ui.AC7: edit and delete", () => {
  it("calls editJobRole with the new title when a row's Edit action is used", async () => {
    mockedFetchJobRoles.mockResolvedValue(twoJobRoles);
    mockedEditJobRole.mockResolvedValue({ id: "role-1", title: "Senior Software Engineer" });
    const user = userEvent.setup();

    renderWithQueryClient();
    const row = (await screen.findByText("Software Engineer")).closest("tr") as HTMLElement;

    await user.click(within(row).getByRole("button", { name: /edit/i }));
    const editInput = within(row).getByLabelText(/title/i);
    await user.clear(editInput);
    await user.type(editInput, "Senior Software Engineer");
    await user.click(within(row).getByRole("button", { name: /save/i }));

    expect(mockedEditJobRole).toHaveBeenCalledWith("role-1", "Senior Software Engineer");
  });

  it("calls deleteJobRole when a row's Delete action is used", async () => {
    mockedFetchJobRoles.mockResolvedValue(twoJobRoles);
    mockedDeleteJobRole.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithQueryClient();
    const row = (await screen.findByText("Recruiter")).closest("tr") as HTMLElement;

    await user.click(within(row).getByRole("button", { name: /delete/i }));

    expect(mockedDeleteJobRole).toHaveBeenCalledWith("role-2");
  });
});
