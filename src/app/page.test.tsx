/**
 * @jest-environment jsdom
 */
import { render, waitFor } from "@testing-library/react";
import { persistSession } from "@/shared/auth/session";
import Home from "@/app/page";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("Root route (/) — stakeholder-panel-ui.AC12/UT12: redirects based on session", () => {
  it("redirects to /login when there is no session", async () => {
    render(<Home />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("redirects an Admin session to /dashboard (UT12b)", async () => {
    persistSession("header.eyJ1c2VySWQiOiJhLTEiLCJyb2xlIjoiQWRtaW4ifQ.sig", 900);

    render(<Home />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("redirects a non-Admin session to /my-requests (UT12c)", async () => {
    persistSession("header.eyJ1c2VySWQiOiJ1LTEiLCJyb2xlIjoiRW1wbG95ZWUifQ.sig", 900);

    render(<Home />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/my-requests"));
  });

  it("redirects to /login when the stored session has already expired", async () => {
    persistSession("header.eyJ1c2VySWQiOiJ1LTEiLCJyb2xlIjoiRW1wbG95ZWUifQ.sig", -1);

    render(<Home />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
