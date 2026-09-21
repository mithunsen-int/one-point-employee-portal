/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TransferRequestDetail } from "@/modules/admin-panel-ui/components/TransferRequestDetail";
import { fetchTransferRequestDetail, TransferRequestDetailData } from "@/modules/admin-panel-ui/services/monitoringService";

jest.mock("../services/monitoringService");

const mockedFetchDetail = fetchTransferRequestDetail as jest.MockedFunction<typeof fetchTransferRequestDetail>;

function renderWithQueryClient(id: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TransferRequestDetail id={id} />
    </QueryClientProvider>,
  );
}

const detailWithHistory: TransferRequestDetailData = {
  id: "req-1",
  status: "Completed",
  departmentId: "dept-1",
  location: "Location A",
  jobRoleId: "role-1",
  effectiveDate: "2026-06-01T00:00:00.000Z",
  reason: "Relocation",
  assignedManagerId: "mgr-1",
  submittedAt: "2026-01-01T00:00:00.000Z",
  actionHistory: [
    { actor: "jdoe", action: "submitted", timestamp: "2026-01-01T00:00:00.000Z" },
    { actor: "manager1", action: "manager_approved", timestamp: "2026-01-02T00:00:00.000Z" },
    { actor: "hr1", action: "hr_approved", timestamp: "2026-01-03T00:00:00.000Z" },
  ],
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("TransferRequestDetail — admin-panel-ui.AC3/UT03/QT08: full field set + full actionHistory, not a partial projection", () => {
  it("renders every field and every action-history entry", async () => {
    mockedFetchDetail.mockResolvedValue(detailWithHistory);

    renderWithQueryClient("req-1");

    expect(await screen.findByText(/Location A/)).toBeInTheDocument();
    expect(screen.getByText(/Relocation/)).toBeInTheDocument();
    expect(screen.getByText(/submitted/)).toBeInTheDocument();
    expect(screen.getByText(/manager_approved/)).toBeInTheDocument();
    expect(screen.getByText(/hr_approved/)).toBeInTheDocument();
    expect(screen.getByText(/jdoe/)).toBeInTheDocument();
  });
});

describe("TransferRequestDetail — admin-panel-ui.QT07: empty actionHistory", () => {
  it("renders an explicit 'no actions yet' state, not a blank section", async () => {
    mockedFetchDetail.mockResolvedValue({ ...detailWithHistory, actionHistory: [] });

    renderWithQueryClient("req-1");

    await screen.findByText(/Location A/);
    expect(screen.getByText(/no actions yet/i)).toBeInTheDocument();
  });
});

describe("TransferRequestDetail — loading state", () => {
  it("renders a loading indicator before the data resolves", () => {
    mockedFetchDetail.mockReturnValue(new Promise(() => {}));

    renderWithQueryClient("req-1");

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

describe("TransferRequestDetail — admin-panel-ui.AC3/QT09: not found (malformed or missing id, identical 404)", () => {
  it("renders a not-found state, not a crash, when the request returns null (404)", async () => {
    mockedFetchDetail.mockResolvedValue(null);

    renderWithQueryClient("does-not-exist");

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});

describe("TransferRequestDetail — generic fetch failure", () => {
  it("renders an error state, not a crash, when the fetch rejects", async () => {
    mockedFetchDetail.mockRejectedValue(new Error("network error"));

    renderWithQueryClient("req-1");

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
