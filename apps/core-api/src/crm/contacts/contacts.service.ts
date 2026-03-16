import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";

interface ContactRecord {
  id: string;
  organization_id: string;
  branch_id: string | null;
  full_name: string;
  email: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

@Injectable()
export class ContactsService {
  private readonly contacts: ContactRecord[] = [];

  findAll(includeDeleted: boolean) {
    return this.contacts.filter((entry) => includeDeleted || entry.deleted_at === null);
  }

  create(body: Record<string, unknown>) {
    const now = new Date().toISOString();
    const contact: ContactRecord = {
      id: randomUUID(),
      organization_id: String(body.organization_id ?? "seed-org-id"),
      branch_id: body.branch_id ? String(body.branch_id) : null,
      full_name: String(body.full_name ?? "Unnamed contact"),
      email: body.email ? String(body.email) : null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      created_by: body.created_by ? String(body.created_by) : null,
      updated_by: body.updated_by ? String(body.updated_by) : null
    };
    this.contacts.push(contact);
    return contact;
  }

  update(id: string, body: Record<string, unknown>) {
    const contact = this.contacts.find((entry) => entry.id === id);
    if (!contact) {
      throw new NotFoundException("Contact not found");
    }
    Object.assign(contact, body, { updated_at: new Date().toISOString() });
    return contact;
  }
}

