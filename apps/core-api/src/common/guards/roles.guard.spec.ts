import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as jwt from "jsonwebtoken";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  const secret = "test-secret";
  const originalAccessSecret = process.env.JWT_ACCESS_SECRET;
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = secret;
    process.env.JWT_SECRET = secret;
  });

  afterAll(() => {
    process.env.JWT_ACCESS_SECRET = originalAccessSecret;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  function createContext(authHeader?: string) {
    const request = {
      headers: {
        authorization: authHeader
      },
      user: undefined
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request
      }),
      getHandler: () => "handler",
      getClass: () => "class"
    } as never;
  }

  it("returns unauthorized instead of throwing raw jwt errors for expired tokens", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(["Staff"])
    } as unknown as Reflector;
    const prisma = {
      user: { findUnique: jest.fn() },
      userRole: { findMany: jest.fn() }
    };
    const guard = new RolesGuard(reflector, prisma as never);
    const expiredToken = jwt.sign({ sub: "user-1" }, secret, { expiresIn: -10 });

    await expect(guard.canActivate(createContext(`Bearer ${expiredToken}`))).rejects.toThrow(
      new UnauthorizedException("Invalid or expired bearer token")
    );
  });
});
