/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { signToken } from "@/services/auth/jwt";
import { persistSession } from "@/shared/auth/session";
import { RequestDetail } from "@/modules/stakeholder-panel-ui/components/RequestDetail";
import {
  fetchRequestDetail,
  withdrawRequest,
  RequestDetailData,
} from "@/modules/stakeholder-panel-ui/services/transferRequestsService";
import { fetchManagers } from "@/modules/stakeholder-panel-ui/services/managersLookupService";

jest.mock("../services/transferRequestsService");
jest.mock("../services/managersLookupService");

const mockedFetchManagers = fetchManagers as jest.MockedFunction<typeof fetchManagers>;

const ORIGINAL_ENV = process.env;

beforeAll(() => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

function loginAs(role: string) {
  const token = signToken({ userId: "user-1", role });
  persistSession(token, 900);
}

const mockedFetchRequestDetail = fetchRequestDetail as jest.MockedFunction<typeof fetchRequestDetail>;
const mockedWithdrawRequest = withdrawRequest as jest.MockedFunction<typeof withdrawRequest>;

function renderWithQueryClient(id: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RequestDetail id={id} />
    </QueryClientProvider>,
  );
}

const pendingManagerDetail: RequestDetailData = {
  id: "req-1",
  status: "Pending: Manager",
  actionHistory: [{ actor: "jdoe", action: "submitted", timestamp: "2026-01-01T00:00:00.000Z" }],
  pendingStakeholders: ["Manager"],
};

beforeEach(() => {
  loginAs("Employee");
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("RequestDetail — stakeholder-panel-ui.AC4/UT04: own-status view", () => {
  it("renders status, action history, and pending stakeholders", async () => {
    mockedFetchRequestDetail.mockResolvedValue(pendingManagerDetail);

    renderWithQueryClient("req-1");

    expect(await screen.findByText(/Pending: Manager/)).toBeInTheDocument();
    expect(screen.getByText(/submitted/)).toBeInTheDocument();
    expect(screen.getByText(/jdoe/)).toBeInTheDocument();
    expect(screen.getByText("Manager", { selector: "li" })).toBeInTheDocument();
  });

  it("renders an explicit 'no actions yet' state for an empty actionHistory", async () => {
    mockedFetchRequestDetail.mockResolvedValue({ ...pendingManagerDetail, actionHistory: [] });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Manager/);
    expect(screen.getByText(/no actions yet/i)).toBeInTheDocument();
  });
});

describe("RequestDetail — stakeholder-panel-ui.AC5/UT05: Withdraw, shown only while Pending: Manager", () => {
  it("shows the Withdraw action when status is Pending: Manager, and calls withdrawRequest on click", async () => {
    mockedFetchRequestDetail.mockResolvedValue(pendingManagerDetail);
    mockedWithdrawRequest.mockResolvedValue({ id: "req-1", status: "Withdrawn" });
    const user = userEvent.setup();

    renderWithQueryClient("req-1");
    const withdrawButton = await screen.findByRole("button", { name: /withdraw/i });
    await user.click(withdrawButton);

    await waitFor(() => expect(mockedWithdrawRequest).toHaveBeenCalledWith("req-1"));
  });

  it("does not show the Withdraw action for any other status", async () => {
    mockedFetchRequestDetail.mockResolvedValue({ ...pendingManagerDetail, status: "Pending: HR" });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: HR/);
    expect(screen.queryByRole("button", { name: /withdraw/i })).not.toBeInTheDocument();
  });
});

describe("RequestDetail — stakeholder-panel-ui.AC6/T06: Manager Decision panel shown only for the assigned Manager", () => {
  it("shows the Manager Decision panel when the viewer is a Manager and status is Pending: Manager", async () => {
    loginAs("Manager");
    mockedFetchRequestDetail.mockResolvedValue(pendingManagerDetail);

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Manager/);
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("does not show the Manager Decision panel for the owning Employee", async () => {
    mockedFetchRequestDetail.mockResolvedValue(pendingManagerDetail);

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Manager/);
    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
  });

  it("does not show the Manager Decision panel once the request has moved past Pending: Manager", async () => {
    loginAs("Manager");
    mockedFetchRequestDetail.mockResolvedValue({ ...pendingManagerDetail, status: "Pending: HR" });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: HR/);
    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
  });
});

