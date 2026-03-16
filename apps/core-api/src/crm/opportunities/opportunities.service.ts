import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";

export type OpportunityStatus = "OPEN" | "WON" | "LOST";

interface OpportunityRecord {
  id: string;
  organization_id: string;
  branch_id: string | null;
  lead_id: string | null;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

@Injectable()
export class OpportunitiesService {
  private readonly opportunities: OpportunityRecord[] = [];

  findAll(includeDeleted: boolean) {
    return this.opportunities.filter((entry) => includeDeleted || entry.deleted_at === null);
  }

  create(body: Record<string, unknown>) {
    const now = new Date().toISOString();
    const opportunity: OpportunityRecord = {
      id: randomUUID(),
      organization_id: String(body.organization_id ?? "seed-org-id"),
      branch_id: body.branch_id ? String(body.branch_id) : null,
      lead_id: body.lead_id ? String(body.lead_id) : null,
      status: (body.status as OpportunityStatus) ?? "OPEN",
      created_at: now,
      updated_at: now,
      deleted_at: null,
      created_by: body.created_by ? String(body.created_by) : null,
      updated_by: body.updated_by ? String(body.updated_by) : null
    };
    this.opportunities.push(opportunity);
    return opportunity;
  }

  update(id: string, body: Record<string, unknown>) {
    const opportunity = this.opportunities.find((entry) => entry.id === id);
    if (!opportunity) {
      throw new NotFoundException("Opportunity not found");
    }
    Object.assign(opportunity, body, { updated_at: new Date().toISOString() });
    return opportunity;
  }
}
