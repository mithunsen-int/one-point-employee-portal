/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { signToken } from "@/services/auth/jwt";
import { persistSession } from "@/shared/auth/session";
import { SubmitRequestForm } from "@/modules/stakeholder-panel-ui/components/SubmitRequestForm";
import { submitRequest } from "@/modules/stakeholder-panel-ui/services/transferRequestsService";
import {
  fetchDepartments,
  fetchJobRoles,
} from "@/modules/stakeholder-panel-ui/services/orgStructureLookupService";

const ORIGINAL_ENV = process.env;

beforeAll(() => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

jest.mock("../services/transferRequestsService");
jest.mock("../services/orgStructureLookupService");

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const mockedSubmitRequest = submitRequest as jest.MockedFunction<typeof submitRequest>;
const mockedFetchDepartments = fetchDepartments as jest.MockedFunction<typeof fetchDepartments>;
const mockedFetchJobRoles = fetchJobRoles as jest.MockedFunction<typeof fetchJobRoles>;

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SubmitRequestForm />
    </QueryClientProvider>,
  );
}

function loginAs(role: string) {
  const token = signToken({ userId: "user-1", role });
  persistSession(token, 900);
}

beforeEach(() => {
  loginAs("Employee");
  mockedFetchDepartments.mockResolvedValue([{ id: "dept-1", name: "Engineering" }]);
  mockedFetchJobRoles.mockResolvedValue([{ id: "role-1", title: "Software Engineer" }]);
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("option", { name: "Engineering" });
  await user.selectOptions(screen.getByLabelText(/department/i), "dept-1");
  await user.selectOptions(screen.getByLabelText(/location/i), "Location A");
  await user.selectOptions(screen.getByLabelText(/job role/i), "role-1");
  await user.type(screen.getByLabelText(/effective date/i), "2026-06-01");
  await user.click(screen.getByRole("button", { name: /submit request/i }));
}

describe("SubmitRequestForm — stakeholder-panel-ui.AC3: submits the entered fields to API01", () => {
  it("calls submitRequest with the entered fields and redirects to /my-requests on success", async () => {
    mockedSubmitRequest.mockResolvedValue({ id: "req-1", status: "Pending: Manager", submittedAt: "2026-01-01T00:00:00.000Z" });
    const user = userEvent.setup();

    renderWithQueryClient();
    await fillAndSubmit(user);

    expect(mockedSubmitRequest).toHaveBeenCalledWith({
      departmentId: "dept-1",
      location: "Location A",
      jobRoleId: "role-1",
      effectiveDate: "2026-06-01",
      reason: "",
    });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/my-requests"));
  });

  it("blocks submission client-side when a required field is left empty", async () => {
    const user = userEvent.setup();

    renderWithQueryClient();
    await screen.findByRole("option", { name: "Engineering" });
    await user.click(screen.getByRole("button", { name: /submit request/i }));

    expect(await screen.findByText(/department is required/i)).toBeInTheDocument();
    expect(mockedSubmitRequest).not.toHaveBeenCalled();
  });

  it("displays a 400 validation error from the API on the form, not silently dropped", async () => {
    mockedSubmitRequest.mockRejectedValue(new Error("validation_error: effectiveDate"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await fillAndSubmit(user);

    expect(await screen.findByText(/validation_error/i)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("displays a 404 (departmentId/jobRoleId not found) error from the API on the form", async () => {
    mockedSubmitRequest.mockRejectedValue(new Error("not_found"));
    const user = userEvent.setup();

    renderWithQueryClient();
    await fillAndSubmit(user);

    expect(await screen.findByText(/not_found/i)).toBeInTheDocument();
  });
});

describe("SubmitRequestForm — Employee-only, client-side (UX only; API01's own 403 is the real enforcement)", () => {
  it.each(["Manager", "HR", "Payroll", "IT", "Facilities"])(
    "does not render the form for a %s session, shows a restriction message instead",
    async (role) => {
      loginAs(role);

      renderWithQueryClient();

      expect(await screen.findByText(/only available to employees/i)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /submit request/i })).not.toBeInTheDocument();
    },
  );

  it("renders the form for an Employee session", async () => {
    renderWithQueryClient();

    expect(await screen.findByRole("button", { name: /submit request/i })).toBeInTheDocument();
  });
});
