import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../../prisma.service";
import { hashPassword, verifyPassword } from "../../common/security/password";
import { createHash, randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { AuthRateLimitService } from "./auth-rate-limit.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger("AuthPerformance");
  private readonly accessSecret =
    process.env.JWT_ACCESS_SECRET?.trim() || process.env.JWT_SECRET?.trim() || "change-me";
  private readonly refreshSecret =
    process.env.JWT_REFRESH_SECRET?.trim() || process.env.JWT_SECRET?.trim() || "change-me";
  private readonly accessTokenExpiresIn = "1h";
  private readonly refreshTokenExpiresIn = "7d";
  constructor(
    private readonly prisma: PrismaService,
    private readonly authRateLimitService: AuthRateLimitService
  ) {}

  private hashRefreshToken(refreshToken: string): string {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  private createAccessToken(payload: {
    sub: string;
    email: string;
    roles: string[];
    organizationId: string;
    branchId: string | null;
  }): string {
    return jwt.sign(payload, this.accessSecret, { expiresIn: this.accessTokenExpiresIn });
  }

  private createRefreshToken(sub: string): string {
    return jwt.sign({ sub, type: "refresh", jti: randomUUID() }, this.refreshSecret, {
      expiresIn: this.refreshTokenExpiresIn
    });
  }

  private async persistRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const decoded = jwt.decode(refreshToken) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 86400 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: this.hashRefreshToken(refreshToken),
        expires_at: expiresAt
      }
    });
  }

  private sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private obfuscateEmail(email: string): string {
    return createHash("sha256").update(email).digest("hex").slice(0, 12);
  }

  private buildRateLimitKey(email: string, clientFingerprint: string): string {
    return `${email}|${clientFingerprint}`;
  }

  resetLoginRateLimit(email: string): { email: string; removedKeys: number } {
    const normalizedEmail = this.sanitizeEmail(email);
    const removedKeys = this.authRateLimitService.resetByEmail(normalizedEmail);
    return { email: normalizedEmail, removedKeys };
  }

  private getRoleNamesFromUser(user: {
    user_roles: Array<{ role: { name: string } }>;
  }): string[] {
    return user.user_roles.map((record) => record.role.name);
  }

  private logLoginPerformance(metrics: {
    emailFingerprint: string;
    userFound: boolean;
    passwordValid: boolean;
    dbLookupMs: number;
    passwordMs: number;
    jwtSignMs: number;
    totalMs: number;
    roleCount: number;
  }): void {
    this.logger.log(JSON.stringify(metrics));
  }

  async login(email: string, password: string, clientFingerprint = "unknown") {
    const loginStart = Date.now();
    const normalizedEmail = this.sanitizeEmail(email);
    const emailFingerprint = this.obfuscateEmail(normalizedEmail);
    const rateLimitKey = this.buildRateLimitKey(normalizedEmail, clientFingerprint);
    this.authRateLimitService.consume(rateLimitKey);

    const dbLookupStart = Date.now();
    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, deleted_at: null, status: "ACTIVE" },
      select: {
        id: true,
        email: true,
        password_hash: true,
        organization_id: true,
        branch_id: true,
        user_roles: {
          where: { deleted_at: null },
          select: { role: { select: { name: true } } }
        }
      }
    });
    const dbLookupMs = Date.now() - dbLookupStart;

    if (!user) {
      this.authRateLimitService.recordFailure(rateLimitKey);
      this.logLoginPerformance({
        emailFingerprint,
        userFound: false,
        passwordValid: false,
        dbLookupMs,
        passwordMs: 0,
        jwtSignMs: 0,
        totalMs: Date.now() - loginStart,
        roleCount: 0
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordStart = Date.now();
    let validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      const legacy = createHash("sha256").update(password).digest("hex");
      validPassword = legacy === user.password_hash;
      if (validPassword) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { password_hash: await hashPassword(password) }
        });
      }
    }
    const passwordMs = Date.now() - passwordStart;

    if (!validPassword) {
      this.authRateLimitService.recordFailure(rateLimitKey);
      this.logLoginPerformance({
        emailFingerprint,
        userFound: true,
        passwordValid: false,
        dbLookupMs,
        passwordMs,
        jwtSignMs: 0,
        totalMs: Date.now() - loginStart,
        roleCount: 0
      });
      throw new UnauthorizedException("Invalid credentials");
    }
    this.authRateLimitService.reset(rateLimitKey);

    const roles = this.getRoleNamesFromUser(user);
    const jwtStart = Date.now();
    const accessToken = this.createAccessToken({
      sub: user.id,
      email: user.email,
      roles,
      organizationId: user.organization_id,
      branchId: user.branch_id
    });
    let refreshToken = this.createRefreshToken(user.id);
    const jwtSignMs = Date.now() - jwtStart;
    try {
      await this.persistRefreshToken(user.id, refreshToken);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        refreshToken = this.createRefreshToken(user.id);
        await this.persistRefreshToken(user.id, refreshToken);
      } else {
        throw error;
      }
    }
    const totalMs = Date.now() - loginStart;
    this.logLoginPerformance({
      emailFingerprint,
      userFound: true,
      passwordValid: true,
      dbLookupMs,
      passwordMs,
      jwtSignMs,
      totalMs,
      roleCount: roles.length
    });

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      user: {
        id: user.id,
        email: user.email,
        roles,
        organizationId: user.organization_id,
        branchId: user.branch_id
      }
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret) as { sub: string; exp?: number; type?: string };
      if (decoded.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const tokenHash = this.hashRefreshToken(refreshToken);
      const existing = await this.prisma.refreshToken.findFirst({
        where: {
          token_hash: tokenHash,
          user_id: decoded.sub
        }
      });
      if (!existing) {
        throw new UnauthorizedException("Invalid refresh token");
      }
      if (existing.revoked_at) {
        await this.prisma.refreshToken.updateMany({
          where: {
            user_id: decoded.sub,
            revoked_at: null
          },
          data: { revoked_at: new Date() }
        });
        this.logger.warn(
          JSON.stringify({
            event: "refresh_reuse_detected",
            userId: decoded.sub
          })
        );
        throw new UnauthorizedException("Refresh token reuse detected. Please login again.");
      }
      if (existing.expires_at.getTime() <= Date.now()) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user || user.deleted_at !== null || user.status !== "ACTIVE") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const roles = await this.prisma.userRole.findMany({
        where: { user_id: user.id, deleted_at: null },
        select: { role: { select: { name: true } } }
      });
      const accessToken = this.createAccessToken({
        sub: user.id,
        email: user.email,
        roles: roles.map((record) => record.role.name),
        organizationId: user.organization_id,
        branchId: user.branch_id
      });
      let newRefreshToken = this.createRefreshToken(user.id);
      const createNextRefreshToken = async () => {
        await this.persistRefreshToken(user.id, newRefreshToken);
      };

      await this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revoked_at: new Date() }
      });
      try {
        await createNextRefreshToken();
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          newRefreshToken = this.createRefreshToken(user.id);
          await createNextRefreshToken();
        } else {
          throw error;
        }
      }

      return { accessToken, refreshToken: newRefreshToken, tokenType: "Bearer" };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async me(userId: string) {
    if (!userId) {
      throw new UnauthorizedException("Missing user context");
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deleted_at !== null) {
      throw new UnauthorizedException("User not found");
    }
    const roles = await this.prisma.userRole.findMany({
      where: { user_id: user.id, deleted_at: null },
      select: { role: { select: { name: true } } }
    });
    return {
      id: user.id,
      email: user.email,
      roles: roles.map((record) => record.role.name),
      organizationId: user.organization_id,
      branchId: user.branch_id
    };
  }
}
