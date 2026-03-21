import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { AuditService } from "../../audit/audit.service";
import { Prisma } from "@prisma/client";

export type LeadStatus = "NEW" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED";
type UserScope = {
  id: string;
  organizationId: string;
  branchId?: string | null;
};

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}
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

  private async validateContactScope(contactId: string | null, user: UserScope) {
    if (!contactId) {
      return;
    }

    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        branch_id: true
      }
    });

    if (!contact) {
      throw new BadRequestException("contact_id must reference a contact in your organization");
    }

    if (user.branchId && contact.branch_id && contact.branch_id !== user.branchId) {
      throw new BadRequestException("contact_id must reference a contact in your branch");
    }
  }

  async create(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const contactId = this.parseOptionalUuid(body.contact_id, "contact_id");
    await this.validateContactScope(contactId, user);

    return this.prisma.lead.create({
      data: {
        organization_id: user.organizationId,
        branch_id: user.branchId ?? null,
        contact_id: contactId,
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

    const contactId =
      body.contact_id === undefined ? undefined : this.parseOptionalUuid(body.contact_id, "contact_id");

    if (contactId !== undefined) {
      await this.validateContactScope(contactId, user);
    }

    return this.prisma.lead.update({
      where: { id },
      data: {
        contact_id: contactId,
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

  async convertToOpportunity(id: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id,
        deleted_at: null
      }
    });

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    if (lead.status === "DISQUALIFIED") {
      throw new BadRequestException("Disqualified leads cannot be converted to opportunities");
    }

    if (lead.status === "CONVERTED") {
      throw new BadRequestException("Lead is already converted");
    }

    const openingStatusRaw = String(body.opportunity_status ?? "OPEN").trim().toUpperCase();
    if (openingStatusRaw !== "OPEN") {
      throw new BadRequestException("opportunity_status must be OPEN on lead conversion");
    }

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: "CONVERTED",
          updated_by: user.id
        }
      });

      const opportunity = await tx.opportunity.create({
        data: {
          organization_id: user.organizationId,
          branch_id: user.branchId ?? null,
          lead_id: lead.id,
          status: "OPEN",
          created_by: user.id,
          updated_by: user.id
        }
      });

      return {
        lead: updatedLead,
        opportunity
      };
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.id,
      action: "CRM_LEAD_CONVERTED_TO_OPPORTUNITY",
      entityType: "crm_lead",
      entityId: lead.id,
      metadata: {
        leadId: lead.id,
        opportunityId: result.opportunity.id,
        previousLeadStatus: lead.status,
        newLeadStatus: "CONVERTED",
        opportunityStatus: "OPEN"
      }
    });

    return result;
  }
}
