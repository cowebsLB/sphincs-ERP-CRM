import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

interface PurchaseOrderRecord {
  id: string;
  organization_id: string;
  branch_id: string | null;
  supplier_id: string | null;
  status: PurchaseOrderStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

@Injectable()
export class PurchasingService {
  private readonly purchaseOrders: PurchaseOrderRecord[] = [];

  findAll(includeDeleted: boolean) {
    return this.purchaseOrders.filter((entry) => includeDeleted || entry.deleted_at === null);
  }

  create(body: Record<string, unknown>) {
    const now = new Date().toISOString();
    const order: PurchaseOrderRecord = {
      id: randomUUID(),
      organization_id: String(body.organization_id ?? "seed-org-id"),
      branch_id: body.branch_id ? String(body.branch_id) : null,
      supplier_id: body.supplier_id ? String(body.supplier_id) : null,
      status: (body.status as PurchaseOrderStatus) ?? "DRAFT",
      created_at: now,
      updated_at: now,
      deleted_at: null,
      created_by: body.created_by ? String(body.created_by) : null,
      updated_by: body.updated_by ? String(body.updated_by) : null
    };
    this.purchaseOrders.push(order);
    return order;
  }

  update(id: string, body: Record<string, unknown>) {
    const order = this.purchaseOrders.find((entry) => entry.id === id);
    if (!order) {
      throw new NotFoundException("Purchase order not found");
    }
    Object.assign(order, body, { updated_at: new Date().toISOString() });
    return order;
  }
}

