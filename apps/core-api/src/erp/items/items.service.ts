import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";

interface ItemRecord {
  id: string;
  organization_id: string;
  branch_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

@Injectable()
export class ItemsService {
  private readonly items: ItemRecord[] = [];

  findAll(includeDeleted: boolean) {
    return this.items.filter((item) => includeDeleted || item.deleted_at === null);
  }

  create(body: Record<string, unknown>) {
    const now = new Date().toISOString();
    const item: ItemRecord = {
      id: randomUUID(),
      organization_id: String(body.organization_id ?? "seed-org-id"),
      branch_id: body.branch_id ? String(body.branch_id) : null,
      name: String(body.name ?? "Unnamed item"),
      created_at: now,
      updated_at: now,
      deleted_at: null,
      created_by: body.created_by ? String(body.created_by) : null,
      updated_by: body.updated_by ? String(body.updated_by) : null
    };
    this.items.push(item);
    return item;
  }

  update(id: string, body: Record<string, unknown>) {
    const item = this.items.find((entry) => entry.id === id);
    if (!item) {
      throw new NotFoundException("Item not found");
    }
    Object.assign(item, body, { updated_at: new Date().toISOString() });
    return item;
  }
}

