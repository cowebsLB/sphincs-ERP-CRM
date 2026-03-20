import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { hashPassword } from "../../common/security/password";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private mapUser(record: {
    id: string;
    organization_id: string;
    branch_id: string | null;
    email: string;
    status: string;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
    user_roles: Array<{ role: { name: string } }>;
  }) {
    return {
      id: record.id,
      organization_id: record.organization_id,
      branch_id: record.branch_id,
      email: record.email,
      status: record.status,
      deleted_at: record.deleted_at,
      created_at: record.created_at,
      updated_at: record.updated_at,
      roles: record.user_roles.map((entry) => entry.role.name)
    };
  }

  private async revokeActiveSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        user_id: userId,
        revoked_at: null
      },
      data: {
        revoked_at: new Date()
      }
    });
  }

  private normalizeRoleNames(input: unknown): string[] | undefined {
    if (input === undefined) {
      return undefined;
    }
    if (!Array.isArray(input)) {
      throw new BadRequestException("roles must be an array of role names");
    }
    const normalized = input
      .map((value) => String(value).trim())
      .filter(Boolean);
    return [...new Set(normalized)];
  }

  private async syncRoles(userId: string, roleNames: string[], actorId?: string | null) {
    const activeRoles = await this.prisma.role.findMany({
      where: { name: { in: roleNames }, deleted_at: null },
      select: { id: true, name: true }
    });

    if (activeRoles.length !== roleNames.length) {
      const found = new Set(activeRoles.map((role) => role.name));
      const missing = roleNames.filter((name) => !found.has(name));
      throw new BadRequestException(`Unknown role(s): ${missing.join(", ")}`);
    }

    const existingAssignments = await this.prisma.userRole.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        deleted_at: true,
        role: { select: { name: true } }
      }
    });

    const desiredByName = new Map(activeRoles.map((role) => [role.name, role]));

    for (const assignment of existingAssignments) {
      const shouldBeActive = desiredByName.has(assignment.role.name);
      if (!shouldBeActive && assignment.deleted_at === null) {
        await this.prisma.userRole.update({
          where: { id: assignment.id },
          data: {
            deleted_at: new Date(),
            updated_by: actorId ?? undefined
          }
        });
      }
      if (shouldBeActive && assignment.deleted_at !== null) {
        await this.prisma.userRole.update({
          where: { id: assignment.id },
          data: {
            deleted_at: null,
            updated_by: actorId ?? undefined
          }
        });
      }
      desiredByName.delete(assignment.role.name);
    }

    for (const role of desiredByName.values()) {
      await this.prisma.userRole.create({
        data: {
          user_id: userId,
          role_id: role.id,
          created_by: actorId ?? undefined,
          updated_by: actorId ?? undefined
        }
      });
    }
  }

  findAll(includeDeleted = false) {
    return this.prisma.user.findMany({
      where: includeDeleted ? {} : { deleted_at: null },
      orderBy: { created_at: "desc" },
      include: {
        user_roles: {
          where: { deleted_at: null },
          select: { role: { select: { name: true } } }
        }
      }
    }).then((records) => records.map((record) => this.mapUser(record)));
  }

  private async getMappedUser(id: string) {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: {
        user_roles: {
          where: { deleted_at: null },
          select: { role: { select: { name: true } } }
        }
      }
    });
    if (!record) {
      throw new NotFoundException("User not found");
    }
    return this.mapUser(record);
  }

  async create(body: Record<string, unknown>) {
    const rawPassword = String(body.password ?? "ChangeMe123!");
    const roleNames = this.normalizeRoleNames(body.roles) ?? ["Staff"];
    const createdBy = body.created_by ? String(body.created_by) : null;
    const user = await this.prisma.user.create({
      data: {
        organization_id: String(body.organization_id ?? "00000000-0000-0000-0000-000000000001"),
        branch_id: body.branch_id ? String(body.branch_id) : null,
        email: String(body.email ?? `user-${Date.now()}@sphincs.local`),
        password_hash: await hashPassword(rawPassword),
        status: String(body.status ?? "ACTIVE"),
        created_by: createdBy,
        updated_by: body.updated_by ? String(body.updated_by) : null
      }
    });
    await this.syncRoles(user.id, roleNames, createdBy);
    return this.getMappedUser(user.id);
  }

  async update(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: {
        user_roles: {
          where: { deleted_at: null },
          select: { role: { select: { name: true } } }
        }
      }
    });
    if (!existing) {
      throw new NotFoundException("User not found");
    }

    const updatedBy = body.updated_by ? String(body.updated_by) : undefined;
    const roleNames = this.normalizeRoleNames(body.roles);
    const currentRoleNames = existing.user_roles.map((entry) => entry.role.name).sort();
    const nextRoleNames = roleNames ? [...roleNames].sort() : currentRoleNames;
    const nextStatus = body.status ? String(body.status) : existing.status;
    const nextDeletedAt = body.deleted_at === undefined ? existing.deleted_at : ((body.deleted_at as Date | null) ?? null);
    const criticalChange =
      body.password !== undefined ||
      nextStatus !== existing.status ||
      String(nextDeletedAt) !== String(existing.deleted_at) ||
      currentRoleNames.join("|") !== nextRoleNames.join("|");

    await this.prisma.user.update({
      where: { id },
      data: {
        branch_id: body.branch_id === undefined ? undefined : (body.branch_id ? String(body.branch_id) : null),
        status: body.status ? String(body.status) : undefined,
        password_hash: body.password ? await hashPassword(String(body.password)) : undefined,
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: updatedBy
      }
    });

    if (roleNames !== undefined) {
      await this.syncRoles(id, roleNames, updatedBy);
    }

    if (criticalChange) {
      await this.revokeActiveSessions(id);
    }

    return this.getMappedUser(id);
  }

  async restore(id: string, updatedBy?: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("User not found");
    }
    await this.prisma.user.update({
      where: { id },
      data: {
        deleted_at: null,
        updated_by: updatedBy ?? undefined
      }
    });
    return this.getMappedUser(id);
  }
}
