import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export type OpportunityStatus = "OPEN" | "WON" | "LOST";

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeDeleted: boolean) {
    return this.prisma.opportunity.findMany({
      where: includeDeleted ? {} : { deleted_at: null },
      orderBy: { created_at: "desc" }
    });
  }

  create(body: Record<string, unknown>) {
    return this.prisma.opportunity.create({
      data: {
        organization_id: String(body.organization_id ?? "00000000-0000-0000-0000-000000000001"),
        branch_id: body.branch_id ? String(body.branch_id) : null,
        lead_id: body.lead_id ? String(body.lead_id) : null,
        status: (body.status as OpportunityStatus) ?? "OPEN",
        created_by: body.created_by ? String(body.created_by) : null,
        updated_by: body.updated_by ? String(body.updated_by) : null
      }
    });
  }

  async update(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Opportunity not found");
    }

    return this.prisma.opportunity.update({
      where: { id },
      data: {
        lead_id: body.lead_id === undefined ? undefined : (body.lead_id ? String(body.lead_id) : null),
        status: body.status ? (String(body.status) as OpportunityStatus) : undefined,
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: body.updated_by ? String(body.updated_by) : undefined
      }
    });
  }

  async restore(id: string, updatedBy?: string) {
    const existing = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Opportunity not found");
    }
    return this.prisma.opportunity.update({
      where: { id },
      data: {
        deleted_at: null,
        updated_by: updatedBy ?? undefined
      }
    });
  }
}