describe("RequestDetail — stakeholder-panel-ui.AC7/T07: HR Decision panel shown only for HR while Pending: HR", () => {
  it("shows the HR Decision panel when the viewer is HR and status is Pending: HR", async () => {
    loginAs("HR");
    mockedFetchRequestDetail.mockResolvedValue({ ...pendingManagerDetail, status: "Pending: HR", pendingStakeholders: ["HR"] });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: HR/);
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("does not show the HR Decision panel for the owning Employee", async () => {
    mockedFetchRequestDetail.mockResolvedValue({ ...pendingManagerDetail, status: "Pending: HR", pendingStakeholders: ["HR"] });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: HR/);
    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
  });

  it("does not show the HR Decision panel once the request has moved past Pending: HR", async () => {
    loginAs("HR");
    mockedFetchRequestDetail.mockResolvedValue({
      ...pendingManagerDetail,
      status: "Pending: Payroll, IT, Facilities",
      pendingStakeholders: ["Payroll", "IT", "Facilities"],
    });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Payroll, IT, Facilities/);
    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
  });
});

describe("RequestDetail — stakeholder-panel-ui.AC8/T08: Payroll task-completion form shown only for Payroll while Pending: Payroll, IT, Facilities", () => {
  it("shows the Payroll task form when the viewer is Payroll and status is Pending: Payroll, IT, Facilities", async () => {
    loginAs("Payroll");
    mockedFetchRequestDetail.mockResolvedValue({
      ...pendingManagerDetail,
      status: "Pending: Payroll, IT, Facilities",
      pendingStakeholders: ["Payroll", "IT", "Facilities"],
    });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Payroll, IT, Facilities/);
    expect(screen.getByRole("button", { name: /complete task/i })).toBeInTheDocument();
  });

  it("does not show the Payroll task form for the owning Employee", async () => {
    mockedFetchRequestDetail.mockResolvedValue({
      ...pendingManagerDetail,
      status: "Pending: Payroll, IT, Facilities",
      pendingStakeholders: ["Payroll", "IT", "Facilities"],
    });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Payroll, IT, Facilities/);
    expect(screen.queryByRole("button", { name: /complete task/i })).not.toBeInTheDocument();
  });

  it("does not show the Payroll task form once status has moved past that stage", async () => {
    loginAs("Payroll");
    mockedFetchRequestDetail.mockResolvedValue({ ...pendingManagerDetail, status: "Completed", pendingStakeholders: [] });

    renderWithQueryClient("req-1");

    await screen.findByText("Status: Completed");
    expect(screen.queryByRole("button", { name: /complete task/i })).not.toBeInTheDocument();
  });
});

describe("RequestDetail — stakeholder-panel-ui.AC8/T09: IT task-completion form shown only for IT while Pending: Payroll, IT, Facilities", () => {
  it("shows the IT task form when the viewer is IT and status is Pending: Payroll, IT, Facilities", async () => {
    loginAs("IT");
    mockedFetchRequestDetail.mockResolvedValue({
      ...pendingManagerDetail,
      status: "Pending: Payroll, IT, Facilities",
      pendingStakeholders: ["Payroll", "IT", "Facilities"],
    });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Payroll, IT, Facilities/);
    expect(screen.getByLabelText(/systems access/i)).toBeInTheDocument();
  });

  it("does not show the IT task form for the owning Employee", async () => {
    mockedFetchRequestDetail.mockResolvedValue({
      ...pendingManagerDetail,
      status: "Pending: Payroll, IT, Facilities",
      pendingStakeholders: ["Payroll", "IT", "Facilities"],
    });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Payroll, IT, Facilities/);
    expect(screen.queryByLabelText(/systems access/i)).not.toBeInTheDocument();
  });

  it("does not show the IT task form once status has moved past that stage", async () => {
    loginAs("IT");
    mockedFetchRequestDetail.mockResolvedValue({ ...pendingManagerDetail, status: "Completed", pendingStakeholders: [] });

    renderWithQueryClient("req-1");

    await screen.findByText("Status: Completed");
    expect(screen.queryByLabelText(/systems access/i)).not.toBeInTheDocument();
  });
});

