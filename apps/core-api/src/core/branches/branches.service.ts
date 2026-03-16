import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeDeleted = false) {
    return this.prisma.branch.findMany({
      where: includeDeleted ? {} : { deleted_at: null },
      orderBy: { created_at: "desc" }
    });
  }

  create(body: Record<string, unknown>) {
    return this.prisma.branch.create({
      data: {
        organization_id: String(body.organization_id ?? "00000000-0000-0000-0000-000000000001"),
        name: String(body.name ?? "Unnamed branch"),
        created_by: body.created_by ? String(body.created_by) : null,
        updated_by: body.updated_by ? String(body.updated_by) : null
      }
    });
  }

  async update(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Branch not found");
    }

    return this.prisma.branch.update({
      where: { id },
      data: {
        name: body.name ? String(body.name) : undefined,
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: body.updated_by ? String(body.updated_by) : undefined
      }
    });
  }
}
