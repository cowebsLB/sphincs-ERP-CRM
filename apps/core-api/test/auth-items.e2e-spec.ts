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
  const roleCatalog = [
    { id: "role-admin", name: "Admin" },
    { id: "role-erp", name: "ERP Manager" },
    { id: "role-crm", name: "CRM Manager" },
    { id: "role-staff", name: "Staff" }
  ];
  let adminRoleAssignments = [{ id: "ur-admin", roleName: "Admin", deleted_at: null as Date | null }];
  const refreshTokenStore: Array<{
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
    revoked_at: Date | null;
  }> = [];
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
      })),
      findMany: jest.fn(async ({ where }: { where?: { name?: { in?: string[] }; deleted_at?: null } }) => {
        const names = where?.name?.in;
        return roleCatalog.filter((role) => !names || names.includes(role.name));
      })
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
            status: adminUser.status,
            organization_id: adminUser.organization_id,
            branch_id: adminUser.branch_id,
            user_roles: adminRoleAssignments
              .filter((assignment) => assignment.deleted_at === null)
              .map((assignment) => ({ role: { name: assignment.roleName } }))
          };
        }
        return null;
      }),
      findUnique: jest.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
        if (signupUser && (where.email === signupUser.email || where.id === signupUser.id)) {
          return signupUser;
        }
        if (where.email === adminUser.email || where.id === adminUser.id) {
          return {
            ...adminUser,
            user_roles: adminRoleAssignments
              .filter((assignment) => assignment.deleted_at === null)
              .map((assignment) => ({ role: { name: assignment.roleName } }))
          };
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
      })),
      findMany: jest.fn(async () => [])
    },
    userRole: {
      findMany: jest.fn(async ({ where }: { where?: { user_id?: string; deleted_at?: null } }) => {
        if (where?.user_id === signupUser?.id) {
          return [{ role: { name: "Staff" } }];
        }
        return adminRoleAssignments
          .filter((assignment) => (where?.deleted_at === null ? assignment.deleted_at === null : true))
          .map((assignment) => ({
            id: assignment.id,
            deleted_at: assignment.deleted_at,
            role: { name: assignment.roleName }
          }));
      }),
      create: jest.fn(async () => ({
        id: "ur-1",
        user_id: signupUser?.id ?? "none",
        role_id: "role-staff"
      })),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: { deleted_at?: Date | null } }) => {
        adminRoleAssignments = adminRoleAssignments.map((assignment) =>
          assignment.id === where.id
            ? { ...assignment, deleted_at: data.deleted_at === undefined ? assignment.deleted_at : data.deleted_at }
            : assignment
        );
        return { id: where.id };
      })
    },
    refreshToken: {
      create: jest.fn(async ({ data }: { data: { user_id: string; token_hash: string; expires_at: Date } }) => {
        const record = {
          id: `rt-${refreshTokenStore.length + 1}`,
          user_id: data.user_id,
          token_hash: data.token_hash,
          expires_at: data.expires_at,
          revoked_at: null
        };
        refreshTokenStore.push(record);
        return record;
      }),
      findFirst: jest.fn(async ({ where }: { where: { token_hash?: string; user_id?: string } }) => {
        return (
          refreshTokenStore.find(
            (record) =>
              (where.token_hash === undefined || record.token_hash === where.token_hash) &&
              (where.user_id === undefined || record.user_id === where.user_id)
          ) ?? null
        );
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: { revoked_at?: Date | null } }) => {
        const record = refreshTokenStore.find((entry) => entry.id === where.id);
        if (record) {
          record.revoked_at = data.revoked_at === undefined ? record.revoked_at : data.revoked_at;
        }
        return record ?? { id: where.id };
      }),
      updateMany: jest.fn(async ({ where, data }: { where: { user_id?: string; revoked_at?: null }; data: { revoked_at: Date } }) => {
        let count = 0;
        for (const record of refreshTokenStore) {
          const matchesUser = where.user_id === undefined || record.user_id === where.user_id;
          const matchesRevoked = where.revoked_at === null ? record.revoked_at === null : true;
          if (matchesUser && matchesRevoked) {
            record.revoked_at = data.revoked_at;
            count += 1;
          }
        }
        return { count };
      })
    },
    item: {
      findFirst: jest.fn(
        async ({
          where
        }: {
          where?: { id?: string; organization_id?: string; deleted_at?: null };
        }) => {
          const seedItem = {
            id: "33333333-3333-4333-8333-333333333333",
            organization_id: adminUser.organization_id,
            branch_id: adminUser.branch_id,
            name: "Seed Item",
            sku: "ITEM-001",
            deleted_at: null
          };
          if (!where) {
            return seedItem;
          }
          if (where.id && where.id !== seedItem.id) {
            return null;
          }
          if (where.organization_id && where.organization_id !== seedItem.organization_id) {
            return null;
          }
          if (where.deleted_at === null && seedItem.deleted_at !== null) {
            return null;
          }
          return seedItem;
        }
      ),
      findMany: jest.fn(async () => [
        {
          id: "33333333-3333-4333-8333-333333333333",
          organization_id: adminUser.organization_id,
          branch_id: adminUser.branch_id,
          name: "Seed Item",
          sku: "ITEM-001",
          deleted_at: null
        }
      ]),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "33333333-3333-3333-3333-333333333334",
        organization_id: adminUser.organization_id,
        branch_id: adminUser.branch_id,
        name: String(data.name ?? "New Item"),
        sku: String(data.sku ?? "ITEM-NEW"),
        status: String(data.status ?? "ACTIVE"),
        deleted_at: null
      }))
    },
    supplier: {
      findFirst: jest.fn(
        async ({
          where
        }: {
          where?: { id?: string; organization_id?: string; deleted_at?: null };
        }) => {
          const seedSupplier = {
            id: "66666666-6666-4666-8666-666666666666",
            organization_id: adminUser.organization_id,
            branch_id: adminUser.branch_id,
            name: "Seed Supplier",
            supplier_code: "SUP-001",
            status: "ACTIVE",
            deleted_at: null
          };
          if (!where) {
            return seedSupplier;
          }
          if (where.id && where.id !== seedSupplier.id) {
            return null;
          }
          if (where.organization_id && where.organization_id !== seedSupplier.organization_id) {
            return null;
          }
          if (where.deleted_at === null && seedSupplier.deleted_at !== null) {
            return null;
          }
          return seedSupplier;
        }
      ),
      findMany: jest.fn(async () => [
        {
          id: "66666666-6666-4666-8666-666666666666",
          organization_id: adminUser.organization_id,
          branch_id: adminUser.branch_id,
          name: "Seed Supplier",
          supplier_code: "SUP-001",
          status: "ACTIVE",
          deleted_at: null
        }
      ]),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "66666666-6666-4666-8666-666666666667",
        organization_id: adminUser.organization_id,
        branch_id: adminUser.branch_id,
        name: String(data.name ?? "New Supplier"),
        supplier_code: String(data.supplier_code ?? "SUP-NEW"),
        status: String(data.status ?? "ACTIVE"),
        deleted_at: null
      }))
    },
    purchaseOrder: {
      findMany: jest.fn(async () => []),
      findFirst: jest.fn(async () => null),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> & { line_items?: { create?: unknown[] } } }) => ({
        id: "77777777-7777-4777-8777-777777777777",
        organization_id: adminUser.organization_id,
        branch_id: adminUser.branch_id,
        po_number: String(data.po_number ?? "PO-NEW"),
        supplier_id: String(data.supplier_id ?? ""),
        status: String(data.status ?? "DRAFT"),
        payment_status: String(data.payment_status ?? "UNPAID"),
        line_items: data.line_items?.create ?? []
      })),
      update: jest.fn(async () => ({
        id: "77777777-7777-4777-8777-777777777777",
        status: "DRAFT"
      }))
    },
    opportunity: {
      findFirst: jest.fn(
        async ({
          where
        }: {
          where?: {
            id?: string;
            organization_id?: string;
            created_by?: string;
            deleted_at?: null;
          };
        }) => {
          const wonOpportunity = {
            id: "88888888-8888-4888-8888-888888888888",
            organization_id: adminUser.organization_id,
            branch_id: adminUser.branch_id,
            lead_id: "99999999-9999-4999-8999-999999999999",
            status: "WON",
            created_by: adminUser.id,
            deleted_at: null
          };
          if (!where) {
            return wonOpportunity;
          }
          if (where.id && where.id !== wonOpportunity.id) {
            return null;
          }
          if (where.organization_id && where.organization_id !== wonOpportunity.organization_id) {
            return null;
          }
          if (where.created_by && where.created_by !== wonOpportunity.created_by) {
            return null;
          }
          if (where.deleted_at === null && wonOpportunity.deleted_at !== null) {
            return null;
          }
          return wonOpportunity;
        }
      )
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

  beforeEach(() => {
    adminRoleAssignments = [{ id: "ur-admin", roleName: "Admin", deleted_at: null }];
    refreshTokenStore.length = 0;
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

  it("revokes active refresh sessions when an admin changes roles", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "admin@sphincs.local", password: "ChangeMe123!" })
      .expect(201);

    const accessToken = login.body.accessToken as string;
    const refreshToken = login.body.refreshToken as string;

    mockPrisma.userRole.create.mockImplementationOnce(async (...args: unknown[]) => {
      const payload = args[0] as { data: { role_id: string } };
      const role = roleCatalog.find((entry) => entry.id === payload.data.role_id);
      adminRoleAssignments.push({
        id: "ur-crm",
        roleName: role?.name ?? "CRM Manager",
        deleted_at: null
      });
      return {
        id: "ur-crm",
        user_id: adminUser.id,
        role_id: payload.data.role_id
      };
    });

    await request(app.getHttpServer())
      .patch(`/api/v1/users/${adminUser.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        roles: ["CRM Manager"],
        updated_by: adminUser.id
      })
      .expect(200);

    const me = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(me.body.roles).toEqual(["CRM Manager"]);

    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(401);
  });

  it("supports Beta V2 ERP create flows for item, supplier, and purchase order", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "admin@sphincs.local", password: "ChangeMe123!" })
      .expect(201);
    const token = login.body.accessToken as string;

    const item = await request(app.getHttpServer())
      .post("/api/v1/erp/items")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Beta Test Mouse",
        sku: "beta-mouse-1",
        status: "ACTIVE",
        selling_price: 25
      })
      .expect(201);

    expect(item.body.name).toBe("Beta Test Mouse");
    expect(item.body.sku).toBe("BETA-MOUSE-1");

    const supplier = await request(app.getHttpServer())
      .post("/api/v1/erp/suppliers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Beta Supplier",
        supplier_code: "beta-sup-1",
        status: "ACTIVE"
      })
      .expect(201);

    expect(supplier.body.name).toBe("Beta Supplier");
    expect(supplier.body.supplier_code).toBe("BETA-SUP-1");

    const purchaseOrder = await request(app.getHttpServer())
      .post("/api/v1/erp/purchase-orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        supplier_id: "66666666-6666-4666-8666-666666666666",
        status: "DRAFT",
        line_items: [
          {
            item_id: "33333333-3333-4333-8333-333333333333",
            quantity: 2,
            unit_cost: 10,
            tax_rate: 5,
            discount: 0
          }
        ]
      })
      .expect(201);

    expect(purchaseOrder.body.status).toBe("DRAFT");
    expect(Array.isArray(purchaseOrder.body.line_items)).toBe(true);
  });

  it("rejects purchase-order line items with non-integer quantity", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "admin@sphincs.local", password: "ChangeMe123!" })
      .expect(201);
    const token = login.body.accessToken as string;

    await request(app.getHttpServer())
      .post("/api/v1/erp/purchase-orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        supplier_id: "66666666-6666-4666-8666-666666666666",
        status: "DRAFT",
        line_items: [
          {
            item_id: "33333333-3333-4333-8333-333333333333",
            quantity: 1.5,
            unit_cost: 10
          }
        ]
      })
      .expect(400);
  });

  it("creates a CRM-to-ERP purchase-order handoff for a won opportunity", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "admin@sphincs.local", password: "ChangeMe123!" })
      .expect(201);
    const token = login.body.accessToken as string;

    const handoff = await request(app.getHttpServer())
      .post("/api/v1/crm/opportunities/88888888-8888-4888-8888-888888888888/handoff/purchase-order")
      .set("Authorization", `Bearer ${token}`)
      .send({
        supplier_id: "66666666-6666-4666-8666-666666666666"
      })
      .expect(201);

    expect(handoff.body.status).toBe("DRAFT");
    expect(Array.isArray(handoff.body.line_items)).toBe(true);
  });
});
