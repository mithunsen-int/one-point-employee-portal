/**
 * @jest-environment jsdom
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserManagement } from "@/modules/admin-panel-ui/components/UserManagement";
import {
  fetchUsers,
  createUser,
  editUserRole,
  deleteUser,
  UserListItem,
} from "@/modules/admin-panel-ui/services/usersService";

jest.mock("../services/usersService");

const mockedFetchUsers = fetchUsers as jest.MockedFunction<typeof fetchUsers>;
const mockedCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockedEditUserRole = editUserRole as jest.MockedFunction<typeof editUserRole>;
const mockedDeleteUser = deleteUser as jest.MockedFunction<typeof deleteUser>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UserManagement />
    </QueryClientProvider>,
  );
}

const twoUsers: UserListItem[] = [
  { id: "user-1", username: "jdoe", role: "Employee" },
  { id: "user-2", username: "hr1", role: "HR" },
];

afterEach(() => {
  jest.clearAllMocks();
});

describe("UserManagement — admin-panel-ui.AC4/UT04: lists every user", () => {
  it("renders every user returned by API04", async () => {
    mockedFetchUsers.mockResolvedValue(twoUsers);

    renderWithQueryClient();

    expect(await screen.findByText("jdoe")).toBeInTheDocument();
    expect(screen.getByText("hr1")).toBeInTheDocument();
  });
});

describe("UserManagement — admin-panel-ui.AC5/UT05: create user", () => {
  it("submits the entered fields to createUser, requiring managerId when role is Employee", async () => {
    mockedFetchUsers.mockResolvedValue([{ id: "mgr-1", username: "alice.manager", role: "Manager" }]);
    mockedCreateUser.mockResolvedValue({ id: "user-3", username: "newuser", role: "Employee" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("button", { name: /create user/i });

    await user.type(screen.getByLabelText(/username/i), "newuser");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.selectOptions(screen.getByLabelText(/^role/i), "Employee");
    await user.type(screen.getByLabelText(/date of joining/i), "2026-01-01");
    await user.selectOptions(screen.getByLabelText(/manager/i), "mgr-1");
    await user.click(screen.getByRole("button", { name: /create user/i }));

    expect(mockedCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "newuser",
        password: "secret123",
        role: "Employee",
        dateOfJoining: "2026-01-01",
        managerId: "mgr-1",
      }),
    );
  });

  it("lists every available Manager by username in the selector", async () => {
    mockedFetchUsers.mockResolvedValue([
      { id: "mgr-1", username: "alice.manager", role: "Manager" },
      { id: "mgr-2", username: "bob.manager", role: "Manager" },
      { id: "emp-1", username: "jdoe", role: "Employee" },
    ]);
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("button", { name: /create user/i });
    await user.selectOptions(screen.getByLabelText(/^role/i), "Employee");

    expect(screen.getByRole("option", { name: "alice.manager" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "bob.manager" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "jdoe" })).not.toBeInTheDocument();
  });

  it("blocks submission client-side when role is Employee and managerId is left empty", async () => {
    mockedFetchUsers.mockResolvedValue([]);
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("button", { name: /create user/i });

    await user.type(screen.getByLabelText(/username/i), "newuser");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.selectOptions(screen.getByLabelText(/^role/i), "Employee");
    await user.type(screen.getByLabelText(/date of joining/i), "2026-01-01");
    await user.click(screen.getByRole("button", { name: /create user/i }));

    expect(await screen.findByText(/manager.*required/i)).toBeInTheDocument();
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  it("displays a duplicate-username error from the API on the form, not silently dropped", async () => {
    mockedFetchUsers.mockResolvedValue([]);
    mockedCreateUser.mockRejectedValue(new Error("username_exists"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("button", { name: /create user/i });

    await user.type(screen.getByLabelText(/username/i), "jdoe");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.selectOptions(screen.getByLabelText(/^role/i), "HR");
    await user.type(screen.getByLabelText(/date of joining/i), "2026-01-01");
    await user.click(screen.getByRole("button", { name: /create user/i }));

    expect(await screen.findByText(/username_exists/i)).toBeInTheDocument();
  });
});

describe("UserManagement — admin-panel-ui.AC5/UT05: edit and delete", () => {
  it("calls editUserRole with the new role when a row's Edit action is used", async () => {
    mockedFetchUsers.mockResolvedValue(twoUsers);
    mockedEditUserRole.mockResolvedValue({ id: "user-1", username: "jdoe", role: "Manager" });
    const user = userEvent.setup();

    renderWithQueryClient();
    const row = (await screen.findByText("jdoe")).closest("tr") as HTMLElement;

    await user.click(within(row).getByRole("button", { name: /edit/i }));
    await user.selectOptions(within(row).getByLabelText(/^role/i), "Manager");
    await user.click(within(row).getByRole("button", { name: /save/i }));

    expect(mockedEditUserRole).toHaveBeenCalledWith("user-1", "Manager");
  });

  it("calls deleteUser when a row's Delete action is used", async () => {
    mockedFetchUsers.mockResolvedValue(twoUsers);
    mockedDeleteUser.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithQueryClient();
    const row = (await screen.findByText("hr1")).closest("tr") as HTMLElement;

    await user.click(within(row).getByRole("button", { name: /delete/i }));

    expect(mockedDeleteUser).toHaveBeenCalledWith("user-2");
  });
});
