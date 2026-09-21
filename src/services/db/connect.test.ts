const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.MONGODB_URI;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("connectToDatabase", () => {
  it("throws a clear configuration error if MONGODB_URI is unset", async () => {
    const { connectToDatabase } = await import("@/services/db/connect");
    expect(() => connectToDatabase()).toThrow();
  });
});
