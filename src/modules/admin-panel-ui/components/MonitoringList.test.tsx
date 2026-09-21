/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MonitoringList } from "@/modules/admin-panel-ui/components/MonitoringList";
import { fetchTransferRequestsList, TransferRequestListItem } from "@/modules/admin-panel-ui/services/monitoringService";

jest.mock("../services/monitoringService");

const mockedFetchList = fetchTransferRequestsList as jest.MockedFunction<typeof fetchTransferRequestsList>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MonitoringList />
    </QueryClientProvider>,
  );
}

const twoRequests: TransferRequestListItem[] = [
  { id: "req-1", status: "Pending: Manager", employeeId: "emp-1", submittedAt: "2026-01-01T00:00:00.000Z" },
  { id: "req-2", status: "Completed", employeeId: "emp-2", submittedAt: "2026-02-01T00:00:00.000Z" },
];

afterEach(() => {
  jest.clearAllMocks();
});

describe("MonitoringList — admin-panel-ui.AC2/UT02: renders every request, each linking to its detail view", () => {
  it("renders 2 rows from API02, each linking to /transfer-requests/{id}", async () => {
    mockedFetchList.mockResolvedValue(twoRequests);

    renderWithQueryClient();

    const linkA = await screen.findByRole("link", { name: /req-1/i });
    expect(linkA).toHaveAttribute("href", "/transfer-requests/req-1");

    const linkB = screen.getByRole("link", { name: /req-2/i });
    expect(linkB).toHaveAttribute("href", "/transfer-requests/req-2");
  });
});

describe("MonitoringList — admin-panel-ui.QT04: empty list", () => {
  it("renders an explicit empty-state message when API02 returns an empty array", async () => {
    mockedFetchList.mockResolvedValue([]);

    renderWithQueryClient();

    expect(await screen.findByText(/no transfer requests/i)).toBeInTheDocument();
  });
});

describe("MonitoringList — loading state", () => {
  it("renders a loading indicator before the data resolves", () => {
    mockedFetchList.mockReturnValue(new Promise(() => {}));

    renderWithQueryClient();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

describe("MonitoringList — admin-panel-ui.QT06: API02 call fails", () => {
  it("renders an error state, not a crash, when the fetch rejects", async () => {
    mockedFetchList.mockRejectedValue(new Error("network error"));

    renderWithQueryClient();

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
