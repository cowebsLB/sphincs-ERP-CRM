import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export type LeadStatus = "NEW" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED";
type UserScope = {
  id: string;
  organizationId: string;
  branchId?: string | null;
};

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  private readonly validStatuses: LeadStatus[] = ["NEW", "QUALIFIED", "DISQUALIFIED", "CONVERTED"];

  private requireScope(scope?: UserScope): UserScope {
    if (!scope?.id || !scope.organizationId) {
      throw new NotFoundException("Missing user scope");
    }
    return scope;
  }

  findAll(includeDeleted: boolean, scope?: UserScope) {
    const user = this.requireScope(scope);
    return this.prisma.lead.findMany({
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

  private parseCreateStatus(value: unknown): LeadStatus {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return "NEW";
    }
    if (!this.validStatuses.includes(text as LeadStatus)) {
      throw new BadRequestException(`status must be one of: ${this.validStatuses.join(", ")}`);
    }
    return text as LeadStatus;
  }

  private parseUpdateStatus(value: unknown): LeadStatus | undefined {
    if (value === undefined) {
      return undefined;
    }
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!this.validStatuses.includes(text as LeadStatus)) {
      throw new BadRequestException(`status must be one of: ${this.validStatuses.join(", ")}`);
    }
    return text as LeadStatus;
  }

  create(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    return this.prisma.lead.create({
      data: {
        organization_id: user.organizationId,
        branch_id: user.branchId ?? null,
        contact_id: this.parseOptionalUuid(body.contact_id, "contact_id"),
        status: this.parseCreateStatus(body.status),
        created_by: user.id,
        updated_by: user.id
      }
    });
  }

  async update(id: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.lead.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      }
    });
    if (!existing) {
      throw new NotFoundException("Lead not found");
    }

    return this.prisma.lead.update({
      where: { id },
      data: {
        contact_id:
          body.contact_id === undefined ? undefined : this.parseOptionalUuid(body.contact_id, "contact_id"),
        status: this.parseUpdateStatus(body.status),
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: user.id
      }
    });
  }

  async restore(id: string, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.lead.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      }
    });
    if (!existing) {
      throw new NotFoundException("Lead not found");
    }
    return this.prisma.lead.update({
      where: { id },
      data: {
        deleted_at: null,
        updated_by: user.id
      }
    });
  }
}
