import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      where: { deleted_at: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    });
  }

  async findPermissionsForRole(roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, deleted_at: null },
      select: { id: true, name: true }
    });
    if (!role) {
      throw new NotFoundException("Role not found");
    }
    const links = await this.prisma.rolePermission.findMany({
      where: { role_id: roleId },
      include: {
        permission: true
      },
      orderBy: { permission: { slug: "asc" } }
    });
    return {
      role,
      permissions: links.map((row) => ({
        ...row.permission,
        granted_at: row.granted_at,
        granted_by: row.granted_by
      }))
    };
  }
}
