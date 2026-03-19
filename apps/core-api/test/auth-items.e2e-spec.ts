import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma.service";
import { hashPassword } from "../src/common/security/password";

const request = require("supertest");

describe("Auth + ERP smoke (e2e)", () => {
  let app: INestApplication;
  const originalFetch = global.fetch;
  const originalIssuesRepo = process.env.GITHUB_ISSUES_REPO;
  const originalIssuesToken = process.env.GITHUB_ISSUES_TOKEN;

  const adminUser = {
    id: "11111111-1111-1111-1111-111111111111",
    email: "admin@sphincs.local",
    password_hash: "",
    organization_id: "00000000-0000-0000-0000-000000000001",
    branch_id: "00000000-0000-0000-0000-000000000101",
    status: "ACTIVE",
    deleted_at: null
  };
  let signupUser: null | {
    id: string;
    email: string;
    password_hash: string;
    organization_id: string;
    branch_id: string | null;
    status: string;
    deleted_at: null;
  } = null;

  const mockPrisma = {
    organization: {
      findFirst: jest.fn(async () => ({
        id: adminUser.organization_id,
        name: "SPHINCS",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null
      }))
    },
    branch: {
      findFirst: jest.fn(async () => ({
        id: adminUser.branch_id,
        organization_id: adminUser.organization_id,
        name: "Main",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null
      }))
    },
    role: {
      findFirst: jest.fn(async () => ({
        id: "role-staff",
        name: "Staff",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null
      }))
    },
    user: {
      findFirst: jest.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
        if (signupUser && (where.email === signupUser.email || where.id === signupUser.id)) {
          return {
            ...signupUser,
            user_roles: [{ role: { name: "Staff" } }]
          };
        }
        if (where.email === adminUser.email || where.id === adminUser.id) {
          return {
            id: adminUser.id,
            email: adminUser.email,
            password_hash: adminUser.password_hash,
            organization_id: adminUser.organization_id,
            branch_id: adminUser.branch_id,
            user_roles: [{ role: { name: "Admin" } }]
          };
        }
        return null;
      }),
      findUnique: jest.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
        if (signupUser && (where.email === signupUser.email || where.id === signupUser.id)) {
          return signupUser;
        }
        if (where.email === adminUser.email || where.id === adminUser.id) {
          return adminUser;
        }
        return null;
      }),
      create: jest.fn(async ({ data }: { data: Record<string, string | null> }) => {
        signupUser = {
          id: "55555555-5555-5555-5555-555555555555",
          email: String(data.email),
          password_hash: String(data.password_hash),
          organization_id: String(data.organization_id),
          branch_id: data.branch_id ? String(data.branch_id) : null,
          status: "ACTIVE",
          deleted_at: null
        };
        return signupUser;
      }),
      update: jest.fn(async ({ data }: { data: Partial<typeof adminUser> }) => ({
        ...adminUser,
        ...data
      }))
    },
    userRole: {
      findMany: jest.fn(async ({ where }: { where?: { user_id?: string } }) => {
        if (where?.user_id === signupUser?.id) {
          return [{ role: { name: "Staff" } }];
        }
        return [{ role: { name: "Admin" } }];
      }),
      create: jest.fn(async () => ({
        id: "ur-1",
        user_id: signupUser?.id ?? "none",
        role_id: "role-staff"
      }))
    },
    refreshToken: {
      create: jest.fn(async () => ({
        id: "22222222-2222-2222-2222-222222222222"
      })),
      findFirst: jest.fn(async () => null),
      update: jest.fn(async () => ({
        id: "22222222-2222-2222-2222-222222222222"
      }))
    },
    item: {
      findMany: jest.fn(async () => [
        {
          id: "33333333-3333-3333-3333-333333333333",
          organization_id: adminUser.organization_id,
          branch_id: adminUser.branch_id,
          name: "Seed Item",
          sku: "ITEM-001",
          deleted_at: null
        }
      ])
    },
    auditLog: {
      create: jest.fn(async () => ({
        id: "44444444-4444-4444-4444-444444444444"
      }))
    }
  };

  const originalAccessSecret = process.env.JWT_ACCESS_SECRET;
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = "e2e-access-secret";
    process.env.JWT_REFRESH_SECRET = "e2e-refresh-secret";
    process.env.GITHUB_ISSUES_REPO = "cowebsLB/sphincs-ERP-CRM";
    process.env.GITHUB_ISSUES_TOKEN = "test-token";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        html_url: "https://github.com/cowebsLB/sphincs-ERP-CRM/issues/999",
        number: 999,
        title: "[ERP] e2e bug",
        state: "open"
      })
    }) as unknown as typeof fetch;

    adminUser.password_hash = await hashPassword("ChangeMe123!");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", {
      exclude: [{ path: "health", method: RequestMethod.GET }]
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env.JWT_ACCESS_SECRET = originalAccessSecret;
    process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
    process.env.GITHUB_ISSUES_REPO = originalIssuesRepo;
    process.env.GITHUB_ISSUES_TOKEN = originalIssuesToken;
    global.fetch = originalFetch;
  });

  it("logs in, resolves /auth/me, and reads /erp/items", async () => {
    const loginStart = Date.now();
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "admin@sphincs.local", password: "ChangeMe123!" })
      .expect(201);
    const loginDurationMs = Date.now() - loginStart;

    expect(login.body.accessToken).toBeDefined();
    expect(login.body.refreshToken).toBeDefined();
    expect(loginDurationMs).toBeLessThan(1200);

    const token = login.body.accessToken as string;

    const me = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(me.body.email).toBe("admin@sphincs.local");
    expect(me.body.roles).toContain("Admin");

    const items = await request(app.getHttpServer())
      .get("/api/v1/erp/items")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(items.body)).toBe(true);
    expect(items.body[0].name).toBe("Seed Item");
  });

  it("allows tester signup and returns a session payload", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/signup")
      .send({ email: "tester@sphincs.local", password: "ChangeMe123!" })
      .expect(201);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user.email).toBe("tester@sphincs.local");
    expect(response.body.user.roles).toContain("Staff");
  });

  it("submits a bug report and returns created issue info", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "admin@sphincs.local", password: "ChangeMe123!" })
      .expect(201);
    const token = login.body.accessToken as string;

    const bug = await request(app.getHttpServer())
      .post("/api/v1/bugs/report")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Save fails in ERP",
        summary: "Saving suppliers fails after edit",
        sourceApp: "ERP",
        severity: "high",
        module: "suppliers",
        route: "/erp/suppliers",
        appVersion: "beta-v1",
        userAgent: "e2e-agent",
        steps: ["Open suppliers", "Edit supplier", "Click save"],
        expected: "Record should be stored",
        actual: "Request fails"
      })
      .expect(201);

    expect(bug.body.issueNumber).toBe(999);
    expect(bug.body.issueState).toBe("open");
    expect(bug.body.issueUrl).toContain("/issues/999");
  });
});
