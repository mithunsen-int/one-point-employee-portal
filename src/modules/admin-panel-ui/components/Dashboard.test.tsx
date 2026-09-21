/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "@/modules/admin-panel-ui/components/Dashboard";
import { fetchDashboard, DashboardSummary } from "@/modules/admin-panel-ui/services/dashboardService";

jest.mock("../services/dashboardService");

const mockedFetchDashboard = fetchDashboard as jest.MockedFunction<typeof fetchDashboard>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>,
  );
}

const fullData: DashboardSummary = {
  userCounts: { Employee: 12, HR: 2, Manager: 3, Payroll: 1, IT: 1, Facilities: 1 },
  totalTransferRequests: 7,
  statusBreakdown: {
    "Pending: Manager": 2,
    "Pending: HR": 1,
    "Pending: Payroll, IT, Facilities": 1,
    Rejected: 1,
    Withdrawn: 1,
    Completed: 1,
  },
};

const zeroData: DashboardSummary = {
  userCounts: { Employee: 0, HR: 0, Manager: 0, Payroll: 0, IT: 0, Facilities: 0 },
  totalTransferRequests: 0,
  statusBreakdown: {
    "Pending: Manager": 0,
    "Pending: HR": 0,
    "Pending: Payroll, IT, Facilities": 0,
    Rejected: 0,
    Withdrawn: 0,
    Completed: 0,
  },
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("Dashboard — admin-panel-ui.AC1/UT01: renders API01 data", () => {
  it("displays userCounts, totalTransferRequests, and statusBreakdown from the fetched response", async () => {
    mockedFetchDashboard.mockResolvedValue(fullData);

    renderWithQueryClient();

    expect(await screen.findByText(/Employee/)).toBeInTheDocument();
    expect(screen.getByText(/12/)).toBeInTheDocument();
    expect(screen.getByText(/7/)).toBeInTheDocument();
    expect(screen.getByText(/Pending: Manager/)).toBeInTheDocument();
  });
});

describe("Dashboard — admin-panel-ui.QT01: zero counts rendered as 0, not blank/omitted", () => {
  it("renders every count as 0 when the system has no data yet", async () => {
    mockedFetchDashboard.mockResolvedValue(zeroData);

    renderWithQueryClient();

    await screen.findByText(/Employee/);
    const zeroOccurrences = screen.getAllByText(/:\s*0/);
    expect(zeroOccurrences.length).toBeGreaterThanOrEqual(Object.keys(zeroData.userCounts).length);
  });
});

describe("Dashboard — loading state", () => {
  it("renders a loading indicator before the data resolves", () => {
    mockedFetchDashboard.mockReturnValue(new Promise(() => {}));

    renderWithQueryClient();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

describe("Dashboard — admin-panel-ui.QT03: API01 call fails", () => {
  it("renders an error state, not a crash, when the fetch rejects", async () => {
    mockedFetchDashboard.mockRejectedValue(new Error("network error"));

    renderWithQueryClient();

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
