import { location } from "@/services/constants/referenceValues";

describe("backend referenceValues — location (application-constants-management.AC2/UT02)", () => {
  it("exports the expected placeholder Location set", () => {
    expect(location).toEqual([
      "Location A",
      "Location B",
      "Location C",
      "Location D",
      "Location E",
      "Location F",
      "Location G",
      "Location H",
    ]);
  });

  it("accepts a value that is a member of the set, rejects one that isn't (UT02)", () => {
    expect(location.includes("Location A")).toBe(true);
    expect(location.includes("Not A Real Location")).toBe(false);
  });
});

describe("backend referenceValues — application-constants-management.AC3: never defines department or jobRole", () => {
  it("does not export a department or jobRole key", async () => {
    const referenceValuesModule: Record<string, unknown> = await import("@/services/constants/referenceValues");
    expect(Object.prototype.hasOwnProperty.call(referenceValuesModule, "department")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(referenceValuesModule, "jobRole")).toBe(false);
  });
});

// AC4 ("adding a value requires only editing this module's source and
// redeploying — no other change required") isn't a runtime action a test can
// execute; this test instead confirms the structural property that makes it
// true: `location` is a plain array, not a type union or a value requiring
// separate registration elsewhere.
describe("backend referenceValues — application-constants-management.AC4", () => {
  it("is a plain array (structural evidence that no separate registration step exists)", () => {
    expect(Array.isArray(location)).toBe(true);
  });
});
