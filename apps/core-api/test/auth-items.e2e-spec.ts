import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma.service";
import { hashPassword } from "../src/common/security/password";

const request = require("supertest");

describe("Auth + ERP smoke (e2e)", () => {
  let app: INestApplication;

  const adminUser = {
    id: "11111111-1111-1111-1111-111111111111",
    email: "admin@sphincs.local",
    password_hash: "",
    organization_id: "00000000-0000-0000-0000-000000000001",
    branch_id: "00000000-0000-0000-0000-000000000101",
    status: "ACTIVE",
    deleted_at: null
  };

  const mockPrisma = {
    user: {
      findFirst: jest.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
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
        if (where.email === adminUser.email || where.id === adminUser.id) {
          return adminUser;
        }
        return null;
      }),
      update: jest.fn(async ({ data }: { data: Partial<typeof adminUser> }) => ({
        ...adminUser,
        ...data
      }))
    },
    userRole: {
      findMany: jest.fn(async () => [{ role: { name: "Admin" } }])
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
});
