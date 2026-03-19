import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "RECEIVED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

type UserScope = {
  id: string;
  organizationId: string;
  branchId?: string | null;
};

type PurchaseOrderLineItemInput = {
  item_id: string | null;
  description: string | null;
  quantity: number;
  unit_cost: number;
  tax_rate: number;
  discount: number;
  line_total: number;
  received_quantity: number;
};

@Injectable()
export class PurchasingService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  private readonly validStatuses: PurchaseOrderStatus[] = [
    "DRAFT",
    "SUBMITTED",
    "APPROVED",
    "RECEIVED",
    "CANCELLED"
  ];
  private readonly validPaymentStatuses: PaymentStatus[] = ["UNPAID", "PARTIAL", "PAID"];

  private requireScope(scope?: UserScope): UserScope {
    if (!scope?.id || !scope.organizationId) {
      throw new NotFoundException("Missing user scope");
    }
    return scope;
  }

  findAll(includeDeleted: boolean, scope?: UserScope) {
    const user = this.requireScope(scope);
    return this.prisma.purchaseOrder.findMany({
      where: {
        organization_id: user.organizationId,
        created_by: user.id,
        ...(includeDeleted ? {} : { deleted_at: null })
      },
      include: {
        line_items: true
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

  private parseRequiredString(value: unknown, fieldName: string): string {
    const text = String(value ?? "").trim();
    if (!text) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return text;
  }

  private parseOptionalString(value: unknown): string | null {
    const text = String(value ?? "").trim();
    return text ? text : null;
  }

  private parseNumber(value: unknown, fieldName: string, fallback: number): number {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`${fieldName} must be a valid number`);
    }
    return parsed;
  }

  private parseInteger(value: unknown, fieldName: string, fallback: number): number {
    const parsed = this.parseNumber(value, fieldName, fallback);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${fieldName} must be a whole number`);
    }
    return parsed;
  }

  private parseDate(value: unknown, fieldName: string): Date | null {
    const text = String(value ?? "").trim();
    if (!text) {
      return null;
    }
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date`);
    }
    return parsed;
  }

  private parseStatus(value: unknown, fallback: PurchaseOrderStatus): PurchaseOrderStatus {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return fallback;
    }
    if (!this.validStatuses.includes(text as PurchaseOrderStatus)) {
      throw new BadRequestException(`status must be one of: ${this.validStatuses.join(", ")}`);
    }
    return text as PurchaseOrderStatus;
  }

  private parsePaymentStatus(value: unknown, fallback: PaymentStatus): PaymentStatus {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return fallback;
    }
    if (!this.validPaymentStatuses.includes(text as PaymentStatus)) {
      throw new BadRequestException(`payment_status must be one of: ${this.validPaymentStatuses.join(", ")}`);
    }
    return text as PaymentStatus;
  }

  private parseLineItems(value: unknown): PurchaseOrderLineItemInput[] {
    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException("line_items must contain at least one item");
    }

    return value.map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        throw new BadRequestException(`line_items[${index}] must be an object`);
      }
      const item = raw as Record<string, unknown>;
      const quantity = this.parseInteger(item.quantity, `line_items[${index}].quantity`, 1);
      if (quantity < 1) {
        throw new BadRequestException(`line_items[${index}].quantity must be at least 1`);
      }
      const unitCost = this.parseNumber(item.unit_cost, `line_items[${index}].unit_cost`, 0);
      const taxRate = this.parseNumber(item.tax_rate, `line_items[${index}].tax_rate`, 0);
      const discount = this.parseNumber(item.discount, `line_items[${index}].discount`, 0);
      const receivedQuantity = this.parseInteger(item.received_quantity, `line_items[${index}].received_quantity`, 0);
      if (receivedQuantity < 0 || receivedQuantity > quantity) {
        throw new BadRequestException(`line_items[${index}].received_quantity must be between 0 and quantity`);
      }
      const description = this.parseOptionalString(item.description);
      const lineSubtotal = quantity * unitCost;
      const lineTax = lineSubtotal * (taxRate / 100);
      const lineTotal = Number((lineSubtotal + lineTax - discount).toFixed(2));
      return {
        item_id: this.parseOptionalUuid(item.item_id, `line_items[${index}].item_id`),
        description,
        quantity,
        unit_cost: unitCost,
        tax_rate: taxRate,
        discount,
        line_total: lineTotal,
        received_quantity: receivedQuantity
      };
    });
  }

  private computeTotals(lineItems: PurchaseOrderLineItemInput[]) {
    const subtotal = Number(
      lineItems.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0).toFixed(2)
    );
    const totalTax = Number(
      lineItems.reduce((sum, item) => sum + item.quantity * item.unit_cost * (item.tax_rate / 100), 0).toFixed(2)
    );
    const totalDiscount = Number(lineItems.reduce((sum, item) => sum + item.discount, 0).toFixed(2));
    const grandTotal = Number((subtotal + totalTax - totalDiscount).toFixed(2));
    return {
      subtotal,
      total_tax: totalTax,
      total_discount: totalDiscount,
      grand_total: grandTotal
    };
  }

  private generatePoNumber() {
    const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `PO-${stamp}-${suffix}`;
  }

  private buildPurchaseOrderData(
    body: Record<string, unknown>,
    user: UserScope,
    existing?: {
      po_number?: string | null;
      status?: string | null;
      payment_status?: string | null;
      order_date?: Date | null;
    }
  ) {
    const lineItems = this.parseLineItems(body.line_items);
    const totals = this.computeTotals(lineItems);
    const status = this.parseStatus(body.status, (existing?.status as PurchaseOrderStatus) ?? "DRAFT");
    const paymentStatus = this.parsePaymentStatus(
      body.payment_status,
      (existing?.payment_status as PaymentStatus) ?? "UNPAID"
    );
    const approvedAt = body.approved_at === undefined ? undefined : this.parseDate(body.approved_at, "approved_at");
    const orderDate =
      body.order_date === undefined
        ? existing?.order_date ?? new Date()
        : this.parseDate(body.order_date, "order_date") ?? new Date();

    return {
      data: {
        organization_id: user.organizationId,
        branch_id: user.branchId ?? null,
        po_number:
          body.po_number === undefined
            ? existing?.po_number ?? this.generatePoNumber()
            : this.parseRequiredString(body.po_number, "po_number"),
        supplier_id: this.parseOptionalUuid(body.supplier_id, "supplier_id"),
        status,
        order_date: orderDate,
        expected_delivery_date: this.parseDate(body.expected_delivery_date, "expected_delivery_date"),
        payment_terms: this.parseOptionalString(body.payment_terms),
        payment_status: paymentStatus,
        notes: this.parseOptionalString(body.notes),
        shipping_address: this.parseOptionalString(body.shipping_address),
        shipping_method: this.parseOptionalString(body.shipping_method),
        tracking_number: this.parseOptionalString(body.tracking_number),
        approved_by: this.parseOptionalUuid(body.approved_by, "approved_by"),
        approved_at: approvedAt,
        ...totals
      },
      lineItems
    };
  }

  create(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const payload = this.buildPurchaseOrderData(body, user);
    return this.prisma.purchaseOrder.create({
      data: {
        ...payload.data,
        created_by: user.id,
        updated_by: user.id,
        line_items: {
          create: payload.lineItems
        }
      },
      include: {
        line_items: true
      }
    });
  }

  async update(id: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.purchaseOrder.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      },
      include: {
        line_items: true
      }
    });
    if (!existing) {
      throw new NotFoundException("Purchase order not found");
    }

    const payload = this.buildPurchaseOrderData(
      {
        ...existing,
        ...body,
        line_items: body.line_items ?? existing.line_items
      },
      user,
      existing
    );

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...payload.data,
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: user.id,
        line_items: {
          deleteMany: {},
          create: payload.lineItems
        }
      },
      include: {
        line_items: true
      }
    });
  }

  async restore(id: string, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.purchaseOrder.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      }
    });
    if (!existing) {
      throw new NotFoundException("Purchase order not found");
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        deleted_at: null,
        updated_by: user.id
      },
      include: {
        line_items: true
      }
    });
  }
}
