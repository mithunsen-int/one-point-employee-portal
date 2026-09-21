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

async function callRegister(body: unknown, callerRole: string | null) {
  const { POST } = await import("@/app/api/users/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest("http://localhost/api/users", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const response = await POST(request);
  const json = await response.json();
  return { status: response.status, json };
}

async function createManager(): Promise<string> {
  const manager = await User.create({
    username: `manager-${Date.now()}-${Math.random()}`,
    passwordHash: "hash",
    role: "Manager",
    dateOfJoining: new Date(),
  });
  return manager._id.toString();
}

function employeePayload(managerId: string, overrides: Record<string, unknown> = {}) {
  return {
    username: `emp-${Date.now()}-${Math.random()}`,
    password: "SomeP@ssw0rd",
    role: "Employee",
    dateOfJoining: "2026-01-01",
    managerId,
    ...overrides,
  };
}

function nonEmployeePayload(role: string, overrides: Record<string, unknown> = {}) {
  return {
    username: `user-${Date.now()}-${Math.random()}`,
    password: "SomeP@ssw0rd",
    role,
    dateOfJoining: "2026-01-01",
    ...overrides,
  };
}

describe("POST /users — success (user-management-console.AC1/UT01/QT01, AC3/UT04/QT04)", () => {
  it("Admin registers a new Employee with valid credentials, response excludes passwordHash (UT01/QT01)", async () => {
    const managerId = await createManager();
    const { status, json } = await callRegister(employeePayload(managerId), "Admin");

    expect(status).toBe(201);
    expect(json).toMatchObject({ username: expect.any(String), role: "Employee", dateOfJoining: "2026-01-01", managerId });
    expect(typeof json.id).toBe("string");
    expect(json.passwordHash).toBeUndefined();
  });

  it("HR registers a new Employee with valid credentials (UT02)", async () => {
    const managerId = await createManager();
    const { status } = await callRegister(employeePayload(managerId), "HR");
    expect(status).toBe(201);
  });

  it.each(["HR", "Manager", "Payroll", "IT", "Facilities"])(
    "Admin registers a new %s user (UT04/QT04 sweep)",
    async (role) => {
      const { status, json } = await callRegister(nonEmployeePayload(role), "Admin");
      expect(status).toBe(201);
      expect(json.role).toBe(role);
    },
  );
});

describe("POST /users — AC2/UT03/QT03: non-Admin/HR blocked from registering an Employee", () => {
  it.each(["Manager", "Payroll", "IT", "Facilities"])("%s attempting to register an Employee is 403", async (callerRole) => {
    const managerId = await createManager();
    const { status, json } = await callRegister(employeePayload(managerId), callerRole);
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("POST /users — AC4/UT05/QT05: only Admin may register non-Employee roles", () => {
  it.each(["Employee", "Manager", "Payroll", "IT", "Facilities"])(
    "%s attempting to register a Manager is 403",
    async (callerRole) => {
      const { status, json } = await callRegister(nonEmployeePayload("Manager"), callerRole);
      expect(status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    },
  );
});

describe("POST /users — AC6 validation errors (UT07/UT08, QT08/QT09/QT10)", () => {
  it("missing username responds 400 naming username", async () => {
    const managerId = await createManager();
    const payload = employeePayload(managerId) as Record<string, unknown>;
    delete payload.username;
    const { status, json } = await callRegister(payload, "Admin");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["username"]));
  });

  it("missing password responds 400 naming password (UT07)", async () => {
    const managerId = await createManager();
    const payload = employeePayload(managerId) as Record<string, unknown>;
    delete payload.password;
    const { status, json } = await callRegister(payload, "Admin");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["password"]));
  });

  it("missing dateOfJoining responds 400 naming dateOfJoining (QT08)", async () => {
    const managerId = await createManager();
    const payload = employeePayload(managerId) as Record<string, unknown>;
    delete payload.dateOfJoining;
    const { status, json } = await callRegister(payload, "Admin");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["dateOfJoining"]));
  });

  it("role: Employee missing managerId responds 400 naming managerId (QT09)", async () => {
    const payload = employeePayload("irrelevant") as Record<string, unknown>;
    delete payload.managerId;
    const { status, json } = await callRegister(payload, "Admin");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["managerId"]));
  });

  it("role outside the six defined values responds 400 naming role (UT08/QT10)", async () => {
    const { status, json } = await callRegister(nonEmployeePayload("Manager-ish"), "Admin");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["role"]));
  });
});

describe("POST /users — AC11/UT13/QT17: managerId must reference an existing Manager", () => {
  it("managerId that doesn't exist responds 404 manager_not_found (UT13)", async () => {
    const { status, json } = await callRegister(employeePayload("64b64b64b64b64b64b64b64"), "Admin");
    expect(status).toBe(404);
    expect(json.error).toBe("manager_not_found");
  });

  it("managerId referencing an existing Employee, not Manager, responds 404 (QT17)", async () => {
    const employee = await User.create({
      username: `notmanager-${Date.now()}`,
      passwordHash: "hash",
      role: "Employee",
      dateOfJoining: new Date(),
      managerId: (await User.create({
        username: `mgr-for-notmanager-${Date.now()}`,
        passwordHash: "hash",
        role: "Manager",
        dateOfJoining: new Date(),
      }))._id,
    });
    const { status, json } = await callRegister(employeePayload(employee._id.toString()), "Admin");
    expect(status).toBe(404);
    expect(json.error).toBe("manager_not_found");
  });
});

