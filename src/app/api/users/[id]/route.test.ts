import { NextRequest } from "next/server";
import { startTestDatabase, stopTestDatabase, clearTestDatabase } from "@/test-utils/mongoServer";
import { signToken } from "@/services/auth/jwt";
import { User } from "@/services/users/User";

const ORIGINAL_ENV = process.env;

beforeAll(async () => {
  process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret-do-not-use-in-production" };
  await startTestDatabase();
  await User.init();
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

async function createUser(role: string, overrides: Record<string, unknown> = {}) {
  const needsManager = role === "Employee" && overrides.managerId === undefined;
  const managerId = needsManager
    ? (
        await User.create({
          username: `auto-manager-${Date.now()}-${Math.random()}`,
          passwordHash: "hash",
          role: "Manager",
          dateOfJoining: new Date(),
        })
      )._id
    : undefined;

  return User.create({
    username: `user-${role}-${Date.now()}-${Math.random()}`,
    passwordHash: "hash",
    role,
    dateOfJoining: new Date(),
    ...(managerId ? { managerId } : {}),
    ...overrides,
  });
}

async function callPatch(id: string, body: unknown, callerRole: string | null) {
  const { PATCH } = await import("@/app/api/users/[id]/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/users/${id}`, { method: "PATCH", headers, body: JSON.stringify(body) });
  const response = await PATCH(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

async function callDelete(id: string, callerRole: string | null) {
  const { DELETE } = await import("@/app/api/users/[id]/route");
  const headers = new Headers();
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/users/${id}`, { method: "DELETE", headers });
  const response = await DELETE(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

describe("PATCH /users/{id} — AC7/UT09/QT11: Admin may edit any user", () => {
  it("Admin edits a Manager's role to HR (UT09)", async () => {
    const manager = await createUser("Manager");
    const { status, json } = await callPatch(manager._id.toString(), { role: "HR" }, "Admin");
    expect(status).toBe(200);
    expect(json.role).toBe("HR");

    const updated = await User.findById(manager._id);
    expect(updated?.role).toBe("HR");
  });

  it("Admin edits a user's username (QT11)", async () => {
    const hrUser = await createUser("HR");
    const { status, json } = await callPatch(hrUser._id.toString(), { username: "renamed.user" }, "Admin");
    expect(status).toBe(200);
    expect(json.username).toBe("renamed.user");
  });
});

describe("PATCH /users/{id} — AC12/UT14: HR may edit an Employee record identically to Admin", () => {
  it("HR edits an Employee's managerId (UT14)", async () => {
    const manager = await createUser("Manager");
    const employee = await createUser("Employee", { managerId: manager._id });
    const newManager = await createUser("Manager");

    const { status, json } = await callPatch(employee._id.toString(), { managerId: newManager._id.toString() }, "HR");
    expect(status).toBe(200);
    expect(json.id).toBe(employee._id.toString());

    const updated = await User.findById(employee._id);
    expect(updated?.managerId?.toString()).toBe(newManager._id.toString());
  });
});

describe("PATCH /users/{id} — AC13/UT16/QT20: HR blocked from non-Employee records", () => {
  it.each(["HR", "Manager", "Payroll", "IT", "Facilities", "Admin"])("HR attempting to edit a %s record is 403", async (role) => {
    const target = await createUser(role);
    const { status, json } = await callPatch(target._id.toString(), { username: "attempted.rename" }, "HR");
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("PATCH /users/{id} — non-Admin/HR callers have no edit authority", () => {
  it("an Employee attempting to edit another Employee's record is 403", async () => {
    const target = await createUser("Employee");
    const { status } = await callPatch(target._id.toString(), { username: "attempted.rename" }, "Employee");
    expect(status).toBe(403);
  });
});

describe("PATCH /users/{id} — not found and authentication", () => {
  it("a non-existent id responds 404 not_found", async () => {
    const { status, json } = await callPatch("64b64b64b64b64b64b64b64", { username: "x" }, "Admin");
    expect(status).toBe(404);
    expect(json.error).toBe("not_found");
  });

  it("a soft-deleted user's id responds 404 not_found (consistent with DELETE's own 'existing, non-deleted' rule)", async () => {
    const deleted = await createUser("Employee", { deletedAt: new Date() });
    const { status, json } = await callPatch(deleted._id.toString(), { username: "x" }, "Admin");
    expect(status).toBe(404);
    expect(json.error).toBe("not_found");
  });

  it("no bearer token responds 401", async () => {
    const target = await createUser("Employee");
    const { status } = await callPatch(target._id.toString(), { username: "x" }, null);
    expect(status).toBe(401);
  });
});

describe("DELETE /users/{id} — AC8/UT10: Admin deletes a user (soft delete)", () => {
  it("Admin deletes a user, sets deletedAt, responds 200 with just the id", async () => {
    const target = await createUser("Employee");
    const { status, json } = await callDelete(target._id.toString(), "Admin");
    expect(status).toBe(200);
    expect(json).toEqual({ id: target._id.toString() });

    const updated = await User.findById(target._id);
    expect(updated?.deletedAt).not.toBeNull();
  });
});

describe("DELETE /users/{id} — AC12/UT15: HR deletes an Employee record", () => {
  it("HR deletes an Employee, deletedAt set, responds 200", async () => {
    const employee = await createUser("Employee");
    const { status } = await callDelete(employee._id.toString(), "HR");
    expect(status).toBe(200);

    const updated = await User.findById(employee._id);
    expect(updated?.deletedAt).not.toBeNull();
  });
});

describe("DELETE /users/{id} — AC13/QT20: HR blocked from non-Employee records", () => {
  it.each(["HR", "Manager", "Payroll", "IT", "Facilities", "Admin"])("HR attempting to delete a %s record is 403", async (role) => {
    const target = await createUser(role);
    const { status, json } = await callDelete(target._id.toString(), "HR");
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");

    const unchanged = await User.findById(target._id);
    expect(unchanged?.deletedAt).toBeNull();
  });
});

describe("DELETE /users/{id} — non-Admin/HR callers have no delete authority", () => {
  it("a Manager attempting to delete an Employee's record is 403", async () => {
    const target = await createUser("Employee");
    const { status } = await callDelete(target._id.toString(), "Manager");
    expect(status).toBe(403);
  });
});

describe("DELETE /users/{id} — not found and authentication", () => {
  it("deleting an already-deleted user responds 404 (QT13)", async () => {
    const target = await createUser("Employee");
    await callDelete(target._id.toString(), "Admin");

    const { status, json } = await callDelete(target._id.toString(), "Admin");
    expect(status).toBe(404);
    expect(json.error).toBe("not_found");
  });

  it("a non-existent id responds 404 not_found", async () => {
    const { status, json } = await callDelete("64b64b64b64b64b64b64b64", "Admin");
    expect(status).toBe(404);
    expect(json.error).toBe("not_found");
  });

  it("no bearer token responds 401", async () => {
    const target = await createUser("Employee");
    const { status } = await callDelete(target._id.toString(), null);
    expect(status).toBe(401);
  });
});

async function callGet(id: string, callerRole: string | null) {
  const { GET } = await import("@/app/api/users/[id]/route");
  const headers = new Headers();
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest(`http://localhost/api/users/${id}`, { method: "GET", headers });
  const response = await GET(request, { params: Promise.resolve({ id }) });
  const json = await response.json();
  return { status: response.status, json };
}

describe("GET /users/{id} — AC10/UT12: Admin sees full detail fields", () => {
  it("returns id/username/role/dateOfJoining/managerId (UT12)", async () => {
    const manager = await createUser("Manager");
    const employee = await createUser("Employee", { managerId: manager._id });

    const { status, json } = await callGet(employee._id.toString(), "Admin");
    expect(status).toBe(200);
    expect(json).toEqual(
      expect.objectContaining({
        id: employee._id.toString(),
        username: employee.username,
        role: "Employee",
        managerId: manager._id.toString(),
      }),
    );
    expect(typeof json.dateOfJoining).toBe("string");
  });

  it("responds 404 for a soft-deleted user's id (QT16)", async () => {
    const deleted = await createUser("HR", { deletedAt: new Date() });
    const { status, json } = await callGet(deleted._id.toString(), "Admin");
    expect(status).toBe(404);
    expect(json.error).toBe("not_found");
  });

  it("responds 404 for a non-existent id", async () => {
    const { status, json } = await callGet("64b64b64b64b64b64b64b64", "Admin");
    expect(status).toBe(404);
    expect(json.error).toBe("not_found");
  });
});

describe("GET /users/{id} — AC12: HR sees an Employee record identically to Admin", () => {
  it("HR requests an Employee's detail view successfully", async () => {
    const employee = await createUser("Employee");
    const { status, json } = await callGet(employee._id.toString(), "HR");
    expect(status).toBe(200);
    expect(json.id).toBe(employee._id.toString());
  });
});

describe("GET /users/{id} — AC13/QT20: HR blocked from viewing non-Employee records", () => {
  it.each(["HR", "Manager", "Payroll", "IT", "Facilities", "Admin"])("HR viewing a %s record is 403", async (role) => {
    const target = await createUser(role);
    const { status, json } = await callGet(target._id.toString(), "HR");
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("GET /users/{id} — authorization and authentication", () => {
  it("responds 403 for a caller who is neither Admin nor HR", async () => {
    const target = await createUser("Employee");
    const { status } = await callGet(target._id.toString(), "Employee");
    expect(status).toBe(403);
  });

  it("responds 401 with no bearer token", async () => {
    const target = await createUser("Employee");
    const { status } = await callGet(target._id.toString(), null);
    expect(status).toBe(401);
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT12/QT19 (editing a user's role into or away from "Employee", and whether
//   HR's Employee-scoped authority still applies to an edit that changes the
//   role field itself) are Open QA Questions — no test exercises a role edit
//   that crosses the Employee boundary in either direction.
// - AC7's own "account fields" phrasing is a good deal looser than API02's
//   Request payload text, which literally names only username/role as defined
//   fields — yet UT14 (a spec-derived Unit Test Case) tests editing managerId.
//   This implementation supports managerId as an editable PATCH field to honor
//   UT14, treating API02's payload line as under-documented rather than UT14
//   as wrong — flagged as a spec-documentation gap in the Gate 2 report, not
//   silently resolved one way without a trace.