describe("RequestDetail — stakeholder-panel-ui.AC8/T10: Facilities task-completion form shown only for Facilities while Pending: Payroll, IT, Facilities", () => {
  it("shows the Facilities task form when the viewer is Facilities and status is Pending: Payroll, IT, Facilities", async () => {
    loginAs("Facilities");
    mockedFetchRequestDetail.mockResolvedValue({
      ...pendingManagerDetail,
      status: "Pending: Payroll, IT, Facilities",
      pendingStakeholders: ["Payroll", "IT", "Facilities"],
    });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Payroll, IT, Facilities/);
    expect(screen.getByLabelText(/workspace/i)).toBeInTheDocument();
  });

  it("does not show the Facilities task form for the owning Employee", async () => {
    mockedFetchRequestDetail.mockResolvedValue({
      ...pendingManagerDetail,
      status: "Pending: Payroll, IT, Facilities",
      pendingStakeholders: ["Payroll", "IT", "Facilities"],
    });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Payroll, IT, Facilities/);
    expect(screen.queryByLabelText(/workspace/i)).not.toBeInTheDocument();
  });

  it("does not show the Facilities task form once status has moved past that stage", async () => {
    loginAs("Facilities");
    mockedFetchRequestDetail.mockResolvedValue({ ...pendingManagerDetail, status: "Completed", pendingStakeholders: [] });

    renderWithQueryClient("req-1");

    await screen.findByText("Status: Completed");
    expect(screen.queryByLabelText(/workspace/i)).not.toBeInTheDocument();
  });
});

describe("RequestDetail — stakeholder-panel-ui.AC9/T11: HR Final Mapping panel shown only for HR while Pending: Transfer (internal-transfer-workflow.AC25, added 2026-09-20)", () => {
  beforeEach(() => {
    mockedFetchManagers.mockResolvedValue([{ id: "mgr-1", username: "alice.manager", role: "Manager" }]);
  });

  it("shows the HR Final Mapping panel when the viewer is HR and status is Pending: Transfer", async () => {
    loginAs("HR");
    mockedFetchRequestDetail.mockResolvedValue({
      ...pendingManagerDetail,
      status: "Pending: Transfer",
      pendingStakeholders: ["HR"],
    });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Transfer/);
    expect(await screen.findByRole("button", { name: /complete final mapping/i })).toBeInTheDocument();
  });

  it("does not show the HR Final Mapping panel for the owning Employee", async () => {
    mockedFetchRequestDetail.mockResolvedValue({
      ...pendingManagerDetail,
      status: "Pending: Transfer",
      pendingStakeholders: ["HR"],
    });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Transfer/);
    expect(screen.queryByRole("button", { name: /complete final mapping/i })).not.toBeInTheDocument();
  });

  it("does not show the HR Final Mapping panel while HR is still deciding (Pending: HR)", async () => {
    loginAs("HR");
    mockedFetchRequestDetail.mockResolvedValue({ ...pendingManagerDetail, status: "Pending: HR", pendingStakeholders: ["HR"] });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: HR/);
    expect(screen.queryByRole("button", { name: /complete final mapping/i })).not.toBeInTheDocument();
  });

  it("does not show the HR Final Mapping panel while parallel tasks are still in progress (Pending: Payroll, IT, Facilities)", async () => {
    loginAs("HR");
    mockedFetchRequestDetail.mockResolvedValue({
      ...pendingManagerDetail,
      status: "Pending: Payroll, IT, Facilities",
      pendingStakeholders: ["Payroll", "IT", "Facilities"],
    });

    renderWithQueryClient("req-1");

    await screen.findByText(/Pending: Payroll, IT, Facilities/);
    expect(screen.queryByRole("button", { name: /complete final mapping/i })).not.toBeInTheDocument();
  });
});

describe("RequestDetail — loading and error states", () => {
  it("renders a loading indicator before the data resolves", () => {
    mockedFetchRequestDetail.mockReturnValue(new Promise(() => {}));

    renderWithQueryClient("req-1");

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders an error state, not a crash, when the fetch rejects", async () => {
    mockedFetchRequestDetail.mockRejectedValue(new Error("network error"));

    renderWithQueryClient("req-1");

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
