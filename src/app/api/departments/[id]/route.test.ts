import { NextRequest } from "next/server";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { signToken } from "@/services/auth/jwt";
import { Department } from "@/services/org-structure/Department";

const ORIGINAL_ENV = process.env;

beforeAll(async () => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
  await startTestDatabase();
  await Department.init();
}, 60000);

afterEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await stopTestDatabase();
  process.env = ORIGINAL_ENV;
});

function tokenFor(role: string): string {
  return signToken({ userId: "caller-1", role });
}

async function callPatch(id: string, body: unknown, callerRole: string | null) {
  const { PATCH } = await import("@/app/api/departments/[id]/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/departments/${id}`, { method: "PATCH", headers, body: JSON.stringify(body) });
  const response = await PATCH(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

async function callDelete(id: string, callerRole: string | null) {
  const { DELETE } = await import("@/app/api/departments/[id]/route");
  const headers = new Headers();
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/departments/${id}`, { method: "DELETE", headers });
  const response = await DELETE(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

describe("PATCH /departments/{id} — AC4/UT04: Admin edits a Department", () => {
  it("updates the record and responds 200", async () => {
    const dept = await Department.create({ name: "Sales" });
    const { status, json } = await callPatch(dept._id.toString(), { name: "Sales & Marketing" }, "Admin");
    expect(status).toBe(200);
    expect(json).toEqual({ id: dept._id.toString(), name: "Sales & Marketing" });

    const updated = await Department.findById(dept._id);
    expect(updated?.name).toBe("Sales & Marketing");
  });
});

describe("PATCH /departments/{id} — AC2/QT03: non-Admin blocked", () => {
  it("Manager attempting to edit is 403", async () => {
    const dept = await Department.create({ name: "Sales" });
    const { status, json } = await callPatch(dept._id.toString(), { name: "New Name" }, "Manager");
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("PATCH /departments/{id} — AC4/QT05: name collision with a different record", () => {
  it("responds 409 when the new name is already used by another Department", async () => {
    await Department.create({ name: "Engineering" });
    const dept = await Department.create({ name: "Sales" });

    const { status, json } = await callPatch(dept._id.toString(), { name: "Engineering" }, "Admin");
    expect(status).toBe(409);
    expect(json.error).toBe("name_exists");
  });
});

describe("PATCH /departments/{id} — not found and authentication", () => {
  it("a non-existent id responds 404", async () => {
    const { status } = await callPatch("64b64b64b64b64b64b64b64", { name: "X" }, "Admin");
    expect(status).toBe(404);
  });

  it("responds 401 with no bearer token", async () => {
    const dept = await Department.create({ name: "Sales" });
    const { status } = await callPatch(dept._id.toString(), { name: "X" }, null);
    expect(status).toBe(401);
  });
});

describe("DELETE /departments/{id} — AC5/UT05: Admin deletes a Department", () => {
  it("removes the record and responds 200", async () => {
    const dept = await Department.create({ name: "Sales" });
    const { status, json } = await callDelete(dept._id.toString(), "Admin");
    expect(status).toBe(200);
    expect(json).toEqual({ id: dept._id.toString() });

    const gone = await Department.findById(dept._id);
    expect(gone).toBeNull();
  });
});

describe("DELETE /departments/{id} — AC2/QT03: non-Admin blocked", () => {
  it("Manager attempting to delete is 403", async () => {
    const dept = await Department.create({ name: "Sales" });
    const { status } = await callDelete(dept._id.toString(), "Manager");
    expect(status).toBe(403);

    const stillThere = await Department.findById(dept._id);
    expect(stillThere).not.toBeNull();
  });
});

describe("DELETE /departments/{id} — not found and authentication (QT06)", () => {
  it("deleting an already-deleted Department again responds 404 (QT06)", async () => {
    const dept = await Department.create({ name: "Sales" });
    await callDelete(dept._id.toString(), "Admin");

    const { status } = await callDelete(dept._id.toString(), "Admin");
    expect(status).toBe(404);
  });

  it("a non-existent id responds 404", async () => {
    const { status } = await callDelete("64b64b64b64b64b64b64b64", "Admin");
    expect(status).toBe(404);
  });

  it("responds 401 with no bearer token", async () => {
    const dept = await Department.create({ name: "Sales" });
    const { status } = await callDelete(dept._id.toString(), null);
    expect(status).toBe(401);
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT07 (AC5, deleting a Department already referenced by a transfer request)
//   is an Open QA Question (the known referential-integrity gap) — not tested,
//   per Do-not #3. This task's own prompt file explicitly says not to add any
//   check against internal-transfer-workflow's TransferRequests collection.