describe("POST /users — AC5/UT06: duplicate username", () => {
  it("registering a username that already exists responds 409, no duplicate created", async () => {
    const managerId = await createManager();
    const payload = employeePayload(managerId);
    await callRegister(payload, "Admin");

    const { status, json } = await callRegister(payload, "Admin");
    expect(status).toBe(409);
    expect(json.error).toBe("username_exists");

    const count = await User.countDocuments({ username: payload.username });
    expect(count).toBe(1);
  });
});

describe("POST /users — authentication (rbac-api-security.AC1, via T04)", () => {
  it("no bearer token responds 401", async () => {
    const managerId = await createManager();
    const { status } = await callRegister(employeePayload(managerId), null);
    expect(status).toBe(401);
  });
});

async function callList(callerRole: string | null, role?: string) {
  const { GET } = await import("@/app/api/users/route");
  const headers = new Headers();
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const url = role ? `http://localhost/api/users?role=${role}` : "http://localhost/api/users";
  const request = new NextRequest(url, { method: "GET", headers });
  const response = await GET(request);
  const json = await response.json();
  return { status: response.status, json };
}

async function createNonEmployee(role: string) {
  return User.create({
    username: `list-${role}-${Date.now()}-${Math.random()}`,
    passwordHash: "hash",
    role,
    dateOfJoining: new Date(),
  });
}

describe("GET /users — AC9/UT11: Admin sees every non-deleted user across all roles", () => {
  it("returns all non-deleted users with id/username/role, including the Admin account itself (QT14)", async () => {
    const admin = await createNonEmployee("Admin");
    const hr = await createNonEmployee("HR");
    const managerId = await createManager();
    const employee = await User.create(employeePayloadForCreate(managerId));

    const { status, json } = await callList("Admin");
    expect(status).toBe(200);
    const ids = json.map((u: { id: string }) => u.id);
    expect(ids).toEqual(expect.arrayContaining([admin._id.toString(), hr._id.toString(), employee._id.toString()]));
    expect(json[0]).toEqual(expect.objectContaining({ id: expect.any(String), username: expect.any(String), role: expect.any(String) }));
  });

  it("excludes a soft-deleted user from the list (QT15)", async () => {
    const deleted = await createNonEmployee("HR");
    deleted.deletedAt = new Date();
    await deleted.save();

    const { status, json } = await callList("Admin");
    expect(status).toBe(200);
    expect(json.map((u: { id: string }) => u.id)).not.toContain(deleted._id.toString());
  });
});

describe("GET /users — AC12: HR sees Employee-role records only", () => {
  it("returns only non-deleted Employee-role users, excluding HR/Manager/etc.", async () => {
    const managerId = await createManager();
    const employee = await User.create(employeePayloadForCreate(managerId));
    const hrUser = await createNonEmployee("HR");

    const { status, json } = await callList("HR");
    expect(status).toBe(200);
    const ids = json.map((u: { id: string }) => u.id);
    expect(ids).toContain(employee._id.toString());
    expect(ids).not.toContain(hrUser._id.toString());
  });
});

describe("GET /users — user-management-console.T07/AC13 carve-out: HR with ?role=Manager", () => {
  it("returns only Manager-role records, excluding Employee/HR (UT16a)", async () => {
    const managerId = await createManager();
    const employee = await User.create(employeePayloadForCreate(managerId));
    const hrUser = await createNonEmployee("HR");

    const { status, json } = await callList("HR", "Manager");
    expect(status).toBe(200);
    const ids = json.map((u: { id: string }) => u.id);
    expect(ids).toContain(managerId);
    expect(ids).not.toContain(employee._id.toString());
    expect(ids).not.toContain(hrUser._id.toString());
  });

  it("rejects a role value other than Manager with 400 naming role (UT16b)", async () => {
    const { status, json } = await callList("HR", "HR");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["role"]));
  });

  it("Admin's response is unaffected by a role param (still all six roles)", async () => {
    const managerId = await createManager();
    const hrUser = await createNonEmployee("HR");

    const { status, json } = await callList("Admin", "Manager");
    expect(status).toBe(200);
    const ids = json.map((u: { id: string }) => u.id);
    expect(ids).toContain(managerId);
    expect(ids).toContain(hrUser._id.toString());
  });
});

describe("GET /users — authorization and authentication", () => {
  it("responds 403 for a caller who is neither Admin nor HR", async () => {
    const { status, json } = await callList("Employee");
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("responds 401 with no bearer token", async () => {
    const { status } = await callList(null);
    expect(status).toBe(401);
  });
});

function employeePayloadForCreate(managerId: string) {
  return {
    username: `list-emp-${Date.now()}-${Math.random()}`,
    passwordHash: "hash",
    role: "Employee",
    dateOfJoining: new Date(),
    managerId,
  };
}

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT06 (AC4, HR attempting to register Manager/Payroll/IT/Facilities) is an Open
//   QA Question (HR's authority beyond Employee is explicitly undecided per the
//   spec's own Explicitly Out of Scope) — not tested, per Do-not #3.
// - QT07 (AC5, username differing only in case) is an Open QA Question — not tested.
// - QT18 (AC11, managerId referencing a soft-deleted Manager) is an Open QA
//   Question. The implementation below makes a concrete, necessary choice
//   (excludes soft-deleted Managers) since executable code can't stay
//   unresolved the way a spec note can — flagged in the Gate 2 report as a
//   placeholder decision for that open question, not a silent resolution of it.