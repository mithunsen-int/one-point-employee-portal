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

async function callCreate(body: unknown, callerRole: string | null) {
  const { POST } = await import("@/app/api/job-roles/route");
  const headers = new Headers({ "content-type": "application/json" });
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest("http://localhost/api/job-roles", { method: "POST", headers, body: JSON.stringify(body) });
  const response = await POST(request);
  const json = await response.json();
  return { status: response.status, json };
}

async function callList(callerRole: string | null) {
  const { GET } = await import("@/app/api/job-roles/route");
  const headers = new Headers();
  if (callerRole !== null) {
    headers.set("authorization", `Bearer ${tokenFor(callerRole)}`);
  }
  const request = new NextRequest("http://localhost/api/job-roles", { method: "GET", headers });
  const response = await GET(request);
  const json = await response.json();
  return { status: response.status, json };
}

describe("POST /job-roles — AC7/UT07: Admin creates a Job Role", () => {
  it("creates the record and responds 201", async () => {
    const { status, json } = await callCreate({ title: "Software Engineer" }, "Admin");
    expect(status).toBe(201);
    expect(json).toEqual({ id: expect.any(String), title: "Software Engineer" });
  });
});

describe("POST /job-roles — AC8/UT08/QT10: non-Admin blocked", () => {
  it.each(["Employee", "HR", "Manager", "Payroll", "IT", "Facilities"])("%s attempting to create is 403", async (role) => {
    const { status, json } = await callCreate({ title: "Product Manager" }, role);
    expect(status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });
});

describe("POST /job-roles — AC9/UT09: duplicate title", () => {
  it("responds 409 and does not create a duplicate (error code matches Departments' per QT13, see report)", async () => {
    await callCreate({ title: "Software Engineer" }, "Admin");
    const { status, json } = await callCreate({ title: "Software Engineer" }, "Admin");
    expect(status).toBe(409);
    expect(json.error).toBe("name_exists");

    const count = await JobRole.countDocuments({ title: "Software Engineer" });
    expect(count).toBe(1);
  });
});

describe("POST /job-roles — AC13: validation", () => {
  it("missing title responds 400 naming title", async () => {
    const { status, json } = await callCreate({}, "Admin");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["title"]));
  });

  it("empty-string title responds 400 naming title", async () => {
    const { status, json } = await callCreate({ title: "" }, "Admin");
    expect(status).toBe(400);
    expect(json.fields).toEqual(expect.arrayContaining(["title"]));
  });
});

describe("POST /job-roles — authentication", () => {
  it("responds 401 with no bearer token", async () => {
    const { status } = await callCreate({ title: "Software Engineer" }, null);
    expect(status).toBe(401);
  });
});

describe("GET /job-roles — AC12/UT12/QT15: list view", () => {
  it("returns all records", async () => {
    await JobRole.create({ title: "Software Engineer" });
    await JobRole.create({ title: "Product Manager" });

    const { status, json } = await callList("Admin");
    expect(status).toBe(200);
    expect(json).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "Software Engineer" }),
      expect.objectContaining({ title: "Product Manager" }),
    ]));
  });

  it("returns an empty array when zero Job Roles exist (QT15)", async () => {
    const { status, json } = await callList("Admin");
    expect(status).toBe(200);
    expect(json).toEqual([]);
  });

  it.each(["Employee", "Manager", "HR", "Payroll", "IT", "Facilities"])(
    "%s can read the list too — org-structure-management.AC12 never restricted reads to Admin, only AC8 restricts create/edit/delete",
    async (role) => {
      await JobRole.create({ title: "Software Engineer" });

      const { status, json } = await callList(role);
      expect(status).toBe(200);
      expect(json).toEqual(expect.arrayContaining([expect.objectContaining({ title: "Software Engineer" })]));
    },
  );

  it("responds 401 with no bearer token", async () => {
    const { status } = await callList(null);
    expect(status).toBe(401);
  });
});

// Not covered above, and deliberately not written as concrete assertions:
//
// - QT09 (AC7, title with leading/trailing whitespace) and QT12 (AC9, title
//   differing only in case) are Open QA Questions — not tested, per Do-not #3.