import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  DispatchStatus,
  DistributionMovementType,
  GoodsReceiptStatus,
  StockAdjustmentStatus,
  StockAdjustmentType,
  StockTransferStatus
} from "@prisma/client";
import { PrismaService } from "../../prisma.service";

type UserScope = {
  id: string;
  organizationId: string;
  branchId?: string | null;
};

type DashboardMetric = {
  label: string;
  value: number;
};

type MovementListFilters = {
  movementType?: string;
  itemId?: string;
  status?: string;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
};

type ReceiptListFilters = {
  status?: string;
  supplierId?: string;
  branchId?: string;
  includeDeleted?: boolean;
};

type TransferListFilters = {
  status?: string;
  sourceBranchId?: string;
  destinationBranchId?: string;
  includeDeleted?: boolean;
};

type AdjustmentListFilters = {
  status?: string;
  adjustmentType?: string;
  branchId?: string;
  includeDeleted?: boolean;
};

@Injectable()
export class DistributionService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private requireScope(scope?: UserScope): UserScope {
    if (!scope?.id || !scope.organizationId) {
      throw new NotFoundException("Missing user scope");
    }
    return scope;
  }

  private withScopedBranchFilter<T extends Record<string, unknown>>(scope: UserScope, base: T): T {
    if (!scope.branchId) {
      return base;
    }
    return {
      ...base,
      branch_id: scope.branchId
    };
  }

  private scopedBranchIds(scope: UserScope, sourceBranchId: string | null, destinationBranchId: string | null): boolean {
    if (!scope.branchId) {
      return true;
    }
    return sourceBranchId === scope.branchId || destinationBranchId === scope.branchId;
  }

  private parseRequiredUuid(value: unknown, fieldName: string): string {
    const text = String(value ?? "").trim();
    if (!text) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    if (!this.uuidPattern.test(text)) {
      throw new BadRequestException(`${fieldName} must be a valid UUID`);
    }
    return text;
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

  private parseOptionalString(value: unknown): string | null {
    const text = String(value ?? "").trim();
    return text ? text : null;
  }

  private parseRequiredString(value: unknown, fieldName: string): string {
    const text = String(value ?? "").trim();
    if (!text) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return text;
  }

  private parseRequiredMovementType(value: unknown): DistributionMovementType {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      throw new BadRequestException("movement_type is required");
    }
    if (!Object.values(DistributionMovementType).includes(text as DistributionMovementType)) {
      throw new BadRequestException(`movement_type must be one of: ${Object.values(DistributionMovementType).join(", ")}`);
    }
    return text as DistributionMovementType;
  }

  private parseOptionalMovementType(value: unknown): DistributionMovementType | undefined {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!Object.values(DistributionMovementType).includes(text as DistributionMovementType)) {
      throw new BadRequestException(`movementType must be one of: ${Object.values(DistributionMovementType).join(", ")}`);
    }
    return text as DistributionMovementType;
  }

  private parseOptionalGoodsReceiptStatus(value: unknown): GoodsReceiptStatus | undefined {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!Object.values(GoodsReceiptStatus).includes(text as GoodsReceiptStatus)) {
      throw new BadRequestException(`status must be one of: ${Object.values(GoodsReceiptStatus).join(", ")}`);
    }
    return text as GoodsReceiptStatus;
  }

  private parseOptionalStockTransferStatus(value: unknown): StockTransferStatus | undefined {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!Object.values(StockTransferStatus).includes(text as StockTransferStatus)) {
      throw new BadRequestException(`status must be one of: ${Object.values(StockTransferStatus).join(", ")}`);
    }
    return text as StockTransferStatus;
  }

  private parseOptionalStockAdjustmentStatus(value: unknown): StockAdjustmentStatus | undefined {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!Object.values(StockAdjustmentStatus).includes(text as StockAdjustmentStatus)) {
      throw new BadRequestException(`status must be one of: ${Object.values(StockAdjustmentStatus).join(", ")}`);
    }
    return text as StockAdjustmentStatus;
  }

  private parseOptionalStockAdjustmentType(value: unknown): StockAdjustmentType | undefined {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!Object.values(StockAdjustmentType).includes(text as StockAdjustmentType)) {
      throw new BadRequestException(
        `adjustment_type must be one of: ${Object.values(StockAdjustmentType).join(", ")}`
      );
    }
    return text as StockAdjustmentType;
  }

  private parseInteger(value: unknown, fieldName: string, fallback: number): number {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      throw new BadRequestException(`${fieldName} must be a whole number`);
    }
    return parsed;
  }

  private parseNumber(value: unknown, fieldName: string): number | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`${fieldName} must be a valid number`);
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

  private async validateBranchScope(branchId: string | null, fieldName: string, user: UserScope) {
    if (!branchId) {
      return null;
    }
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        organization_id: user.organizationId,
        deleted_at: null
      }
    });
    if (!branch) {
      throw new BadRequestException(`${fieldName} must reference a branch in your organization`);
    }
    if (user.branchId && user.branchId !== branchId) {
      throw new BadRequestException(`${fieldName} must reference your branch scope`);
    }
    return branch;
  }

  private async validateBranchInOrganization(branchId: string | null, fieldName: string, user: UserScope) {
    if (!branchId) {
      return null;
    }
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        organization_id: user.organizationId,
        deleted_at: null
      }
    });
    if (!branch) {
      throw new BadRequestException(`${fieldName} must reference a branch in your organization`);
    }
    return branch;
  }

  private async validateItemScope(itemId: string, user: UserScope) {
    const item = await this.prisma.item.findFirst({
      where: {
        id: itemId,
        organization_id: user.organizationId,
        deleted_at: null,
        ...(user.branchId
          ? {
              OR: [{ branch_id: user.branchId }, { branch_id: null }]
            }
          : {})
      }
    });
    if (!item) {
      throw new BadRequestException("item_id must reference an item in your organization scope");
    }
    return item;
  }

  private async validateSupplierScope(supplierId: string | null, user: UserScope) {
    if (!supplierId) {
      return null;
    }
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: supplierId,
        organization_id: user.organizationId,
        deleted_at: null
      }
    });
    if (!supplier) {
      throw new BadRequestException("supplier_id must reference a supplier in your organization");
    }
    if (user.branchId && supplier.branch_id && supplier.branch_id !== user.branchId) {
      throw new BadRequestException("supplier_id must reference your branch scope");
    }
    return supplier;
  }

  private async validatePurchaseOrderScope(purchaseOrderId: string | null, user: UserScope) {
    if (!purchaseOrderId) {
      return null;
    }
    const po = await this.prisma.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,
        organization_id: user.organizationId,
        deleted_at: null
      }
    });
    if (!po) {
      throw new BadRequestException("purchase_order_id must reference a purchase order in your organization");
    }
    if (user.branchId && po.branch_id && po.branch_id !== user.branchId) {
      throw new BadRequestException("purchase_order_id must reference your branch scope");
    }
    return po;
  }

  private parseReceiptLineItems(value: unknown) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException("line_items must contain at least one item");
    }

    return value.map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        throw new BadRequestException(`line_items[${index}] must be an object`);
      }
      const row = raw as Record<string, unknown>;
      const itemId = this.parseRequiredUuid(row.item_id ?? row.itemId, `line_items[${index}].item_id`);
      const orderedQty = this.parseInteger(row.ordered_qty ?? row.orderedQty, `line_items[${index}].ordered_qty`, 0);
      const receivedQty = this.parseInteger(
        row.received_qty ?? row.receivedQty,
        `line_items[${index}].received_qty`,
        0
      );
      const rejectedQty = this.parseInteger(
        row.rejected_qty ?? row.rejectedQty,
        `line_items[${index}].rejected_qty`,
        0
      );
      if (orderedQty < 0 || receivedQty < 0 || rejectedQty < 0) {
        throw new BadRequestException(`line_items[${index}] quantities cannot be negative`);
      }
      if (receivedQty + rejectedQty > orderedQty) {
        throw new BadRequestException(
          `line_items[${index}] received_qty + rejected_qty cannot exceed ordered_qty`
        );
      }
      const remainingQty = this.parseInteger(
        row.remaining_qty ?? row.remainingQty,
        `line_items[${index}].remaining_qty`,
        Math.max(orderedQty - receivedQty - rejectedQty, 0)
      );
      if (remainingQty < 0) {
        throw new BadRequestException(`line_items[${index}].remaining_qty cannot be negative`);
      }
      return {
        item_id: itemId,
        ordered_qty: orderedQty,
        received_qty: receivedQty,
        remaining_qty: remainingQty,
        rejected_qty: rejectedQty,
        notes: this.parseOptionalString(row.notes)
      };
    });
  }

  private deriveGoodsReceiptStatus(
    requestedStatus: GoodsReceiptStatus | undefined,
    lineItems: Array<{ ordered_qty: number; received_qty: number; remaining_qty: number }>
  ): GoodsReceiptStatus {
    if (requestedStatus) {
      return requestedStatus;
    }
    const totalOrdered = lineItems.reduce((sum, row) => sum + row.ordered_qty, 0);
    const totalReceived = lineItems.reduce((sum, row) => sum + row.received_qty, 0);
    const totalRemaining = lineItems.reduce((sum, row) => sum + row.remaining_qty, 0);

    if (totalReceived <= 0) {
      return GoodsReceiptStatus.DRAFT;
    }
    if (totalRemaining <= 0 || totalReceived >= totalOrdered) {
      return GoodsReceiptStatus.RECEIVED;
    }
    return GoodsReceiptStatus.PARTIAL;
  }

  private parseTransferLineItems(value: unknown) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException("line_items must contain at least one item");
    }

    return value.map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        throw new BadRequestException(`line_items[${index}] must be an object`);
      }
      const row = raw as Record<string, unknown>;
      const itemId = this.parseRequiredUuid(row.item_id ?? row.itemId, `line_items[${index}].item_id`);
      const quantityRequested = this.parseInteger(
        row.quantity_requested ?? row.quantityRequested,
        `line_items[${index}].quantity_requested`,
        0
      );
      const quantitySent = this.parseInteger(
        row.quantity_sent ?? row.quantitySent,
        `line_items[${index}].quantity_sent`,
        0
      );
      const quantityReceived = this.parseInteger(
        row.quantity_received ?? row.quantityReceived,
        `line_items[${index}].quantity_received`,
        0
      );

      if (quantityRequested < 1) {
        throw new BadRequestException(`line_items[${index}].quantity_requested must be at least 1`);
      }
      if (quantitySent < 0 || quantityReceived < 0) {
        throw new BadRequestException(`line_items[${index}] quantities cannot be negative`);
      }
      if (quantitySent > quantityRequested) {
        throw new BadRequestException(`line_items[${index}].quantity_sent cannot exceed quantity_requested`);
      }
      if (quantityReceived > quantitySent) {
        throw new BadRequestException(`line_items[${index}].quantity_received cannot exceed quantity_sent`);
      }

      return {
        item_id: itemId,
        quantity_requested: quantityRequested,
        quantity_sent: quantitySent,
        quantity_received: quantityReceived
      };
    });
  }

  private parseAdjustmentLineItems(value: unknown, adjustmentType: StockAdjustmentType) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException("line_items must contain at least one item");
    }

    return value.map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        throw new BadRequestException(`line_items[${index}] must be an object`);
      }
      const row = raw as Record<string, unknown>;
      const itemId = this.parseRequiredUuid(row.item_id ?? row.itemId, `line_items[${index}].item_id`);
      const previousQty = this.parseInteger(row.previous_qty ?? row.previousQty, `line_items[${index}].previous_qty`, 0);
      const adjustedQty = this.parseInteger(row.adjusted_qty ?? row.adjustedQty, `line_items[${index}].adjusted_qty`, 0);
      const providedVariance = this.parseInteger(row.variance, `line_items[${index}].variance`, adjustedQty - previousQty);
      const expectedVariance = adjustedQty - previousQty;

      if (providedVariance !== expectedVariance) {
        throw new BadRequestException(`line_items[${index}].variance must equal adjusted_qty - previous_qty`);
      }
      if (adjustmentType === StockAdjustmentType.INCREASE && providedVariance < 0) {
        throw new BadRequestException(`line_items[${index}] must increase stock for INCREASE adjustment type`);
      }
      if (adjustmentType === StockAdjustmentType.DECREASE && providedVariance > 0) {
        throw new BadRequestException(`line_items[${index}] must decrease stock for DECREASE adjustment type`);
      }

      return {
        item_id: itemId,
        previous_qty: previousQty,
        adjusted_qty: adjustedQty,
        variance: providedVariance
      };
    });
  }

  async createMovement(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);

    const movementType = this.parseRequiredMovementType(body.movement_type ?? body.movementType);
    const itemId = this.parseRequiredUuid(body.item_id ?? body.itemId, "item_id");
    const quantity = this.parseInteger(body.quantity, "quantity", 0);
    const unit = this.parseOptionalString(body.unit) ?? "piece";
    const branchId = this.parseOptionalUuid(body.branch_id ?? body.branchId, "branch_id") ?? user.branchId ?? null;
    const sourceBranchId = this.parseOptionalUuid(body.source_branch_id ?? body.sourceBranchId, "source_branch_id");
    const destinationBranchId = this.parseOptionalUuid(
      body.destination_branch_id ?? body.destinationBranchId,
      "destination_branch_id"
    );

    if (quantity < 1) {
      throw new BadRequestException("quantity must be at least 1");
    }
    if (sourceBranchId && destinationBranchId && sourceBranchId === destinationBranchId) {
      throw new BadRequestException("source_branch_id and destination_branch_id cannot be identical");
    }

    await this.validateItemScope(itemId, user);
    await this.validateBranchScope(branchId, "branch_id", user);
    await this.validateBranchScope(sourceBranchId, "source_branch_id", user);
    await this.validateBranchScope(destinationBranchId, "destination_branch_id", user);

    if (
      user.branchId &&
      ![branchId, sourceBranchId, destinationBranchId].filter(Boolean).includes(user.branchId)
    ) {
      throw new BadRequestException("Movement must include your branch scope");
    }

    const occurredAt = this.parseDate(body.occurred_at ?? body.occurredAt, "occurred_at") ?? new Date();
    const created = await this.prisma.inventoryMovement.create({
      data: {
        organization_id: user.organizationId,
        branch_id: branchId,
        item_id: itemId,
        movement_type: movementType,
        quantity,
        unit,
        source_branch_id: sourceBranchId,
        destination_branch_id: destinationBranchId,
        reference_type: this.parseOptionalString(body.reference_type ?? body.referenceType),
        reference_id: this.parseOptionalUuid(body.reference_id ?? body.referenceId, "reference_id"),
        status: String(body.status ?? "POSTED").trim().toUpperCase() || "POSTED",
        notes: this.parseOptionalString(body.notes),
        cost_impact: this.parseNumber(body.cost_impact ?? body.costImpact, "cost_impact"),
        performed_by: user.id,
        occurred_at: occurredAt
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        source_branch: {
          select: {
            id: true,
            name: true
          }
        },
        destination_branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return created;
  }

  async listMovements(filters: MovementListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const movementType = this.parseOptionalMovementType(filters.movementType);
    const itemId = filters.itemId ? this.parseRequiredUuid(filters.itemId, "itemId") : undefined;
    const fromDate = this.parseDate(filters.from, "from");
    const toDate = this.parseDate(filters.to, "to");

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException("from must be before to");
    }

    const where: Record<string, unknown> = {
      organization_id: user.organizationId,
      ...(filters.includeDeleted ? {} : { deleted_at: null })
    };

    if (movementType) {
      where.movement_type = movementType;
    }
    if (itemId) {
      where.item_id = itemId;
    }
    if (filters.status) {
      where.status = filters.status.trim().toUpperCase();
    }
    if (fromDate || toDate) {
      where.occurred_at = {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {})
      };
    }

    if (user.branchId) {
      where.OR = [
        { branch_id: user.branchId },
        { source_branch_id: user.branchId },
        { destination_branch_id: user.branchId }
      ];
    }

    return this.prisma.inventoryMovement.findMany({
      where,
      orderBy: { occurred_at: "desc" },
      take: 100,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        source_branch: {
          select: {
            id: true,
            name: true
          }
        },
        destination_branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async listReceipts(filters: ReceiptListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const status = this.parseOptionalGoodsReceiptStatus(filters.status);
    const supplierId = filters.supplierId ? this.parseRequiredUuid(filters.supplierId, "supplierId") : undefined;
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (supplierId) {
      await this.validateSupplierScope(supplierId, user);
    }

    return this.prisma.goodsReceipt.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(status ? { status } : {}),
        ...(supplierId ? { supplier_id: supplierId } : {}),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            supplier_code: true
          }
        },
        purchase_order: {
          select: {
            id: true,
            po_number: true,
            status: true
          }
        },
        line_items: true
      },
      orderBy: { created_at: "desc" },
      take: 100
    });
  }

  async createReceipt(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = this.parseOptionalUuid(body.branch_id ?? body.branchId, "branch_id") ?? user.branchId ?? null;
    if (!branchId) {
      throw new BadRequestException("branch_id is required");
    }
    await this.validateBranchScope(branchId, "branch_id", user);

    const supplierId = this.parseOptionalUuid(body.supplier_id ?? body.supplierId, "supplier_id");
    const purchaseOrderId = this.parseOptionalUuid(
      body.purchase_order_id ?? body.purchaseOrderId,
      "purchase_order_id"
    );

    await this.validateSupplierScope(supplierId, user);
    await this.validatePurchaseOrderScope(purchaseOrderId, user);

    const lineItems = this.parseReceiptLineItems(body.line_items ?? body.lineItems);
    for (const lineItem of lineItems) {
      await this.validateItemScope(lineItem.item_id, user);
    }

    const requestedStatus = this.parseOptionalGoodsReceiptStatus(body.status);
    const status = this.deriveGoodsReceiptStatus(requestedStatus, lineItems);
    const receiptNumber =
      this.parseOptionalString(body.receipt_number ?? body.receiptNumber) ??
      `GR-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;

    return this.prisma.goodsReceipt.create({
      data: {
        organization_id: user.organizationId,
        branch_id: branchId,
        supplier_id: supplierId,
        purchase_order_id: purchaseOrderId,
        receipt_number: receiptNumber,
        status,
        received_date: this.parseDate(body.received_date ?? body.receivedDate, "received_date"),
        received_by: user.id,
        notes: this.parseOptionalString(body.notes),
        attachments: (body.attachments as object | null | undefined) ?? undefined,
        line_items: {
          create: lineItems
        }
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            supplier_code: true
          }
        },
        purchase_order: {
          select: {
            id: true,
            po_number: true
          }
        },
        line_items: true
      }
    });
  }

  async listTransfers(filters: TransferListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const status = this.parseOptionalStockTransferStatus(filters.status);
    const sourceBranchId = filters.sourceBranchId
      ? this.parseRequiredUuid(filters.sourceBranchId, "sourceBranchId")
      : undefined;
    const destinationBranchId = filters.destinationBranchId
      ? this.parseRequiredUuid(filters.destinationBranchId, "destinationBranchId")
      : undefined;

    if (sourceBranchId) {
      await this.validateBranchInOrganization(sourceBranchId, "sourceBranchId", user);
    }
    if (destinationBranchId) {
      await this.validateBranchInOrganization(destinationBranchId, "destinationBranchId", user);
    }

    return this.prisma.stockTransfer.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(status ? { status } : {}),
        ...(sourceBranchId ? { source_branch_id: sourceBranchId } : {}),
        ...(destinationBranchId ? { destination_branch_id: destinationBranchId } : {}),
        ...(user.branchId
          ? {
              OR: [{ source_branch_id: user.branchId }, { destination_branch_id: user.branchId }]
            }
          : {})
      },
      include: {
        source_branch: {
          select: {
            id: true,
            name: true
          }
        },
        destination_branch: {
          select: {
            id: true,
            name: true
          }
        },
        line_items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: { created_at: "desc" },
      take: 100
    });
  }

  async createTransfer(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const sourceBranchId =
      this.parseOptionalUuid(body.source_branch_id ?? body.sourceBranchId, "source_branch_id") ??
      user.branchId ??
      null;
    const destinationBranchId = this.parseOptionalUuid(
      body.destination_branch_id ?? body.destinationBranchId,
      "destination_branch_id"
    );

    if (!sourceBranchId) {
      throw new BadRequestException("source_branch_id is required");
    }
    if (!destinationBranchId) {
      throw new BadRequestException("destination_branch_id is required");
    }
    if (sourceBranchId === destinationBranchId) {
      throw new BadRequestException("source_branch_id and destination_branch_id cannot be identical");
    }

    await this.validateBranchInOrganization(sourceBranchId, "source_branch_id", user);
    await this.validateBranchInOrganization(destinationBranchId, "destination_branch_id", user);

    if (user.branchId && sourceBranchId !== user.branchId && destinationBranchId !== user.branchId) {
      throw new BadRequestException("Transfer must include your branch scope");
    }

    const lineItems = this.parseTransferLineItems(body.line_items ?? body.lineItems);
    for (const lineItem of lineItems) {
      await this.validateItemScope(lineItem.item_id, user);
    }

    const transferNumber =
      this.parseOptionalString(body.transfer_number ?? body.transferNumber) ??
      `TR-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
    const status = this.parseOptionalStockTransferStatus(body.status) ?? StockTransferStatus.DRAFT;
    const approvedBy =
      status === StockTransferStatus.APPROVED || status === StockTransferStatus.DISPATCHED
        ? user.id
        : this.parseOptionalUuid(body.approved_by ?? body.approvedBy, "approved_by");

    return this.prisma.stockTransfer.create({
      data: {
        organization_id: user.organizationId,
        transfer_number: transferNumber,
        source_branch_id: sourceBranchId,
        destination_branch_id: destinationBranchId,
        status,
        requested_by: user.id,
        approved_by: approvedBy,
        created_date: this.parseDate(body.created_date ?? body.createdDate, "created_date") ?? new Date(),
        dispatched_date: this.parseDate(body.dispatched_date ?? body.dispatchedDate, "dispatched_date"),
        received_date: this.parseDate(body.received_date ?? body.receivedDate, "received_date"),
        status_history: (body.status_history as object | null | undefined) ?? undefined,
        notes: this.parseOptionalString(body.notes),
        line_items: {
          create: lineItems
        }
      },
      include: {
        source_branch: {
          select: {
            id: true,
            name: true
          }
        },
        destination_branch: {
          select: {
            id: true,
            name: true
          }
        },
        line_items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      }
    });
  }

  async listAdjustments(filters: AdjustmentListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const status = this.parseOptionalStockAdjustmentStatus(filters.status);
    const adjustmentType = this.parseOptionalStockAdjustmentType(filters.adjustmentType);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }

    return this.prisma.stockAdjustment.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(status ? { status } : {}),
        ...(adjustmentType ? { adjustment_type: adjustmentType } : {}),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        line_items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: { created_at: "desc" },
      take: 100
    });
  }

  async createAdjustment(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = this.parseOptionalUuid(body.branch_id ?? body.branchId, "branch_id") ?? user.branchId ?? null;
    if (!branchId) {
      throw new BadRequestException("branch_id is required");
    }
    await this.validateBranchScope(branchId, "branch_id", user);

    const adjustmentType = this.parseOptionalStockAdjustmentType(body.adjustment_type ?? body.adjustmentType);
    if (!adjustmentType) {
      throw new BadRequestException("adjustment_type is required");
    }
    const lineItems = this.parseAdjustmentLineItems(body.line_items ?? body.lineItems, adjustmentType);
    for (const lineItem of lineItems) {
      await this.validateItemScope(lineItem.item_id, user);
    }

    const adjustmentNumber =
      this.parseOptionalString(body.adjustment_number ?? body.adjustmentNumber) ??
      `ADJ-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
    const status = this.parseOptionalStockAdjustmentStatus(body.status) ?? StockAdjustmentStatus.DRAFT;

    return this.prisma.stockAdjustment.create({
      data: {
        organization_id: user.organizationId,
        branch_id: branchId,
        adjustment_number: adjustmentNumber,
        status,
        adjustment_type: adjustmentType,
        reason: this.parseRequiredString(body.reason, "reason"),
        approved_by: this.parseOptionalUuid(body.approved_by ?? body.approvedBy, "approved_by"),
        created_by_user: user.id,
        applied_at: this.parseDate(body.applied_at ?? body.appliedAt, "applied_at"),
        notes: this.parseOptionalString(body.notes),
        supporting_file: this.parseOptionalString(body.supporting_file ?? body.supportingFile),
        line_items: {
          create: lineItems
        }
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        line_items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      }
    });
  }

  async dashboard(scope?: UserScope) {
    const user = this.requireScope(scope);

    const stocks = await this.prisma.inventoryStock.findMany({
      where: this.withScopedBranchFilter(user, {
        organization_id: user.organizationId,
        deleted_at: null
      }),
      select: {
        branch_id: true,
        quantity_on_hand: true,
        in_transit_quantity: true,
        incoming_quantity: true,
        damaged_quantity: true,
        last_movement_at: true,
        item: {
          select: {
            name: true,
            sku: true,
            reorder_level: true,
            track_inventory: true,
            deleted_at: true
          }
        }
      }
    });

    const pendingReceipts = await this.prisma.goodsReceipt.count({
      where: this.withScopedBranchFilter(user, {
        organization_id: user.organizationId,
        deleted_at: null,
        status: { in: [GoodsReceiptStatus.DRAFT, GoodsReceiptStatus.PARTIAL, GoodsReceiptStatus.RECEIVED] }
      })
    });

    const pendingTransfers = await this.prisma.stockTransfer.count({
      where: {
        organization_id: user.organizationId,
        deleted_at: null,
        status: {
          in: [
            StockTransferStatus.REQUESTED,
            StockTransferStatus.APPROVED,
            StockTransferStatus.DISPATCHED,
            StockTransferStatus.PARTIAL
          ]
        },
        ...(user.branchId
          ? {
              OR: [{ source_branch_id: user.branchId }, { destination_branch_id: user.branchId }]
            }
          : {})
      }
    });

    const pendingDispatches = await this.prisma.stockDispatch.count({
      where: this.withScopedBranchFilter(user, {
        organization_id: user.organizationId,
        deleted_at: null,
        status: { in: [DispatchStatus.READY, DispatchStatus.PACKED, DispatchStatus.DISPATCHED] }
      })
    });

    const openAlerts = await this.prisma.stockAlert.findMany({
      where: this.withScopedBranchFilter(user, {
        organization_id: user.organizationId,
        deleted_at: null,
        status: "OPEN"
      }),
      orderBy: [{ severity: "desc" }, { detected_at: "desc" }],
      take: 8,
      select: {
        id: true,
        alert_type: true,
        severity: true,
        title: true,
        message: true,
        detected_at: true,
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true } }
      }
    });

    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        organization_id: user.organizationId,
        deleted_at: null,
        ...(user.branchId
          ? {
              OR: [
                { branch_id: user.branchId },
                { source_branch_id: user.branchId },
                { destination_branch_id: user.branchId }
              ]
            }
          : {})
      },
      orderBy: { occurred_at: "desc" },
      take: 10,
      select: {
        id: true,
        movement_type: true,
        quantity: true,
        unit: true,
        status: true,
        notes: true,
        occurred_at: true,
        item: { select: { id: true, name: true, sku: true } },
        source_branch_id: true,
        destination_branch_id: true,
        source_branch: { select: { id: true, name: true } },
        destination_branch: { select: { id: true, name: true } }
      }
    });

    const branchFilter = user.branchId
      ? {
          id: user.branchId
        }
      : {};
    const branches = await this.prisma.branch.findMany({
      where: {
        organization_id: user.organizationId,
        deleted_at: null,
        ...branchFilter
      },
      select: {
        id: true,
        name: true
      }
    });

    const damagedReturnRows = await this.prisma.stockReturnLine.findMany({
      where: {
        damaged: true,
        stock_return: {
          organization_id: user.organizationId,
          deleted_at: null
        }
      },
      select: {
        quantity: true,
        stock_return: {
          select: {
            source_branch_id: true,
            destination_branch_id: true
          }
        }
      }
    });

    const totalStockOnHand = stocks.reduce((sum, row) => sum + row.quantity_on_hand, 0);
    const incomingStock = stocks.reduce((sum, row) => sum + row.incoming_quantity, 0);
    const damagedStock = stocks.reduce((sum, row) => sum + row.damaged_quantity, 0);
    const lowStockItems = stocks.filter((row) => {
      if (!row.item || row.item.deleted_at || !row.item.track_inventory) {
        return false;
      }
      const reorderLevel = row.item.reorder_level ?? 0;
      return row.quantity_on_hand > 0 && reorderLevel > 0 && row.quantity_on_hand <= reorderLevel;
    }).length;
    const outOfStockItems = stocks.filter((row) => {
      if (!row.item || row.item.deleted_at || !row.item.track_inventory) {
        return false;
      }
      return row.quantity_on_hand <= 0;
    }).length;

    const damagedReturnedStock = damagedReturnRows
      .filter((row) =>
        this.scopedBranchIds(user, row.stock_return.source_branch_id, row.stock_return.destination_branch_id)
      )
      .reduce((sum, row) => sum + row.quantity, 0);

    const branchStockSummary = branches.map((branch) => {
      const branchStocks = stocks.filter((row) => row.branch_id === branch.id);
      const branchOnHand = branchStocks.reduce((sum, row) => sum + row.quantity_on_hand, 0);
      const branchLowStock = branchStocks.filter((row) => {
        if (!row.item || row.item.deleted_at || !row.item.track_inventory) {
          return false;
        }
        const reorderLevel = row.item.reorder_level ?? 0;
        return row.quantity_on_hand > 0 && reorderLevel > 0 && row.quantity_on_hand <= reorderLevel;
      }).length;
      const branchInTransit = branchStocks.reduce((sum, row) => sum + row.in_transit_quantity, 0);
      const branchIncoming = branchStocks.reduce((sum, row) => sum + row.incoming_quantity, 0);
      return {
        branch_id: branch.id,
        branch_name: branch.name,
        stock_on_hand: branchOnHand,
        low_stock_items: branchLowStock,
        in_transit_quantity: branchInTransit,
        incoming_quantity: branchIncoming
      };
    });

    const metrics: DashboardMetric[] = [
      { label: "total_stock_on_hand", value: totalStockOnHand },
      { label: "low_stock_items", value: lowStockItems },
      { label: "out_of_stock_items", value: outOfStockItems },
      { label: "incoming_stock", value: incomingStock },
      { label: "pending_receipts", value: pendingReceipts },
      { label: "pending_transfers", value: pendingTransfers },
      { label: "pending_dispatches", value: pendingDispatches },
      { label: "damaged_returned_stock", value: damagedStock + damagedReturnedStock }
    ];

    return {
      metrics,
      branch_stock_summary: branchStockSummary,
      recent_inventory_activity: movements.map((movement) => ({
        id: movement.id,
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        unit: movement.unit,
        status: movement.status,
        occurred_at: movement.occurred_at,
        notes: movement.notes,
        item: movement.item,
        source_branch: movement.source_branch,
        destination_branch: movement.destination_branch
      })),
      alerts_and_exceptions: openAlerts,
      generated_at: new Date().toISOString()
    };
  }
}
