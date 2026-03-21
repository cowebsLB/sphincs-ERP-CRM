import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PurchasingService } from "../../erp/purchasing/purchasing.service";

export type OpportunityStatus = "OPEN" | "WON" | "LOST";
type UserScope = {
  id: string;
  organizationId: string;
  branchId?: string | null;
};

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly purchasingService: PurchasingService
  ) {}
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

  private async validateLeadScope(leadId: string | null, user: UserScope) {
    if (!leadId) {
      return;
    }

    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        branch_id: true
      }
    });

    if (!lead) {
      throw new BadRequestException("lead_id must reference a lead in your organization");
    }

    if (user.branchId && lead.branch_id && lead.branch_id !== user.branchId) {
      throw new BadRequestException("lead_id must reference a lead in your branch");
    }
  }

  async create(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const leadId = this.parseOptionalUuid(body.lead_id, "lead_id");
    await this.validateLeadScope(leadId, user);

    return this.prisma.opportunity.create({
      data: {
        organization_id: user.organizationId,
        branch_id: user.branchId ?? null,
        lead_id: leadId,
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

    const leadId = body.lead_id === undefined ? undefined : this.parseOptionalUuid(body.lead_id, "lead_id");
    if (leadId !== undefined) {
      await this.validateLeadScope(leadId, user);
    }

    return this.prisma.opportunity.update({
      where: { id },
      data: {
        lead_id: leadId,
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

  async createPurchaseOrderHandoff(id: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const opportunity = await this.prisma.opportunity.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id,
        deleted_at: null
      }
    });

    if (!opportunity) {
      throw new NotFoundException("Opportunity not found");
    }

    if (opportunity.status !== "WON") {
      throw new BadRequestException("Opportunity must be WON before ERP handoff");
    }

    const lineItems = Array.isArray(body.line_items) && body.line_items.length > 0
      ? body.line_items
      : [
          {
            item_id: null,
            description: `CRM opportunity ${id} handoff`,
            quantity: 1,
            unit_cost: 0,
            tax_rate: 0,
            discount: 0
          }
        ];

    const handoffPayload: Record<string, unknown> = {
      supplier_id: body.supplier_id,
      status: "DRAFT",
      payment_status: "UNPAID",
      payment_terms: body.payment_terms,
      expected_delivery_date: body.expected_delivery_date,
      shipping_address: body.shipping_address,
      shipping_method: body.shipping_method,
      tracking_number: body.tracking_number,
      notes:
        `CRM handoff from opportunity ${id}` +
        (opportunity.lead_id ? ` (lead ${opportunity.lead_id})` : "") +
        (body.notes ? ` | ${String(body.notes)}` : ""),
      line_items: lineItems
    };

    return this.purchasingService.create(handoffPayload, user);
  }
}
