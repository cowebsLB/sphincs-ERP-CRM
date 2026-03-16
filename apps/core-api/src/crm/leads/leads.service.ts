import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";

export type LeadStatus = "NEW" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED";

interface LeadRecord {
  id: string;
  organization_id: string;
  branch_id: string | null;
  contact_id: string | null;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

@Injectable()
export class LeadsService {
  private readonly leads: LeadRecord[] = [];

  findAll(includeDeleted: boolean) {
    return this.leads.filter((entry) => includeDeleted || entry.deleted_at === null);
  }

  create(body: Record<string, unknown>) {
    const now = new Date().toISOString();
    const lead: LeadRecord = {
      id: randomUUID(),
      organization_id: String(body.organization_id ?? "seed-org-id"),
      branch_id: body.branch_id ? String(body.branch_id) : null,
      contact_id: body.contact_id ? String(body.contact_id) : null,
      status: (body.status as LeadStatus) ?? "NEW",
      created_at: now,
      updated_at: now,
      deleted_at: null,
      created_by: body.created_by ? String(body.created_by) : null,
      updated_by: body.updated_by ? String(body.updated_by) : null
    };
    this.leads.push(lead);
    return lead;
  }

  update(id: string, body: Record<string, unknown>) {
    const lead = this.leads.find((entry) => entry.id === id);
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
    Object.assign(lead, body, { updated_at: new Date().toISOString() });
    return lead;
  }
}

