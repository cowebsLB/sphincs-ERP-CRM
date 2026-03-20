import { HttpException, HttpStatus, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { hashPassword } from "../../common/security/password";
import { AuthRateLimitService } from "./auth-rate-limit.service";
import { AuthService } from "./auth.service";

describe("AuthService hardening", () => {
  const originalAccessSecret = process.env.JWT_ACCESS_SECRET;
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = "unit-access-secret";
    process.env.JWT_REFRESH_SECRET = "unit-refresh-secret";
  });

  afterAll(() => {
    process.env.JWT_ACCESS_SECRET = originalAccessSecret;
    process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
  });

  function createPrismaMock() {
    return {
      organization: {
        findFirst: jest.fn()
      },
      branch: {
        findFirst: jest.fn()
      },
      role: {
        findFirst: jest.fn()
      },
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn()
      },
      userRole: {
        findMany: jest.fn(),
        create: jest.fn()
      },
      refreshToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn()
      }
    };
  }

  function createRateLimiterMock(): jest.Mocked<AuthRateLimitService> {
    return {
      consume: jest.fn(),
      recordFailure: jest.fn(),
      reset: jest.fn(),
      resetByEmail: jest.fn()
    } as unknown as jest.Mocked<AuthRateLimitService>;
  }

  it("logs in successfully and clears rate-limit failures", async () => {
    const prisma = createPrismaMock();
    const limiter = createRateLimiterMock();
    const passwordHash = await hashPassword("ChangeMe123!");

    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      email: "admin@sphincs.local",
      password_hash: passwordHash,
      status: "ACTIVE",
      organization_id: "org-1",
      branch_id: "branch-1",
      user_roles: [{ role: { name: "Admin" } }]
    });
    prisma.refreshToken.create.mockResolvedValue({ id: "rt-1" });

    const service = new AuthService(prisma as never, limiter);
    const result = await service.login("admin@sphincs.local", "ChangeMe123!", "ip-1");

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.roles).toEqual(["Admin"]);
    expect(limiter.consume).toHaveBeenCalled();
    expect(limiter.reset).toHaveBeenCalled();
    expect(limiter.recordFailure).not.toHaveBeenCalled();
  });

  it("records failed login attempts on bad password", async () => {
    const prisma = createPrismaMock();
    const limiter = createRateLimiterMock();
    const passwordHash = await hashPassword("CorrectPassword1!");

    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      email: "admin@sphincs.local",
      password_hash: passwordHash,
      status: "ACTIVE",
      organization_id: "org-1",
      branch_id: "branch-1",
      user_roles: [{ role: { name: "Admin" } }]
    });

    const service = new AuthService(prisma as never, limiter);
    await expect(service.login("admin@sphincs.local", "WrongPassword!", "ip-2")).rejects.toBeInstanceOf(
      UnauthorizedException
    );
    expect(limiter.recordFailure).toHaveBeenCalled();
    expect(limiter.reset).not.toHaveBeenCalled();
  });

  it("shows a clear message for disabled accounts", async () => {
    const prisma = createPrismaMock();
    const limiter = createRateLimiterMock();
    const passwordHash = await hashPassword("ChangeMe123!");

    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      email: "disabled@sphincs.local",
      password_hash: passwordHash,
      status: "DISABLED",
      organization_id: "org-1",
      branch_id: "branch-1",
      user_roles: [{ role: { name: "Staff" } }]
    });

    const service = new AuthService(prisma as never, limiter);
    await expect(service.login("disabled@sphincs.local", "ChangeMe123!", "ip-disabled")).rejects.toThrow(
      "Your account is disabled. Contact an admin."
    );
  });

  it("shows a clear message for active accounts with no roles", async () => {
    const prisma = createPrismaMock();
    const limiter = createRateLimiterMock();
    const passwordHash = await hashPassword("ChangeMe123!");

    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      email: "noroles@sphincs.local",
      password_hash: passwordHash,
      status: "ACTIVE",
      organization_id: "org-1",
      branch_id: "branch-1",
      user_roles: []
    });

    const service = new AuthService(prisma as never, limiter);
    await expect(service.login("noroles@sphincs.local", "ChangeMe123!", "ip-noroles")).rejects.toThrow(
      "Your account does not have platform access. Contact an admin."
    );
  });

  it("blocks login when rate limiter rejects the request", async () => {
    const prisma = createPrismaMock();
    const limiter = createRateLimiterMock();
    limiter.consume.mockImplementation(() => {
      throw new HttpException("Too many login attempts", HttpStatus.TOO_MANY_REQUESTS);
    });

    const service = new AuthService(prisma as never, limiter);
    await expect(service.login("admin@sphincs.local", "any", "ip-3")).rejects.toBeInstanceOf(
      HttpException
    );
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("detects refresh token reuse and revokes active sessions", async () => {
    const prisma = createPrismaMock();
    const limiter = createRateLimiterMock();
    const service = new AuthService(prisma as never, limiter);

    const refreshToken = jwt.sign(
      { sub: "user-1", type: "refresh" },
      process.env.JWT_REFRESH_SECRET || "unit-refresh-secret"
    );

    prisma.refreshToken.findFirst.mockResolvedValue({
      id: "rt-1",
      user_id: "user-1",
      revoked_at: new Date(),
      expires_at: new Date(Date.now() + 60_000)
    });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    await expect(service.refresh(refreshToken)).rejects.toThrow(
      "Refresh token reuse detected. Please login again."
    );
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });

  it("creates a beta tester account through signup and returns a session", async () => {
    const prisma = createPrismaMock();
    const limiter = createRateLimiterMock();
    const service = new AuthService(prisma as never, limiter);
    const passwordHash = await hashPassword("ChangeMe123!");

    prisma.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "user-2",
        email: "tester@sphincs.local",
        password_hash: passwordHash,
        status: "ACTIVE",
        organization_id: "org-1",
        branch_id: "branch-1",
        user_roles: [{ role: { name: "Staff" } }]
      });
    prisma.organization.findFirst.mockResolvedValue({
      id: "org-1",
      created_at: new Date(),
      updated_at: new Date(),
      name: "SPHINCS",
      deleted_at: null,
      created_by: null,
      updated_by: null
    });
    prisma.branch.findFirst.mockResolvedValue({
      id: "branch-1",
      organization_id: "org-1",
      name: "Main",
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      created_by: null,
      updated_by: null
    });
    prisma.role.findFirst.mockResolvedValue({
      id: "role-staff",
      name: "Staff",
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      created_by: null,
      updated_by: null
    });
    prisma.user.create.mockResolvedValue({
      id: "user-2",
      email: "tester@sphincs.local",
      organization_id: "org-1",
      branch_id: "branch-1",
      status: "ACTIVE",
      password_hash: passwordHash,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      created_by: null,
      updated_by: null
    });
    prisma.userRole.create.mockResolvedValue({
      id: "ur-1",
      user_id: "user-2",
      role_id: "role-staff",
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      created_by: "user-2",
      updated_by: "user-2"
    });
    prisma.refreshToken.create.mockResolvedValue({ id: "rt-1" });

    const session = await service.signup("tester@sphincs.local", "ChangeMe123!", "ip-signup");
    expect(session.accessToken).toBeDefined();
    expect(session.refreshToken).toBeDefined();
    expect(session.user.roles).toContain("Staff");
    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.userRole.create).toHaveBeenCalled();
  });
});
