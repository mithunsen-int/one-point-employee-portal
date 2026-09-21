import { connectToDatabase } from "@/services/db/connect";

jest.mock("./services/db/connect");

const mockedConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;

afterEach(() => {
  jest.clearAllMocks();
});

describe("instrumentation.register — rbac-api-security.T08: real DB connection wired at server startup", () => {
  it("calls connectToDatabase exactly once", async () => {
    mockedConnectToDatabase.mockResolvedValue(undefined as never);

    const { register } = await import("@/instrumentation");
    await register();

    expect(mockedConnectToDatabase).toHaveBeenCalledTimes(1);
  });

  it("propagates a connection failure rather than swallowing it", async () => {
    mockedConnectToDatabase.mockRejectedValue(new Error("MONGODB_URI environment variable is not set."));

    const { register } = await import("@/instrumentation");

    await expect(register()).rejects.toThrow("MONGODB_URI environment variable is not set.");
  });
});
