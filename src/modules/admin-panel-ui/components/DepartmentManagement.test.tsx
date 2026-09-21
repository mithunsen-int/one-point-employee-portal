/**
 * @jest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DepartmentManagement } from "@/modules/admin-panel-ui/components/DepartmentManagement";
import {
  fetchDepartments,
  createDepartment,
  editDepartment,
  deleteDepartment,
  DepartmentListItem,
} from "@/modules/admin-panel-ui/services/orgStructureService";

jest.mock("../services/orgStructureService");

const mockedFetchDepartments = fetchDepartments as jest.MockedFunction<typeof fetchDepartments>;
const mockedCreateDepartment = createDepartment as jest.MockedFunction<typeof createDepartment>;
const mockedEditDepartment = editDepartment as jest.MockedFunction<typeof editDepartment>;
const mockedDeleteDepartment = deleteDepartment as jest.MockedFunction<typeof deleteDepartment>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DepartmentManagement />
    </QueryClientProvider>,
  );
}

const twoDepartments: DepartmentListItem[] = [
  { id: "dept-1", name: "Engineering" },
  { id: "dept-2", name: "Sales" },
];

afterEach(() => {
  jest.clearAllMocks();
});

describe("DepartmentManagement — admin-panel-ui.AC6: lists every department", () => {
  it("renders every department returned by API04", async () => {
    mockedFetchDepartments.mockResolvedValue(twoDepartments);

    renderWithQueryClient();

    expect(await screen.findByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });
});

describe("DepartmentManagement — admin-panel-ui.AC6: create", () => {
  it("submits the entered name to createDepartment", async () => {
    mockedFetchDepartments.mockResolvedValue([]);
    mockedCreateDepartment.mockResolvedValue({ id: "dept-3", name: "Marketing" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("button", { name: /create department/i });

    await user.type(screen.getByLabelText(/name/i), "Marketing");
    await user.click(screen.getByRole("button", { name: /create department/i }));

    expect(mockedCreateDepartment).toHaveBeenCalledWith({ name: "Marketing" });
  });

  it("displays a duplicate-name error from the API on the form, not silently dropped", async () => {
    mockedFetchDepartments.mockResolvedValue([]);
    mockedCreateDepartment.mockRejectedValue(new Error("name_exists"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("button", { name: /create department/i });

    await user.type(screen.getByLabelText(/name/i), "Engineering");
    await user.click(screen.getByRole("button", { name: /create department/i }));

    expect(await screen.findByText(/name_exists/i)).toBeInTheDocument();
  });
});

describe("DepartmentManagement — admin-panel-ui.AC6: edit and delete", () => {
  it("calls editDepartment with the new name when a row's Edit action is used", async () => {
    mockedFetchDepartments.mockResolvedValue(twoDepartments);
    mockedEditDepartment.mockResolvedValue({ id: "dept-1", name: "Engineering & R&D" });
    const user = userEvent.setup();

    renderWithQueryClient();
    const row = (await screen.findByText("Engineering")).closest("tr") as HTMLElement;

    await user.click(within(row).getByRole("button", { name: /edit/i }));
    const editInput = within(row).getByLabelText(/name/i);
    await user.clear(editInput);
    await user.type(editInput, "Engineering & R&D");
    await user.click(within(row).getByRole("button", { name: /save/i }));

    expect(mockedEditDepartment).toHaveBeenCalledWith("dept-1", "Engineering & R&D");
  });

  it("calls deleteDepartment when a row's Delete action is used", async () => {
    mockedFetchDepartments.mockResolvedValue(twoDepartments);
    mockedDeleteDepartment.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithQueryClient();
    const row = (await screen.findByText("Sales")).closest("tr") as HTMLElement;

    await user.click(within(row).getByRole("button", { name: /delete/i }));

    expect(mockedDeleteDepartment).toHaveBeenCalledWith("dept-2");
  });
});
