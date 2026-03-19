import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export type OpportunityStatus = "OPEN" | "WON" | "LOST";
type UserScope = {
  id: string;
  organizationId: string;
  branchId?: string | null;
};

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  private readonly validStatuses: OpportunityStatus[] = ["OPEN", "WON", "LOST"];

  private requireScope(scope?: UserScope): UserScope {
    if (!scope?.id || !scope.organizationId) {
      throw new NotFoundException("Missing user scope");
    }
    return scope;
  }

  findAll(includeDeleted: boolean, scope?: UserScope) {
    const user = this.requireScope(scope);
    return this.prisma.opportunity.findMany({
      where: {
        organization_id: user.organizationId,
        created_by: user.id,
        ...(includeDeleted ? {} : { deleted_at: null })
      },
      orderBy: { created_at: "desc" }
    });
  }

  private parseOptionalUuid(value: unknown, fieldName: string): string | null {
    const text = String(value ?? "").trim();
    if (!text) {
      return null;
    }
    if (!this.uuidPattern.test(text)) {
      throw new BadRequestException(`${fieldName} must be a valid UUID`);
    }
    return text;
  }

  private parseCreateStatus(value: unknown): OpportunityStatus {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return "OPEN";
    }
    if (!this.validStatuses.includes(text as OpportunityStatus)) {
      throw new BadRequestException(`status must be one of: ${this.validStatuses.join(", ")}`);
    }
    return text as OpportunityStatus;
  }

  private parseUpdateStatus(value: unknown): OpportunityStatus | undefined {
    if (value === undefined) {
      return undefined;
    }
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!this.validStatuses.includes(text as OpportunityStatus)) {
      throw new BadRequestException(`status must be one of: ${this.validStatuses.join(", ")}`);
    }
    return text as OpportunityStatus;
  }

  create(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    return this.prisma.opportunity.create({
      data: {
        organization_id: user.organizationId,
        branch_id: user.branchId ?? null,
        lead_id: this.parseOptionalUuid(body.lead_id, "lead_id"),
        status: this.parseCreateStatus(body.status),
        created_by: user.id,
        updated_by: user.id
      }
    });
  }

  async update(id: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.opportunity.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      }
    });
    if (!existing) {
      throw new NotFoundException("Opportunity not found");
    }

    return this.prisma.opportunity.update({
      where: { id },
      data: {
        lead_id: body.lead_id === undefined ? undefined : this.parseOptionalUuid(body.lead_id, "lead_id"),
        status: this.parseUpdateStatus(body.status),
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: user.id
      }
    });
  }

  async restore(id: string, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.opportunity.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      }
    });
    if (!existing) {
      throw new NotFoundException("Opportunity not found");
    }
    return this.prisma.opportunity.update({
      where: { id },
      data: {
        deleted_at: null,
        updated_by: user.id
      }
    });
  }
}
