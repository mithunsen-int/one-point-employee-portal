/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MyRequestsList } from "@/modules/stakeholder-panel-ui/components/MyRequestsList";
import { fetchMyRequests, MyRequestsListItem } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";

jest.mock("../services/transferRequestsService");

const mockedFetchMyRequests = fetchMyRequests as jest.MockedFunction<typeof fetchMyRequests>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MyRequestsList />
    </QueryClientProvider>,
  );
}

const twoRequests: MyRequestsListItem[] = [
  {
    id: "req-1",
    status: "Pending: Manager",
    employeeId: "emp-1",
    submittedAt: "2026-01-01T00:00:00.000Z",
    payrollTaskStatus: "Pending",
    itTaskStatus: "Pending",
    facilitiesTaskStatus: "Pending",
  },
  {
    id: "req-2",
    status: "Completed",
    employeeId: "emp-1",
    submittedAt: "2026-02-01T00:00:00.000Z",
    payrollTaskStatus: "Completed",
    itTaskStatus: "Completed",
    facilitiesTaskStatus: "Completed",
  },
];

afterEach(() => {
  jest.clearAllMocks();
});

describe("MyRequestsList — stakeholder-panel-ui.AC2c: renders API10's role-filtered results, each linking to /my-requests/{id}", () => {
  it("renders 2 rows from API10, each linking to /my-requests/{id}, not /transfer-requests/{id}", async () => {
    mockedFetchMyRequests.mockResolvedValue(twoRequests);

    renderWithQueryClient();

    const linkA = await screen.findByRole("link", { name: /req-1/i });
    expect(linkA).toHaveAttribute("href", "/my-requests/req-1");

    const linkB = screen.getByRole("link", { name: /req-2/i });
    expect(linkB).toHaveAttribute("href", "/my-requests/req-2");
  });

  it("performs no client-side filtering — renders exactly what API10 returns, since filtering already happened server-side", async () => {
    mockedFetchMyRequests.mockResolvedValue(twoRequests);

    renderWithQueryClient();

    await screen.findByText(/req-1/i);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});

describe("MyRequestsList — empty list", () => {
  it("renders an explicit empty-state message when API10 returns an empty array", async () => {
    mockedFetchMyRequests.mockResolvedValue([]);

    renderWithQueryClient();

    expect(await screen.findByText(/no requests/i)).toBeInTheDocument();
  });
});

describe("MyRequestsList — loading state", () => {
  it("renders a loading indicator before the data resolves", () => {
    mockedFetchMyRequests.mockReturnValue(new Promise(() => {}));

    renderWithQueryClient();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

describe("MyRequestsList — API10 call fails", () => {
  it("renders an error state, not a crash, when the fetch rejects", async () => {
    mockedFetchMyRequests.mockRejectedValue(new Error("network error"));

    renderWithQueryClient();

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
