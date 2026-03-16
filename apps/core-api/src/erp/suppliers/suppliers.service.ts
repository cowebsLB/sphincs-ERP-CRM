import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";

interface SupplierRecord {
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
export class SuppliersService {
  private readonly suppliers: SupplierRecord[] = [];

  findAll(includeDeleted: boolean) {
    return this.suppliers.filter((entry) => includeDeleted || entry.deleted_at === null);
  }

  create(body: Record<string, unknown>) {
    const now = new Date().toISOString();
    const supplier: SupplierRecord = {
      id: randomUUID(),
      organization_id: String(body.organization_id ?? "seed-org-id"),
      branch_id: body.branch_id ? String(body.branch_id) : null,
      name: String(body.name ?? "Unnamed supplier"),
      created_at: now,
      updated_at: now,
      deleted_at: null,
      created_by: body.created_by ? String(body.created_by) : null,
      updated_by: body.updated_by ? String(body.updated_by) : null
    };
    this.suppliers.push(supplier);
    return supplier;
  }

  update(id: string, body: Record<string, unknown>) {
    const supplier = this.suppliers.find((entry) => entry.id === id);
    if (!supplier) {
      throw new NotFoundException("Supplier not found");
    }
    Object.assign(supplier, body, { updated_at: new Date().toISOString() });
    return supplier;
  }
}

