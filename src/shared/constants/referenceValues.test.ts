import fs from "fs";
import path from "path";
import { location } from "@/shared/constants/referenceValues";

describe("frontend referenceValues — location (application-constants-management.AC1/UT01)", () => {
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
});

describe("frontend referenceValues — application-constants-management.AC3: never defines department or jobRole", () => {
  it("does not export a department or jobRole key", async () => {
    const referenceValuesModule: Record<string, unknown> = await import("@/shared/constants/referenceValues");
    expect(Object.prototype.hasOwnProperty.call(referenceValuesModule, "department")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(referenceValuesModule, "jobRole")).toBe(false);
  });
});

describe("frontend referenceValues — application-constants-management.AC4", () => {
  it("is a plain array (structural evidence that no separate registration step exists)", () => {
    expect(Array.isArray(location)).toBe(true);
  });
});

// AC5 ("each layer is independently authoritative... not generated from, or
// synchronized against, one shared definition") is a structural/architectural
// property, not a runtime behavior — verified by reading this module's own
// source text and confirming it contains no import of the backend module,
// rather than by any output the two modules produce (which currently happen
// to match, but that's incidental, not enforced).
describe("frontend referenceValues — application-constants-management.AC5/UT05: independently authoritative", () => {
  it("does not import from the backend constants module", () => {
    const sourcePath = path.join(__dirname, "referenceValues.ts");
    const source = fs.readFileSync(sourcePath, "utf8");
    // Matches an actual import/require statement referencing the backend
    // module's path, not a mere textual mention (e.g., in an explanatory
    // comment) — the file legitimately names that path in a comment.
    expect(source).not.toMatch(/(?:import|require)\s*\(?[^;\n]*services\/constants\/referenceValues/);
  });
});
