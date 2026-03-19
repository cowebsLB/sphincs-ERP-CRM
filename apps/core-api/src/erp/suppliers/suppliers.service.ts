import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

type UserScope = {
  id: string;
  organizationId: string;
  branchId?: string | null;
};

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  private requireScope(scope?: UserScope): UserScope {
    if (!scope?.id || !scope.organizationId) {
      throw new NotFoundException("Missing user scope");
    }
    return scope;
  }

  findAll(includeDeleted: boolean, scope?: UserScope) {
    const user = this.requireScope(scope);
    return this.prisma.supplier.findMany({
      where: {
        organization_id: user.organizationId,
        created_by: user.id,
        ...(includeDeleted ? {} : { deleted_at: null })
      },
      orderBy: { created_at: "desc" }
    });
  }

  create(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    return this.prisma.supplier.create({
      data: {
        organization_id: user.organizationId,
        branch_id: user.branchId ?? null,
        name: String(body.name ?? "Unnamed supplier"),
        email: body.email ? String(body.email) : null,
        phone: body.phone ? String(body.phone) : null,
        created_by: user.id,
        updated_by: user.id
      }
    });
  }

  async update(id: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.supplier.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      }
    });
    if (!existing) {
      throw new NotFoundException("Supplier not found");
    }

    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: body.name ? String(body.name) : undefined,
        email: body.email === undefined ? undefined : (body.email ? String(body.email) : null),
        phone: body.phone === undefined ? undefined : (body.phone ? String(body.phone) : null),
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: user.id
      }
    });
  }

  async restore(id: string, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.supplier.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      }
    });
    if (!existing) {
      throw new NotFoundException("Supplier not found");
    }
    return this.prisma.supplier.update({
      where: { id },
      data: {
        deleted_at: null,
        updated_by: user.id
      }
    });
  }
}
