import { NextRequest } from "next/server";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { signToken } from "@/services/auth/jwt";
import { JobRole } from "@/services/org-structure/JobRole";

const ORIGINAL_ENV = process.env;

beforeAll(async () => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
  await startTestDatabase();
  await JobRole.init();
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
  const { PATCH } = await import("@/app/api/job-roles/[id]/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/job-roles/${id}`, { method: "PATCH", headers, body: JSON.stringify(body) });
  const response = await PATCH(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

async function callDelete(id: string, callerRole: string | null) {
  const { DELETE } = await import("@/app/api/job-roles/[id]/route");
  const headers = new Headers();
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/job-roles/${id}`, { method: "DELETE", headers });
  const response = await DELETE(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

describe("PATCH /job-roles/{id} — AC10/UT10: Admin edits a Job Role", () => {
  it("updates the record and responds 200", async () => {
    const role = await JobRole.create({ title: "Software Engineer" });
    const { status, json } = await callPatch(role._id.toString(), { title: "Senior Software Engineer" }, "Admin");
    expect(status).toBe(200);
    expect(json).toEqual({ id: role._id.toString(), title: "Senior Software Engineer" });

    const updated = await JobRole.findById(role._id);
    expect(updated?.title).toBe("Senior Software Engineer");
  });
});

describe("PATCH /job-roles/{id} — AC8/QT11: non-Admin blocked", () => {
  it("Manager attempting to edit is 403", async () => {
    const role = await JobRole.create({ title: "Software Engineer" });
    const { status, json } = await callPatch(role._id.toString(), { title: "New Title" }, "Manager");
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("PATCH /job-roles/{id} — AC10/QT13: title collision with a different record", () => {
  it("responds 409 when the new title is already used by another Job Role", async () => {
    await JobRole.create({ title: "Product Manager" });
    const role = await JobRole.create({ title: "Software Engineer" });

    const { status, json } = await callPatch(role._id.toString(), { title: "Product Manager" }, "Admin");
    expect(status).toBe(409);
    expect(json.error).toBe("name_exists");
  });
});

describe("PATCH /job-roles/{id} — not found and authentication", () => {
  it("a non-existent id responds 404", async () => {
    const { status } = await callPatch("64b64b64b64b64b64b64b64", { title: "X" }, "Admin");
    expect(status).toBe(404);
  });

  it("responds 401 with no bearer token", async () => {
    const role = await JobRole.create({ title: "Software Engineer" });
    const { status } = await callPatch(role._id.toString(), { title: "X" }, null);
    expect(status).toBe(401);
  });
});

describe("DELETE /job-roles/{id} — AC11/UT11: Admin deletes a Job Role", () => {
  it("removes the record and responds 200", async () => {
    const role = await JobRole.create({ title: "Software Engineer" });
    const { status, json } = await callDelete(role._id.toString(), "Admin");
    expect(status).toBe(200);
    expect(json).toEqual({ id: role._id.toString() });

    const gone = await JobRole.findById(role._id);
    expect(gone).toBeNull();
  });
});

describe("DELETE /job-roles/{id} — AC8/QT11: non-Admin blocked", () => {
  it("Manager attempting to delete is 403", async () => {
    const role = await JobRole.create({ title: "Software Engineer" });
    const { status } = await callDelete(role._id.toString(), "Manager");
    expect(status).toBe(403);

    const stillThere = await JobRole.findById(role._id);
    expect(stillThere).not.toBeNull();
  });
});

describe("DELETE /job-roles/{id} — not found and authentication", () => {
  it("deleting an already-deleted Job Role again responds 404", async () => {
    const role = await JobRole.create({ title: "Software Engineer" });
    await callDelete(role._id.toString(), "Admin");

    const { status } = await callDelete(role._id.toString(), "Admin");
    expect(status).toBe(404);
  });

  it("a non-existent id responds 404", async () => {
    const { status } = await callDelete("64b64b64b64b64b64b64b64", "Admin");
    expect(status).toBe(404);
  });

  it("responds 401 with no bearer token", async () => {
    const role = await JobRole.create({ title: "Software Engineer" });
    const { status } = await callDelete(role._id.toString(), null);
    expect(status).toBe(401);
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT14 (AC11, deleting a Job Role already referenced by a transfer request)
//   is an Open QA Question (the known referential-integrity gap, same class as
//   T01's QT07) — not tested, per Do-not #3 and this task's own prompt file.