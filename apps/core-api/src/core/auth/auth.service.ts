import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../../prisma.service";
import { hashPassword, verifyPassword } from "../../common/security/password";
import { createHash, randomUUID } from "crypto";
import { Prisma } from "@prisma/client";

@Injectable()
export class AuthService {
  private readonly accessSecret =
    process.env.JWT_ACCESS_SECRET?.trim() || process.env.JWT_SECRET?.trim() || "change-me";
  private readonly refreshSecret =
    process.env.JWT_REFRESH_SECRET?.trim() || process.env.JWT_SECRET?.trim() || "change-me";
  constructor(private readonly prisma: PrismaService) {}

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
    return jwt.sign(payload, this.accessSecret, { expiresIn: "1h" });
  }

  private createRefreshToken(sub: string): string {
    return jwt.sign({ sub, type: "refresh", jti: randomUUID() }, this.refreshSecret, {
      expiresIn: "7d"
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

  private async fetchUserRoles(userId: string): Promise<string[]> {
    const records = await this.prisma.userRole.findMany({
      where: { user_id: userId, deleted_at: null },
      include: { role: true }
    });
    return records.map((r) => r.role.name);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    if (!user || user.deleted_at !== null || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid credentials");
    }

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

    if (!validPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const roles = await this.fetchUserRoles(user.id);
    const accessToken = this.createAccessToken({
      sub: user.id,
      email: user.email,
      roles,
      organizationId: user.organization_id,
      branchId: user.branch_id
    });
    let refreshToken = this.createRefreshToken(user.id);
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

    return { accessToken, refreshToken, tokenType: "Bearer" };
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
          user_id: decoded.sub,
          revoked_at: null,
          expires_at: { gt: new Date() }
        }
      });
      if (!existing) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user || user.deleted_at !== null || user.status !== "ACTIVE") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const roles = await this.fetchUserRoles(user.id);
      const accessToken = this.createAccessToken({
        sub: user.id,
        email: user.email,
        roles,
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
    } catch {
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
    const roles = await this.fetchUserRoles(user.id);
    return {
      id: user.id,
      email: user.email,
      roles,
      organizationId: user.organization_id,
      branchId: user.branch_id
    };
  }
}
