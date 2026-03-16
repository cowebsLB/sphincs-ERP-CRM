import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

@Injectable()
export class PurchasingService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeDeleted: boolean) {
    return this.prisma.purchaseOrder.findMany({
      where: includeDeleted ? {} : { deleted_at: null },
      orderBy: { created_at: "desc" }
    });
  }

  create(body: Record<string, unknown>) {
    return this.prisma.purchaseOrder.create({
      data: {
        organization_id: String(body.organization_id ?? "00000000-0000-0000-0000-000000000001"),
        branch_id: body.branch_id ? String(body.branch_id) : null,
        supplier_id: body.supplier_id ? String(body.supplier_id) : null,
        status: (body.status as PurchaseOrderStatus) ?? "DRAFT",
        created_by: body.created_by ? String(body.created_by) : null,
        updated_by: body.updated_by ? String(body.updated_by) : null
      }
    });
  }

  async update(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Purchase order not found");
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplier_id:
          body.supplier_id === undefined ? undefined : (body.supplier_id ? String(body.supplier_id) : null),
        status: body.status ? (String(body.status) as PurchaseOrderStatus) : undefined,
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: body.updated_by ? String(body.updated_by) : undefined
      }
    });
  }
}
