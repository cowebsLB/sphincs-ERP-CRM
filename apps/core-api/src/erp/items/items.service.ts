import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeDeleted: boolean) {
    return this.prisma.item.findMany({
      where: includeDeleted ? {} : { deleted_at: null },
      orderBy: { created_at: "desc" }
    });
  }

  create(body: Record<string, unknown>) {
    return this.prisma.item.create({
      data: {
        organization_id: String(body.organization_id ?? "00000000-0000-0000-0000-000000000001"),
        branch_id: body.branch_id ? String(body.branch_id) : null,
        name: String(body.name ?? "Unnamed item"),
        sku: body.sku ? String(body.sku) : null,
        created_by: body.created_by ? String(body.created_by) : null,
        updated_by: body.updated_by ? String(body.updated_by) : null
      }
    });
  }

  async update(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.item.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Item not found");
    }

    return this.prisma.item.update({
      where: { id },
      data: {
        name: body.name ? String(body.name) : undefined,
        sku: body.sku === undefined ? undefined : (body.sku ? String(body.sku) : null),
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: body.updated_by ? String(body.updated_by) : undefined
      }
    });
  }
}
