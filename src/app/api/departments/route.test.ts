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

async function callCreate(body: unknown, callerRole: string | null) {
  const { POST } = await import("@/app/api/departments/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest("http://localhost/api/departments", { method: "POST", headers, body: JSON.stringify(body) });
  const response = await POST(request);
  const json = await response.json();
  return { status: response.status, json };
}

async function callList(callerRole: string | null) {
  const { GET } = await import("@/app/api/departments/route");
  const headers = new Headers();
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest("http://localhost/api/departments", { method: "GET", headers });
  const response = await GET(request);
  const json = await response.json();
  return { status: response.status, json };
}

describe("POST /departments — AC1/UT01: Admin creates a Department", () => {
  it("creates the record and responds 201", async () => {
    const { status, json } = await callCreate({ name: "Sales" }, "Admin");
    expect(status).toBe(201);
    expect(json).toEqual({ id: expect.any(String), name: "Sales" });
  });
});

describe("POST /departments — AC2/UT02/QT02: non-Admin blocked", () => {
  it.each(["Employee", "HR", "Manager", "Payroll", "IT", "Facilities"])("%s attempting to create is 403", async (role) => {
    const { status, json } = await callCreate({ name: "Marketing" }, role);
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("POST /departments — AC3/UT03: duplicate name", () => {
  it("responds 409 and does not create a duplicate", async () => {
    await callCreate({ name: "Engineering" }, "Admin");
    const { status, json } = await callCreate({ name: "Engineering" }, "Admin");
    expect(status).toBe(409);
    expect(json.error).toBe("name_exists");

    const count = await Department.countDocuments({ name: "Engineering" });
    expect(count).toBe(1);
  });
});

describe("POST /departments — AC13/UT13/QT16: validation", () => {
  it("missing name responds 400 naming name", async () => {
    const { status, json } = await callCreate({}, "Admin");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["name"]));
  });

  it("empty-string name responds 400 naming name", async () => {
    const { status, json } = await callCreate({ name: "" }, "Admin");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["name"]));
  });
});

describe("POST /departments — authentication", () => {
  it("responds 401 with no bearer token", async () => {
    const { status } = await callCreate({ name: "Sales" }, null);
    expect(status).toBe(401);
  });
});

describe("GET /departments — AC6/UT06/QT08: list view", () => {
  it("returns all records", async () => {
    await Department.create({ name: "Sales" });
    await Department.create({ name: "Engineering" });

    const { status, json } = await callList("Admin");
    expect(status).toBe(200);
    expect(json).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Sales" }),
      expect.objectContaining({ name: "Engineering" }),
    ]));
  });

  it("returns an empty array when zero Departments exist (QT08)", async () => {
    const { status, json } = await callList("Admin");
    expect(status).toBe(200);
    expect(json).toEqual([]);
  });

  it.each(["Employee", "Manager", "HR", "Payroll", "IT", "Facilities"])(
    "%s can read the list too — org-structure-management.AC6 never restricted reads to Admin, only AC2 restricts create/edit/delete",
    async (role) => {
      await Department.create({ name: "Sales" });

      const { status, json } = await callList(role);
      expect(status).toBe(200);
      expect(json).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Sales" })]));
    },
  );

  it("responds 401 with no bearer token", async () => {
    const { status } = await callList(null);
    expect(status).toBe(401);
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT01 (AC1, name with leading/trailing whitespace) and QT04 (AC3, name
//   differing only in case) are Open QA Questions — not tested, per Do-not #3.