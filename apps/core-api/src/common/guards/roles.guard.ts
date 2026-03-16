import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import jwt from "jsonwebtoken";
import { PrismaService } from "../../prisma.service";

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly secret = process.env.JWT_SECRET ?? "change-me";
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: unknown }>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authHeader.slice("Bearer ".length);
    const decoded = jwt.verify(token, this.secret) as { sub: string; email?: string; organizationId?: string; branchId?: string | null };
    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub }
    });
    if (!user || user.deleted_at !== null || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid user");
    }

    const userRoleRecords = await this.prisma.userRole.findMany({
      where: { user_id: user.id, deleted_at: null },
      include: { role: true }
    });
    const userRoles = userRoleRecords.map((entry) => entry.role.name);
    request.user = {
      id: user.id,
      email: user.email,
      organizationId: user.organization_id,
      branchId: user.branch_id,
      roles: userRoles
    };

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
