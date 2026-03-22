import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AlertSeverity,
  DispatchStatus,
  DistributionMovementType,
  GoodsReceiptStatus,
  InventoryReservationStatus,
  StockAdjustmentStatus,
  StockAdjustmentType,
  StockReturnStatus,
  StockReturnType,
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
  branchId?: string;
  status?: string;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
};

type InventoryStockListFilters = {
  branchId?: string;
  itemId?: string;
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

type DispatchListFilters = {
  status?: string;
  branchId?: string;
  includeDeleted?: boolean;
};

type ReturnListFilters = {
  status?: string;
  returnType?: string;
  sourceBranchId?: string;
  destinationBranchId?: string;
  includeDeleted?: boolean;
};

type ReservationListFilters = {
  status?: string;
  branchId?: string;
  itemId?: string;
  includeDeleted?: boolean;
};

type WarehouseLocationListFilters = {
  branchId?: string;
  parentLocationId?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
};

type LotListFilters = {
  branchId?: string;
  itemId?: string;
  supplierId?: string;
  status?: string;
  includeDeleted?: boolean;
};

type LotBalanceListFilters = {
  branchId?: string;
  itemId?: string;
  lotId?: string;
  locationId?: string;
  includeDeleted?: boolean;
};

type DispatchJobListFilters = {
  status?: string;
  includeDeleted?: boolean;
};

type ReorderRuleListFilters = {
  branchId?: string;
  itemId?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
};

type RestockingSuggestionFilters = {
  branchId?: string;
  includeInactive?: boolean;
  includeZero?: boolean;
  includeDeleted?: boolean;
};

type AlertListFilters = {
  status?: string;
  severity?: string;
  branchId?: string;
  includeDeleted?: boolean;
};

type StockOnHandReportFilters = {
  branchId?: string;
  itemId?: string;
  lowOnly?: boolean;
  outOnly?: boolean;
  includeDeleted?: boolean;
};

type BranchStockSummaryReportFilters = {
  branchId?: string;
  includeDeleted?: boolean;
};

type MovementReportFilters = {
  movementType?: string;
  branchId?: string;
  itemId?: string;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
};

type TransferReportFilters = {
  status?: string;
  sourceBranchId?: string;
  destinationBranchId?: string;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
};

type AdjustmentReportFilters = {
  status?: string;
  adjustmentType?: string;
  branchId?: string;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
};

type ReceiptReportFilters = {
  status?: string;
  supplierId?: string;
  branchId?: string;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
};

type StockLossReportFilters = {
  branchId?: string;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
};

type StockValuationReportFilters = {
  branchId?: string;
  itemId?: string;
  includeDeleted?: boolean;
};

type FastSlowMoverReportFilters = {
  branchId?: string;
  from?: string;
  to?: string;
  minMovements?: number;
  includeDeleted?: boolean;
};

type SupplierFulfillmentReportFilters = {
  supplierId?: string;
  branchId?: string;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
};

type OperationsExceptionsReportFilters = {
  branchId?: string;
  receiptOverdueDays?: number;
  transferOverdueDays?: number;
  dispatchOverdueDays?: number;
  includeDeleted?: boolean;
};

type BranchSlaReportFilters = {
  branchId?: string;
  slaDays?: number;
  includeDeleted?: boolean;
};

type InactiveStockReportFilters = {
  branchId?: string;
  includeDeleted?: boolean;
};

type ShortageReportFilters = {
  branchId?: string;
  supplierId?: string;
  includeDeleted?: boolean;
};

type TransferTransitionAction = "REQUEST" | "APPROVE" | "DISPATCH" | "RECEIVE" | "CANCEL";
type ReceiptTransitionAction = "RECEIVE" | "CLOSE" | "CANCEL";
type DispatchTransitionAction = "READY" | "PACK" | "DISPATCH" | "DELIVER" | "FAIL" | "RETURN" | "CANCEL";
type ReturnTransitionAction = "RECEIVE" | "INSPECT" | "COMPLETE" | "CANCEL";
type AdjustmentTransitionAction = "SUBMIT" | "APPROVE" | "APPLY" | "REVERSE";
type DispatchJobTransitionAction = "START" | "COMPLETE" | "CANCEL";
type WarehouseLocationTransitionAction = "ACTIVATE" | "DEACTIVATE";
type LotTransitionAction = "ACTIVATE" | "HOLD" | "EXHAUST" | "CLOSE";
type ReservationTransitionAction = "RELEASE" | "FULFILL" | "CANCEL";

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

  private async recordAuditEvent(
    user: UserScope,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, unknown>
  ) {
    await this.prisma.auditLog.create({
      data: {
        organization_id: user.organizationId,
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadata as any,
        created_by: user.id,
        updated_by: user.id
      }
    });
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

  private parseTransferTransitionAction(value: unknown): TransferTransitionAction {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      throw new BadRequestException("action is required");
    }
    if (!["REQUEST", "APPROVE", "DISPATCH", "RECEIVE", "CANCEL"].includes(text)) {
      throw new BadRequestException("action must be one of: REQUEST, APPROVE, DISPATCH, RECEIVE, CANCEL");
    }
    return text as TransferTransitionAction;
  }

  private parseTransferReceiveStatus(value: unknown): StockTransferStatus {
    const status = this.parseOptionalStockTransferStatus(value);
    if (!status) {
      return StockTransferStatus.COMPLETED;
    }
    if (status !== StockTransferStatus.PARTIAL && status !== StockTransferStatus.COMPLETED) {
      throw new BadRequestException("receive status must be PARTIAL or COMPLETED");
    }
    return status;
  }

  private canTransitionTransfer(fromStatus: StockTransferStatus, toStatus: StockTransferStatus): boolean {
    const allowed: Record<StockTransferStatus, StockTransferStatus[]> = {
      [StockTransferStatus.DRAFT]: [StockTransferStatus.REQUESTED, StockTransferStatus.CANCELLED],
      [StockTransferStatus.REQUESTED]: [StockTransferStatus.APPROVED, StockTransferStatus.CANCELLED],
      [StockTransferStatus.APPROVED]: [StockTransferStatus.DISPATCHED, StockTransferStatus.CANCELLED],
      [StockTransferStatus.DISPATCHED]: [StockTransferStatus.PARTIAL, StockTransferStatus.COMPLETED],
      [StockTransferStatus.PARTIAL]: [StockTransferStatus.COMPLETED],
      [StockTransferStatus.COMPLETED]: [],
      [StockTransferStatus.CANCELLED]: []
    };
    return allowed[fromStatus].includes(toStatus);
  }

  private appendTransferStatusHistory(
    existing: unknown,
    nextStatus: StockTransferStatus,
    userId: string,
    notes?: string | null
  ) {
    const history = Array.isArray(existing) ? [...existing] : [];
    history.push({
      status: nextStatus,
      changed_at: new Date().toISOString(),
      changed_by: userId,
      ...(notes ? { notes } : {})
    });
    return history;
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

  private parseAdjustmentTransitionAction(value: unknown): AdjustmentTransitionAction {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      throw new BadRequestException("action is required");
    }
    if (!["SUBMIT", "APPROVE", "APPLY", "REVERSE"].includes(text)) {
      throw new BadRequestException("action must be one of: SUBMIT, APPROVE, APPLY, REVERSE");
    }
    return text as AdjustmentTransitionAction;
  }

  private canTransitionAdjustment(fromStatus: StockAdjustmentStatus, toStatus: StockAdjustmentStatus): boolean {
    const allowed: Record<StockAdjustmentStatus, StockAdjustmentStatus[]> = {
      [StockAdjustmentStatus.DRAFT]: [StockAdjustmentStatus.SUBMITTED, StockAdjustmentStatus.REVERSED],
      [StockAdjustmentStatus.SUBMITTED]: [StockAdjustmentStatus.APPROVED, StockAdjustmentStatus.REVERSED],
      [StockAdjustmentStatus.APPROVED]: [StockAdjustmentStatus.APPLIED, StockAdjustmentStatus.REVERSED],
      [StockAdjustmentStatus.APPLIED]: [StockAdjustmentStatus.REVERSED],
      [StockAdjustmentStatus.REVERSED]: []
    };
    return allowed[fromStatus].includes(toStatus);
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

  private parseOptionalDispatchStatus(value: unknown): DispatchStatus | undefined {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!Object.values(DispatchStatus).includes(text as DispatchStatus)) {
      throw new BadRequestException(`status must be one of: ${Object.values(DispatchStatus).join(", ")}`);
    }
    return text as DispatchStatus;
  }

  private parseDispatchTransitionAction(value: unknown): DispatchTransitionAction {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      throw new BadRequestException("action is required");
    }
    if (!["READY", "PACK", "DISPATCH", "DELIVER", "FAIL", "RETURN", "CANCEL"].includes(text)) {
      throw new BadRequestException("action must be one of: READY, PACK, DISPATCH, DELIVER, FAIL, RETURN, CANCEL");
    }
    return text as DispatchTransitionAction;
  }

  private canTransitionDispatch(fromStatus: DispatchStatus, toStatus: DispatchStatus): boolean {
    const allowed: Record<DispatchStatus, DispatchStatus[]> = {
      [DispatchStatus.DRAFT]: [DispatchStatus.READY, DispatchStatus.CANCELLED],
      [DispatchStatus.READY]: [DispatchStatus.PACKED, DispatchStatus.FAILED],
      [DispatchStatus.PACKED]: [DispatchStatus.DISPATCHED, DispatchStatus.FAILED],
      [DispatchStatus.DISPATCHED]: [DispatchStatus.DELIVERED, DispatchStatus.FAILED, DispatchStatus.RETURNED],
      [DispatchStatus.DELIVERED]: [DispatchStatus.RETURNED],
      [DispatchStatus.FAILED]: [],
      [DispatchStatus.RETURNED]: [],
      [DispatchStatus.CANCELLED]: []
    };
    return allowed[fromStatus].includes(toStatus);
  }

  private parseOptionalStockReturnStatus(value: unknown): StockReturnStatus | undefined {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!Object.values(StockReturnStatus).includes(text as StockReturnStatus)) {
      throw new BadRequestException(`status must be one of: ${Object.values(StockReturnStatus).join(", ")}`);
    }
    return text as StockReturnStatus;
  }

  private parseOptionalAlertSeverity(value: unknown): AlertSeverity | undefined {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!Object.values(AlertSeverity).includes(text as AlertSeverity)) {
      throw new BadRequestException(`severity must be one of: ${Object.values(AlertSeverity).join(", ")}`);
    }
    return text as AlertSeverity;
  }

  private parseOptionalInventoryReservationStatus(value: unknown): InventoryReservationStatus | undefined {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!Object.values(InventoryReservationStatus).includes(text as InventoryReservationStatus)) {
      throw new BadRequestException(`status must be one of: ${Object.values(InventoryReservationStatus).join(", ")}`);
    }
    return text as InventoryReservationStatus;
  }

  private parseOptionalGenericStatus(value: unknown): string | undefined {
    const text = String(value ?? "").trim().toUpperCase();
    return text || undefined;
  }

  private parseDispatchJobTransitionAction(value: unknown): DispatchJobTransitionAction {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      throw new BadRequestException("action is required");
    }
    if (!["START", "COMPLETE", "CANCEL"].includes(text)) {
      throw new BadRequestException("action must be one of: START, COMPLETE, CANCEL");
    }
    return text as DispatchJobTransitionAction;
  }

  private parseWarehouseLocationTransitionAction(value: unknown): WarehouseLocationTransitionAction {
    const text = String(value ?? "").trim().toUpperCase();
    if (!["ACTIVATE", "DEACTIVATE"].includes(text)) {
      throw new BadRequestException("action must be one of: ACTIVATE, DEACTIVATE");
    }
    return text as WarehouseLocationTransitionAction;
  }

  private parseLotTransitionAction(value: unknown): LotTransitionAction {
    const text = String(value ?? "").trim().toUpperCase();
    if (!["ACTIVATE", "HOLD", "EXHAUST", "CLOSE"].includes(text)) {
      throw new BadRequestException("action must be one of: ACTIVATE, HOLD, EXHAUST, CLOSE");
    }
    return text as LotTransitionAction;
  }

  private parseReservationTransitionAction(value: unknown): ReservationTransitionAction {
    const text = String(value ?? "").trim().toUpperCase();
    if (!["RELEASE", "FULFILL", "CANCEL"].includes(text)) {
      throw new BadRequestException("action must be one of: RELEASE, FULFILL, CANCEL");
    }
    return text as ReservationTransitionAction;
  }

  private parseReceiptTransitionAction(value: unknown): ReceiptTransitionAction {
    const text = String(value ?? "").trim().toUpperCase();
    if (!["RECEIVE", "CLOSE", "CANCEL"].includes(text)) {
      throw new BadRequestException("action must be one of: RECEIVE, CLOSE, CANCEL");
    }
    return text as ReceiptTransitionAction;
  }

  private parseLotQuantity(value: unknown, fieldName: string, fallback = 0): number {
    const parsed = this.parseInteger(value, fieldName, fallback);
    if (parsed < 0) {
      throw new BadRequestException(`${fieldName} cannot be negative`);
    }
    return parsed;
  }

  private parseReturnTransitionAction(value: unknown): ReturnTransitionAction {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      throw new BadRequestException("action is required");
    }
    if (!["RECEIVE", "INSPECT", "COMPLETE", "CANCEL"].includes(text)) {
      throw new BadRequestException("action must be one of: RECEIVE, INSPECT, COMPLETE, CANCEL");
    }
    return text as ReturnTransitionAction;
  }

  private canTransitionReturn(fromStatus: StockReturnStatus, toStatus: StockReturnStatus): boolean {
    const allowed: Record<StockReturnStatus, StockReturnStatus[]> = {
      [StockReturnStatus.DRAFT]: [StockReturnStatus.RECEIVED, StockReturnStatus.CANCELLED],
      [StockReturnStatus.RECEIVED]: [StockReturnStatus.INSPECTED, StockReturnStatus.CANCELLED],
      [StockReturnStatus.INSPECTED]: [StockReturnStatus.COMPLETED, StockReturnStatus.CANCELLED],
      [StockReturnStatus.COMPLETED]: [],
      [StockReturnStatus.CANCELLED]: []
    };
    return allowed[fromStatus].includes(toStatus);
  }

  private parseOptionalStockReturnType(value: unknown): StockReturnType | undefined {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return undefined;
    }
    if (!Object.values(StockReturnType).includes(text as StockReturnType)) {
      throw new BadRequestException(`return_type must be one of: ${Object.values(StockReturnType).join(", ")}`);
    }
    return text as StockReturnType;
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

  private parseBoolean(value: unknown, fallback: boolean): boolean {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }
    if (typeof value === "boolean") {
      return value;
    }
    const text = String(value).trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(text)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(text)) {
      return false;
    }
    throw new BadRequestException("Boolean field contains an invalid value");
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

  private async validateWarehouseLocationScope(
    locationId: string | null,
    fieldName: string,
    user: UserScope,
    options?: { enforceUserBranch?: boolean }
  ) {
    if (!locationId) {
      return null;
    }
    const location = await this.prisma.warehouseLocation.findFirst({
      where: {
        id: locationId,
        organization_id: user.organizationId,
        deleted_at: null
      }
    });
    if (!location) {
      throw new BadRequestException(`${fieldName} must reference a warehouse location in your organization`);
    }
    if (options?.enforceUserBranch && user.branchId && location.branch_id !== user.branchId) {
      throw new BadRequestException(`${fieldName} must reference your branch scope`);
    }
    return location;
  }

  private async validateInventoryLotScope(lotId: string | null, fieldName: string, user: UserScope) {
    if (!lotId) {
      return null;
    }
    const lot = await this.prisma.inventoryLot.findFirst({
      where: {
        id: lotId,
        organization_id: user.organizationId,
        deleted_at: null
      }
    });
    if (!lot) {
      throw new BadRequestException(`${fieldName} must reference an inventory lot in your organization`);
    }
    if (user.branchId && lot.branch_id !== user.branchId) {
      throw new BadRequestException(`${fieldName} must reference your branch scope`);
    }
    return lot;
  }

  private async validateDispatchScope(dispatchId: string, user: UserScope) {
    const dispatch = await this.prisma.stockDispatch.findFirst({
      where: {
        id: dispatchId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        branch_id: true,
        status: true
      }
    });
    if (!dispatch) {
      throw new NotFoundException("Dispatch not found");
    }
    if (user.branchId && dispatch.branch_id !== user.branchId) {
      throw new BadRequestException("Dispatch is outside your branch scope");
    }
    return dispatch;
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

  private parseDispatchLineItems(value: unknown) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException("line_items must contain at least one item");
    }

    return value.map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        throw new BadRequestException(`line_items[${index}] must be an object`);
      }
      const row = raw as Record<string, unknown>;
      const itemId = this.parseRequiredUuid(row.item_id ?? row.itemId, `line_items[${index}].item_id`);
      const quantity = this.parseInteger(row.quantity, `line_items[${index}].quantity`, 0);
      if (quantity < 1) {
        throw new BadRequestException(`line_items[${index}].quantity must be at least 1`);
      }

      return {
        item_id: itemId,
        quantity
      };
    });
  }

  private parseReturnLineItems(value: unknown) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException("line_items must contain at least one item");
    }

    return value.map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        throw new BadRequestException(`line_items[${index}] must be an object`);
      }
      const row = raw as Record<string, unknown>;
      const itemId = this.parseRequiredUuid(row.item_id ?? row.itemId, `line_items[${index}].item_id`);
      const quantity = this.parseInteger(row.quantity, `line_items[${index}].quantity`, 0);
      if (quantity < 1) {
        throw new BadRequestException(`line_items[${index}].quantity must be at least 1`);
      }

      return {
        item_id: itemId,
        quantity,
        condition: this.parseOptionalString(row.condition),
        restock: this.parseBoolean(row.restock, true),
        damaged: this.parseBoolean(row.damaged, false)
      };
    });
  }

  private parsePickJobLineItems(value: unknown) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException("line_items must contain at least one item");
    }
    return value.map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        throw new BadRequestException(`line_items[${index}] must be an object`);
      }
      const row = raw as Record<string, unknown>;
      const stockDispatchLineId = this.parseRequiredUuid(
        row.stock_dispatch_line_id ?? row.stockDispatchLineId,
        `line_items[${index}].stock_dispatch_line_id`
      );
      const itemId = this.parseRequiredUuid(row.item_id ?? row.itemId, `line_items[${index}].item_id`);
      const requestedQty = this.parseLotQuantity(
        row.requested_qty ?? row.requestedQty,
        `line_items[${index}].requested_qty`,
        0
      );
      const pickedQty = this.parseLotQuantity(row.picked_qty ?? row.pickedQty, `line_items[${index}].picked_qty`, 0);
      if (pickedQty > requestedQty) {
        throw new BadRequestException(`line_items[${index}].picked_qty cannot exceed requested_qty`);
      }
      return {
        stock_dispatch_line_id: stockDispatchLineId,
        item_id: itemId,
        requested_qty: requestedQty,
        picked_qty: pickedQty,
        failed_reason: this.parseOptionalString(row.failed_reason ?? row.failedReason)
      };
    });
  }

  private parsePackJobLineItems(value: unknown) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException("line_items must contain at least one item");
    }
    return value.map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        throw new BadRequestException(`line_items[${index}] must be an object`);
      }
      const row = raw as Record<string, unknown>;
      const stockDispatchLineId = this.parseRequiredUuid(
        row.stock_dispatch_line_id ?? row.stockDispatchLineId,
        `line_items[${index}].stock_dispatch_line_id`
      );
      const itemId = this.parseRequiredUuid(row.item_id ?? row.itemId, `line_items[${index}].item_id`);
      const packedQty = this.parseLotQuantity(row.packed_qty ?? row.packedQty, `line_items[${index}].packed_qty`, 0);
      return {
        stock_dispatch_line_id: stockDispatchLineId,
        item_id: itemId,
        packed_qty: packedQty
      };
    });
  }

  private movementBranchForStock(
    movementType: DistributionMovementType,
    branchId: string | null,
    sourceBranchId: string | null,
    destinationBranchId: string | null
  ): string | null {
    if (movementType === DistributionMovementType.TRANSFER_OUT || movementType === DistributionMovementType.RETURN_OUT) {
      return sourceBranchId ?? branchId;
    }
    if (movementType === DistributionMovementType.TRANSFER_IN || movementType === DistributionMovementType.RETURN_IN) {
      return destinationBranchId ?? branchId;
    }
    return branchId;
  }

  private movementStockDeltas(movementType: DistributionMovementType, quantity: number) {
    const increaseTypes: DistributionMovementType[] = [
      DistributionMovementType.PURCHASE_RECEIPT,
      DistributionMovementType.TRANSFER_IN,
      DistributionMovementType.ADJUSTMENT_INCREASE,
      DistributionMovementType.RETURN_IN
    ];
    const decreaseTypes: DistributionMovementType[] = [
      DistributionMovementType.TRANSFER_OUT,
      DistributionMovementType.ADJUSTMENT_DECREASE,
      DistributionMovementType.DISPATCH_ISSUE,
      DistributionMovementType.RETURN_OUT,
      DistributionMovementType.DAMAGED_WRITE_OFF
    ];
    if (increaseTypes.includes(movementType)) {
      return { onHandDelta: quantity, availableDelta: quantity, damagedDelta: 0 };
    }
    if (movementType === DistributionMovementType.DAMAGED_WRITE_OFF) {
      return { onHandDelta: -quantity, availableDelta: -quantity, damagedDelta: quantity };
    }
    if (decreaseTypes.includes(movementType)) {
      return { onHandDelta: -quantity, availableDelta: -quantity, damagedDelta: 0 };
    }
    return { onHandDelta: 0, availableDelta: 0, damagedDelta: 0 };
  }

  private async applyMovementToInventoryStock(movement: {
    organization_id: string;
    movement_type: DistributionMovementType;
    quantity: number;
    item_id: string;
    branch_id: string | null;
    source_branch_id: string | null;
    destination_branch_id: string | null;
    occurred_at: Date;
  }) {
    const targetBranchId = this.movementBranchForStock(
      movement.movement_type,
      movement.branch_id,
      movement.source_branch_id,
      movement.destination_branch_id
    );
    if (!targetBranchId) {
      return;
    }

    const deltas = this.movementStockDeltas(movement.movement_type, movement.quantity);
    if (deltas.onHandDelta === 0 && deltas.availableDelta === 0 && deltas.damagedDelta === 0) {
      return;
    }

    const current = await this.prisma.inventoryStock.findFirst({
      where: {
        organization_id: movement.organization_id,
        branch_id: targetBranchId,
        item_id: movement.item_id,
        deleted_at: null
      },
      select: {
        id: true,
        quantity_on_hand: true,
        reserved_quantity: true,
        available_quantity: true,
        in_transit_quantity: true,
        incoming_quantity: true,
        damaged_quantity: true
      }
    });

    const currentOnHand = current?.quantity_on_hand ?? 0;
    const currentReserved = current?.reserved_quantity ?? 0;
    const currentAvailable = current?.available_quantity ?? Math.max(currentOnHand - currentReserved, 0);
    const currentInTransit = current?.in_transit_quantity ?? 0;
    const currentIncoming = current?.incoming_quantity ?? 0;
    const currentDamaged = current?.damaged_quantity ?? 0;

    const nextOnHand = currentOnHand + deltas.onHandDelta;
    const nextAvailable = currentAvailable + deltas.availableDelta;
    const nextDamaged = currentDamaged + deltas.damagedDelta;

    if (current) {
      await this.prisma.inventoryStock.update({
        where: { id: current.id },
        data: {
          quantity_on_hand: nextOnHand,
          available_quantity: nextAvailable,
          damaged_quantity: nextDamaged,
          last_movement_at: movement.occurred_at
        }
      });
      return;
    }

    await this.prisma.inventoryStock.create({
      data: {
        organization_id: movement.organization_id,
        branch_id: targetBranchId,
        item_id: movement.item_id,
        quantity_on_hand: nextOnHand,
        reserved_quantity: currentReserved,
        available_quantity: nextAvailable,
        in_transit_quantity: currentInTransit,
        incoming_quantity: currentIncoming,
        damaged_quantity: nextDamaged,
        stock_valuation: 0,
        last_movement_at: movement.occurred_at
      }
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
    const sourceLocationId = this.parseOptionalUuid(
      body.source_location_id ?? body.sourceLocationId,
      "source_location_id"
    );
    const destinationLocationId = this.parseOptionalUuid(
      body.destination_location_id ?? body.destinationLocationId,
      "destination_location_id"
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
    const sourceLocation = await this.validateWarehouseLocationScope(sourceLocationId, "source_location_id", user);
    const destinationLocation = await this.validateWarehouseLocationScope(
      destinationLocationId,
      "destination_location_id",
      user
    );

    if (sourceLocation && sourceBranchId && sourceLocation.branch_id !== sourceBranchId) {
      throw new BadRequestException("source_location_id must belong to source_branch_id");
    }
    if (destinationLocation && destinationBranchId && destinationLocation.branch_id !== destinationBranchId) {
      throw new BadRequestException("destination_location_id must belong to destination_branch_id");
    }

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
        source_location_id: sourceLocationId,
        destination_location_id: destinationLocationId,
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
        },
        source_location: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        destination_location: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    await this.applyMovementToInventoryStock({
      organization_id: user.organizationId,
      movement_type: movementType,
      quantity,
      item_id: itemId,
      branch_id: branchId,
      source_branch_id: sourceBranchId,
      destination_branch_id: destinationBranchId,
      occurred_at: occurredAt
    });

    return created;
  }

  async listMovements(filters: MovementListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const movementType = this.parseOptionalMovementType(filters.movementType);
    const itemId = filters.itemId ? this.parseRequiredUuid(filters.itemId, "itemId") : undefined;
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const fromDate = this.parseDate(filters.from, "from");
    const toDate = this.parseDate(filters.to, "to");

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException("from must be before to");
    }
    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
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

    if (branchId) {
      where.OR = [{ branch_id: branchId }, { source_branch_id: branchId }, { destination_branch_id: branchId }];
    } else if (user.branchId) {
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
        },
        source_location: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        destination_location: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });
  }

  async listInventoryStocks(filters: InventoryStockListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const itemId = filters.itemId ? this.parseRequiredUuid(filters.itemId, "itemId") : undefined;

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (itemId) {
      await this.validateItemScope(itemId, user);
    }

    return this.prisma.inventoryStock.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(itemId ? { item_id: itemId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            status: true,
            track_inventory: true
          }
        }
      },
      orderBy: { updated_at: "desc" },
      take: 200
    });
  }

  async createInventoryStock(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = this.parseOptionalUuid(body.branch_id ?? body.branchId, "branch_id") ?? user.branchId ?? null;
    if (!branchId) {
      throw new BadRequestException("branch_id is required");
    }
    await this.validateBranchScope(branchId, "branch_id", user);

    const itemId = this.parseRequiredUuid(body.item_id ?? body.itemId, "item_id");
    await this.validateItemScope(itemId, user);

    const quantityOnHand = this.parseLotQuantity(body.quantity_on_hand ?? body.quantityOnHand, "quantity_on_hand", 0);
    const reservedQuantity = this.parseLotQuantity(body.reserved_quantity ?? body.reservedQuantity, "reserved_quantity", 0);
    const inTransitQuantity = this.parseLotQuantity(
      body.in_transit_quantity ?? body.inTransitQuantity,
      "in_transit_quantity",
      0
    );
    const incomingQuantity = this.parseLotQuantity(body.incoming_quantity ?? body.incomingQuantity, "incoming_quantity", 0);
    const damagedQuantity = this.parseLotQuantity(body.damaged_quantity ?? body.damagedQuantity, "damaged_quantity", 0);
    const availableQuantity = this.parseLotQuantity(
      body.available_quantity ?? body.availableQuantity,
      "available_quantity",
      Math.max(quantityOnHand - reservedQuantity, 0)
    );
    const stockValuationInput = this.parseNumber(body.stock_valuation ?? body.stockValuation, "stock_valuation");
    if (reservedQuantity > quantityOnHand) {
      throw new BadRequestException("reserved_quantity cannot exceed quantity_on_hand");
    }
    if (availableQuantity > quantityOnHand) {
      throw new BadRequestException("available_quantity cannot exceed quantity_on_hand");
    }
    if (stockValuationInput !== null && stockValuationInput < 0) {
      throw new BadRequestException("stock_valuation cannot be negative");
    }

    const stockData = {
      quantity_on_hand: quantityOnHand,
      reserved_quantity: reservedQuantity,
      available_quantity: availableQuantity,
      in_transit_quantity: inTransitQuantity,
      incoming_quantity: incomingQuantity,
      damaged_quantity: damagedQuantity,
      stock_valuation: stockValuationInput ?? 0,
      last_movement_at: this.parseDate(body.last_movement_at ?? body.lastMovementAt, "last_movement_at")
    };

    const existing = await this.prisma.inventoryStock.findFirst({
      where: {
        organization_id: user.organizationId,
        branch_id: branchId,
        item_id: itemId,
        deleted_at: null
      },
      select: { id: true }
    });

    const saved = existing
      ? await this.prisma.inventoryStock.update({
          where: { id: existing.id },
          data: stockData,
          include: {
            branch: { select: { id: true, name: true } },
            item: { select: { id: true, name: true, sku: true, status: true, track_inventory: true } }
          }
        })
      : await this.prisma.inventoryStock.create({
          data: {
            organization_id: user.organizationId,
            branch_id: branchId,
            item_id: itemId,
            ...stockData
          },
          include: {
            branch: { select: { id: true, name: true } },
            item: { select: { id: true, name: true, sku: true, status: true, track_inventory: true } }
          }
        });

    await this.recordAuditEvent(
      user,
      existing ? "DISTRIBUTION_INVENTORY_STOCK_UPDATED" : "DISTRIBUTION_INVENTORY_STOCK_CREATED",
      "inventory_stock",
      saved.id,
      {
        branch_id: branchId,
        item_id: itemId,
        quantity_on_hand: quantityOnHand,
        reserved_quantity: reservedQuantity,
        available_quantity: availableQuantity
      }
    );

    return saved;
  }

  async updateInventoryStock(stockIdRaw: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const stockId = this.parseRequiredUuid(stockIdRaw, "stockId");
    const stock = await this.prisma.inventoryStock.findFirst({
      where: {
        id: stockId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        branch_id: true,
        item_id: true,
        quantity_on_hand: true,
        reserved_quantity: true,
        available_quantity: true,
        in_transit_quantity: true,
        incoming_quantity: true,
        damaged_quantity: true,
        stock_valuation: true
      }
    });
    if (!stock) {
      throw new NotFoundException("Inventory stock not found");
    }
    await this.validateBranchScope(stock.branch_id, "inventory_stock.branch_id", user);
    await this.validateItemScope(stock.item_id, user);

    const quantityOnHand = this.parseLotQuantity(
      body.quantity_on_hand ?? body.quantityOnHand,
      "quantity_on_hand",
      stock.quantity_on_hand
    );
    const reservedQuantity = this.parseLotQuantity(
      body.reserved_quantity ?? body.reservedQuantity,
      "reserved_quantity",
      stock.reserved_quantity
    );
    const inTransitQuantity = this.parseLotQuantity(
      body.in_transit_quantity ?? body.inTransitQuantity,
      "in_transit_quantity",
      stock.in_transit_quantity
    );
    const incomingQuantity = this.parseLotQuantity(
      body.incoming_quantity ?? body.incomingQuantity,
      "incoming_quantity",
      stock.incoming_quantity
    );
    const damagedQuantity = this.parseLotQuantity(
      body.damaged_quantity ?? body.damagedQuantity,
      "damaged_quantity",
      stock.damaged_quantity
    );
    const availableQuantity = this.parseLotQuantity(
      body.available_quantity ?? body.availableQuantity,
      "available_quantity",
      Math.max(quantityOnHand - reservedQuantity, 0)
    );
    const stockValuationInput = this.parseNumber(body.stock_valuation ?? body.stockValuation, "stock_valuation");
    const stockValuation =
      stockValuationInput !== null ? stockValuationInput : Number(String(stock.stock_valuation ?? "0"));

    if (reservedQuantity > quantityOnHand) {
      throw new BadRequestException("reserved_quantity cannot exceed quantity_on_hand");
    }
    if (availableQuantity > quantityOnHand) {
      throw new BadRequestException("available_quantity cannot exceed quantity_on_hand");
    }
    if (stockValuation < 0) {
      throw new BadRequestException("stock_valuation cannot be negative");
    }

    const updated = await this.prisma.inventoryStock.update({
      where: { id: stock.id },
      data: {
        quantity_on_hand: quantityOnHand,
        reserved_quantity: reservedQuantity,
        available_quantity: availableQuantity,
        in_transit_quantity: inTransitQuantity,
        incoming_quantity: incomingQuantity,
        damaged_quantity: damagedQuantity,
        stock_valuation: stockValuation,
        last_movement_at: this.parseDate(body.last_movement_at ?? body.lastMovementAt, "last_movement_at")
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true, status: true, track_inventory: true } }
      }
    });

    await this.recordAuditEvent(user, "DISTRIBUTION_INVENTORY_STOCK_UPDATED", "inventory_stock", stock.id, {
      branch_id: stock.branch_id,
      item_id: stock.item_id,
      quantity_on_hand: quantityOnHand,
      reserved_quantity: reservedQuantity,
      available_quantity: availableQuantity
    });

    return updated;
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
        receiving_location: {
          select: {
            id: true,
            code: true,
            name: true
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
    const receivingLocationId = this.parseOptionalUuid(
      body.receiving_location_id ?? body.receivingLocationId,
      "receiving_location_id"
    );

    await this.validateSupplierScope(supplierId, user);
    await this.validatePurchaseOrderScope(purchaseOrderId, user);
    const receivingLocation = await this.validateWarehouseLocationScope(
      receivingLocationId,
      "receiving_location_id",
      user
    );
    if (receivingLocation && receivingLocation.branch_id !== branchId) {
      throw new BadRequestException("receiving_location_id must belong to the same branch as branch_id");
    }

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
        receiving_location_id: receivingLocationId,
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
        receiving_location: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        line_items: true
      }
    });
  }

  async transitionReceipt(receiptIdRaw: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const receiptId = this.parseRequiredUuid(receiptIdRaw, "receiptId");
    const action = this.parseReceiptTransitionAction(body.action);

    const receipt = await this.prisma.goodsReceipt.findFirst({
      where: {
        id: receiptId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        branch_id: true,
        status: true
      }
    });
    if (!receipt) {
      throw new NotFoundException("Receipt not found");
    }
    await this.validateBranchScope(receipt.branch_id, "goods_receipt.branch_id", user);

    const currentStatus = receipt.status;
    const targetStatus =
      action === "RECEIVE"
        ? GoodsReceiptStatus.RECEIVED
        : action === "CLOSE"
          ? GoodsReceiptStatus.CLOSED
          : GoodsReceiptStatus.CANCELLED;
    const allowed: Record<GoodsReceiptStatus, GoodsReceiptStatus[]> = {
      [GoodsReceiptStatus.DRAFT]: [GoodsReceiptStatus.RECEIVED, GoodsReceiptStatus.CANCELLED],
      [GoodsReceiptStatus.PARTIAL]: [GoodsReceiptStatus.RECEIVED, GoodsReceiptStatus.CLOSED, GoodsReceiptStatus.CANCELLED],
      [GoodsReceiptStatus.RECEIVED]: [GoodsReceiptStatus.CLOSED],
      [GoodsReceiptStatus.CLOSED]: [],
      [GoodsReceiptStatus.CANCELLED]: []
    };
    if (!allowed[currentStatus].includes(targetStatus)) {
      throw new BadRequestException(`Cannot transition receipt from ${currentStatus} to ${targetStatus}`);
    }

    const updated = await this.prisma.goodsReceipt.update({
      where: { id: receipt.id },
      data: {
        status: targetStatus,
        received_date:
          targetStatus === GoodsReceiptStatus.RECEIVED
            ? this.parseDate(body.received_date ?? body.receivedDate, "received_date") ?? new Date()
            : undefined,
        received_by: targetStatus === GoodsReceiptStatus.RECEIVED ? user.id : undefined,
        notes: this.parseOptionalString(body.notes) ?? undefined
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
        receiving_location: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        line_items: true
      }
    });

    await this.recordAuditEvent(user, "DISTRIBUTION_RECEIPT_TRANSITION", "goods_receipt", receipt.id, {
      action,
      from_status: currentStatus,
      to_status: targetStatus
    });
    return updated;
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
        source_location: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        destination_location: {
          select: {
            id: true,
            code: true,
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
    const sourceLocationId = this.parseOptionalUuid(
      body.source_location_id ?? body.sourceLocationId,
      "source_location_id"
    );
    const destinationLocationId = this.parseOptionalUuid(
      body.destination_location_id ?? body.destinationLocationId,
      "destination_location_id"
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
    const sourceLocation = await this.validateWarehouseLocationScope(sourceLocationId, "source_location_id", user);
    const destinationLocation = await this.validateWarehouseLocationScope(
      destinationLocationId,
      "destination_location_id",
      user
    );
    if (sourceLocation && sourceLocation.branch_id !== sourceBranchId) {
      throw new BadRequestException("source_location_id must belong to source_branch_id");
    }
    if (destinationLocation && destinationLocation.branch_id !== destinationBranchId) {
      throw new BadRequestException("destination_location_id must belong to destination_branch_id");
    }

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
        source_location_id: sourceLocationId,
        destination_location_id: destinationLocationId,
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
        source_location: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        destination_location: {
          select: {
            id: true,
            code: true,
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

  async transitionTransfer(
    transferIdRaw: string,
    body: Record<string, unknown>,
    scope?: UserScope
  ) {
    const user = this.requireScope(scope);
    const transferId = this.parseRequiredUuid(transferIdRaw, "transferId");
    const action = this.parseTransferTransitionAction(body.action);
    const notes = this.parseOptionalString(body.notes);

    const transfer = await this.prisma.stockTransfer.findFirst({
      where: {
        id: transferId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        status: true,
        source_branch_id: true,
        destination_branch_id: true,
        status_history: true
      }
    });

    if (!transfer) {
      throw new NotFoundException("Transfer not found");
    }
    if (!this.scopedBranchIds(user, transfer.source_branch_id, transfer.destination_branch_id)) {
      throw new BadRequestException("Transfer is outside your branch scope");
    }

    const targetStatus =
      action === "REQUEST"
        ? StockTransferStatus.REQUESTED
        : action === "APPROVE"
          ? StockTransferStatus.APPROVED
          : action === "DISPATCH"
            ? StockTransferStatus.DISPATCHED
            : action === "CANCEL"
              ? StockTransferStatus.CANCELLED
              : this.parseTransferReceiveStatus(body.status);

    if (!this.canTransitionTransfer(transfer.status, targetStatus)) {
      throw new BadRequestException(
        `Cannot transition transfer from ${transfer.status} to ${targetStatus}`
      );
    }

    const updated = await this.prisma.stockTransfer.update({
      where: { id: transfer.id },
      data: {
        status: targetStatus,
        requested_by: targetStatus === StockTransferStatus.REQUESTED ? user.id : undefined,
        approved_by: targetStatus === StockTransferStatus.APPROVED ? user.id : undefined,
        dispatched_date: targetStatus === StockTransferStatus.DISPATCHED ? new Date() : undefined,
        received_date:
          targetStatus === StockTransferStatus.PARTIAL || targetStatus === StockTransferStatus.COMPLETED
            ? new Date()
            : undefined,
        notes: notes ?? undefined,
        status_history: this.appendTransferStatusHistory(transfer.status_history, targetStatus, user.id, notes)
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
        source_location: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        destination_location: {
          select: {
            id: true,
            code: true,
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
    await this.recordAuditEvent(user, "DISTRIBUTION_TRANSFER_TRANSITION", "stock_transfer", updated.id, {
      action,
      from_status: transfer.status,
      to_status: targetStatus
    });
    return updated;
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

  async transitionAdjustment(
    adjustmentIdRaw: string,
    body: Record<string, unknown>,
    scope?: UserScope
  ) {
    const user = this.requireScope(scope);
    const adjustmentId = this.parseRequiredUuid(adjustmentIdRaw, "adjustmentId");
    const action = this.parseAdjustmentTransitionAction(body.action);
    const notes = this.parseOptionalString(body.notes);

    const adjustment = await this.prisma.stockAdjustment.findFirst({
      where: {
        id: adjustmentId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        status: true,
        branch_id: true
      }
    });
    if (!adjustment) {
      throw new NotFoundException("Adjustment not found");
    }
    await this.validateBranchScope(adjustment.branch_id, "adjustment.branch_id", user);

    const targetStatus =
      action === "SUBMIT"
        ? StockAdjustmentStatus.SUBMITTED
        : action === "APPROVE"
          ? StockAdjustmentStatus.APPROVED
          : action === "APPLY"
            ? StockAdjustmentStatus.APPLIED
            : StockAdjustmentStatus.REVERSED;

    if (!this.canTransitionAdjustment(adjustment.status, targetStatus)) {
      throw new BadRequestException(
        `Cannot transition adjustment from ${adjustment.status} to ${targetStatus}`
      );
    }

    const updated = await this.prisma.stockAdjustment.update({
      where: { id: adjustment.id },
      data: {
        status: targetStatus,
        approved_by:
          targetStatus === StockAdjustmentStatus.APPROVED || targetStatus === StockAdjustmentStatus.APPLIED
            ? user.id
            : undefined,
        applied_at: targetStatus === StockAdjustmentStatus.APPLIED ? new Date() : undefined,
        notes: notes ?? undefined
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
    await this.recordAuditEvent(user, "DISTRIBUTION_ADJUSTMENT_TRANSITION", "stock_adjustment", updated.id, {
      action,
      from_status: adjustment.status,
      to_status: targetStatus
    });
    return updated;
  }

  async listDispatches(filters: DispatchListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const status = this.parseOptionalDispatchStatus(filters.status);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }

    return this.prisma.stockDispatch.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(status ? { status } : {}),
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

  async createDispatch(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = this.parseOptionalUuid(body.branch_id ?? body.branchId, "branch_id") ?? user.branchId ?? null;
    const dispatchLocationId = this.parseOptionalUuid(
      body.dispatch_location_id ?? body.dispatchLocationId,
      "dispatch_location_id"
    );
    if (!branchId) {
      throw new BadRequestException("branch_id is required");
    }
    await this.validateBranchScope(branchId, "branch_id", user);
    const dispatchLocation = await this.validateWarehouseLocationScope(
      dispatchLocationId,
      "dispatch_location_id",
      user
    );
    if (dispatchLocation && dispatchLocation.branch_id !== branchId) {
      throw new BadRequestException("dispatch_location_id must belong to the same branch as branch_id");
    }

    const lineItems = this.parseDispatchLineItems(body.line_items ?? body.lineItems);
    for (const lineItem of lineItems) {
      await this.validateItemScope(lineItem.item_id, user);
    }

    const dispatchNumber =
      this.parseOptionalString(body.dispatch_number ?? body.dispatchNumber) ??
      `DISP-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
    const status = this.parseOptionalDispatchStatus(body.status) ?? DispatchStatus.DRAFT;

    return this.prisma.stockDispatch.create({
      data: {
        organization_id: user.organizationId,
        branch_id: branchId,
        dispatch_location_id: dispatchLocationId,
        dispatch_number: dispatchNumber,
        destination: this.parseRequiredString(body.destination, "destination"),
        status,
        dispatch_date: this.parseDate(body.dispatch_date ?? body.dispatchDate, "dispatch_date"),
        packed_by: this.parseOptionalUuid(body.packed_by ?? body.packedBy, "packed_by"),
        dispatched_by:
          status === DispatchStatus.DISPATCHED || status === DispatchStatus.DELIVERED
            ? user.id
            : this.parseOptionalUuid(body.dispatched_by ?? body.dispatchedBy, "dispatched_by"),
        carrier_info: this.parseOptionalString(body.carrier_info ?? body.carrierInfo),
        tracking_info: this.parseOptionalString(body.tracking_info ?? body.trackingInfo),
        proof_of_dispatch: this.parseOptionalString(body.proof_of_dispatch ?? body.proofOfDispatch),
        notes: this.parseOptionalString(body.notes),
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
        dispatch_location: {
          select: {
            id: true,
            code: true,
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

  async transitionDispatch(
    dispatchIdRaw: string,
    body: Record<string, unknown>,
    scope?: UserScope
  ) {
    const user = this.requireScope(scope);
    const dispatchId = this.parseRequiredUuid(dispatchIdRaw, "dispatchId");
    const action = this.parseDispatchTransitionAction(body.action);
    const notes = this.parseOptionalString(body.notes);

    const dispatch = await this.prisma.stockDispatch.findFirst({
      where: {
        id: dispatchId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        status: true,
        branch_id: true
      }
    });
    if (!dispatch) {
      throw new NotFoundException("Dispatch not found");
    }
    if (user.branchId && dispatch.branch_id !== user.branchId) {
      throw new BadRequestException("Dispatch is outside your branch scope");
    }

    const targetStatus =
      action === "READY"
        ? DispatchStatus.READY
        : action === "PACK"
          ? DispatchStatus.PACKED
          : action === "DISPATCH"
            ? DispatchStatus.DISPATCHED
            : action === "DELIVER"
              ? DispatchStatus.DELIVERED
            : action === "FAIL"
              ? DispatchStatus.FAILED
              : action === "RETURN"
                ? DispatchStatus.RETURNED
                : DispatchStatus.CANCELLED;

    if (!this.canTransitionDispatch(dispatch.status, targetStatus)) {
      throw new BadRequestException(
        `Cannot transition dispatch from ${dispatch.status} to ${targetStatus}`
      );
    }

    const updated = await this.prisma.stockDispatch.update({
      where: { id: dispatch.id },
      data: {
        status: targetStatus,
        packed_by: targetStatus === DispatchStatus.PACKED ? user.id : undefined,
        dispatched_by:
          targetStatus === DispatchStatus.DISPATCHED || targetStatus === DispatchStatus.DELIVERED
            ? user.id
            : undefined,
        dispatch_date:
          targetStatus === DispatchStatus.DISPATCHED || targetStatus === DispatchStatus.DELIVERED
            ? new Date()
            : undefined,
        notes: notes ?? undefined
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
    await this.recordAuditEvent(user, "DISTRIBUTION_DISPATCH_TRANSITION", "stock_dispatch", updated.id, {
      action,
      from_status: dispatch.status,
      to_status: targetStatus
    });
    return updated;
  }

  async listReturns(filters: ReturnListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const status = this.parseOptionalStockReturnStatus(filters.status);
    const returnType = this.parseOptionalStockReturnType(filters.returnType);
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

    return this.prisma.stockReturn.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(status ? { status } : {}),
        ...(returnType ? { return_type: returnType } : {}),
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

  async createReturn(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const returnType = this.parseOptionalStockReturnType(body.return_type ?? body.returnType);
    if (!returnType) {
      throw new BadRequestException("return_type is required");
    }

    const sourceBranchId = this.parseOptionalUuid(body.source_branch_id ?? body.sourceBranchId, "source_branch_id");
    const destinationBranchId = this.parseOptionalUuid(
      body.destination_branch_id ?? body.destinationBranchId,
      "destination_branch_id"
    );
    const sourceLocationId = this.parseOptionalUuid(
      body.source_location_id ?? body.sourceLocationId,
      "source_location_id"
    );
    const destinationLocationId = this.parseOptionalUuid(
      body.destination_location_id ?? body.destinationLocationId,
      "destination_location_id"
    );
    if (sourceBranchId) {
      await this.validateBranchInOrganization(sourceBranchId, "source_branch_id", user);
    }
    if (destinationBranchId) {
      await this.validateBranchInOrganization(destinationBranchId, "destination_branch_id", user);
    }
    const sourceLocation = await this.validateWarehouseLocationScope(sourceLocationId, "source_location_id", user);
    const destinationLocation = await this.validateWarehouseLocationScope(
      destinationLocationId,
      "destination_location_id",
      user
    );
    if (sourceLocation && sourceBranchId && sourceLocation.branch_id !== sourceBranchId) {
      throw new BadRequestException("source_location_id must belong to source_branch_id");
    }
    if (destinationLocation && destinationBranchId && destinationLocation.branch_id !== destinationBranchId) {
      throw new BadRequestException("destination_location_id must belong to destination_branch_id");
    }
    if (user.branchId && sourceBranchId !== user.branchId && destinationBranchId !== user.branchId) {
      throw new BadRequestException("Return must include your branch scope");
    }

    const lineItems = this.parseReturnLineItems(body.line_items ?? body.lineItems);
    for (const lineItem of lineItems) {
      await this.validateItemScope(lineItem.item_id, user);
    }

    const returnNumber =
      this.parseOptionalString(body.return_number ?? body.returnNumber) ??
      `RET-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
    const status = this.parseOptionalStockReturnStatus(body.status) ?? StockReturnStatus.DRAFT;

    return this.prisma.stockReturn.create({
      data: {
        organization_id: user.organizationId,
        return_number: returnNumber,
        return_type: returnType,
        status,
        linked_source_type: this.parseOptionalString(body.linked_source_type ?? body.linkedSourceType),
        linked_source_id: this.parseOptionalUuid(body.linked_source_id ?? body.linkedSourceId, "linked_source_id"),
        source_branch_id: sourceBranchId,
        destination_branch_id: destinationBranchId,
        source_location_id: sourceLocationId,
        destination_location_id: destinationLocationId,
        reason: this.parseOptionalString(body.reason),
        condition_notes: this.parseOptionalString(body.condition_notes ?? body.conditionNotes),
        restock: this.parseBoolean(body.restock, true),
        damaged: this.parseBoolean(body.damaged, false),
        processed_by:
          status === StockReturnStatus.COMPLETED || status === StockReturnStatus.INSPECTED ? user.id : null,
        processed_date: this.parseDate(body.processed_date ?? body.processedDate, "processed_date"),
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
        source_location: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        destination_location: {
          select: {
            id: true,
            code: true,
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

  async transitionReturn(
    returnIdRaw: string,
    body: Record<string, unknown>,
    scope?: UserScope
  ) {
    const user = this.requireScope(scope);
    const returnId = this.parseRequiredUuid(returnIdRaw, "returnId");
    const action = this.parseReturnTransitionAction(body.action);
    const notes = this.parseOptionalString(body.notes);

    const stockReturn = await this.prisma.stockReturn.findFirst({
      where: {
        id: returnId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        status: true,
        source_branch_id: true,
        destination_branch_id: true
      }
    });
    if (!stockReturn) {
      throw new NotFoundException("Return not found");
    }
    if (!this.scopedBranchIds(user, stockReturn.source_branch_id, stockReturn.destination_branch_id)) {
      throw new BadRequestException("Return is outside your branch scope");
    }

    const targetStatus =
      action === "RECEIVE"
        ? StockReturnStatus.RECEIVED
        : action === "INSPECT"
          ? StockReturnStatus.INSPECTED
          : action === "COMPLETE"
            ? StockReturnStatus.COMPLETED
            : StockReturnStatus.CANCELLED;

    if (!this.canTransitionReturn(stockReturn.status, targetStatus)) {
      throw new BadRequestException(`Cannot transition return from ${stockReturn.status} to ${targetStatus}`);
    }

    const updated = await this.prisma.stockReturn.update({
      where: { id: stockReturn.id },
      data: {
        status: targetStatus,
        processed_by:
          targetStatus === StockReturnStatus.INSPECTED || targetStatus === StockReturnStatus.COMPLETED
            ? user.id
            : undefined,
        processed_date:
          targetStatus === StockReturnStatus.RECEIVED ||
          targetStatus === StockReturnStatus.INSPECTED ||
          targetStatus === StockReturnStatus.COMPLETED
            ? new Date()
            : undefined,
        notes: notes ?? undefined
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
    await this.recordAuditEvent(user, "DISTRIBUTION_RETURN_TRANSITION", "stock_return", updated.id, {
      action,
      from_status: stockReturn.status,
      to_status: targetStatus
    });
    return updated;
  }

  async listWarehouseLocations(filters: WarehouseLocationListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const parentLocationId = filters.parentLocationId
      ? this.parseRequiredUuid(filters.parentLocationId, "parentLocationId")
      : undefined;

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (parentLocationId) {
      const parent = await this.validateWarehouseLocationScope(parentLocationId, "parentLocationId", user, {
        enforceUserBranch: true
      });
      if (branchId && parent && parent.branch_id !== branchId) {
        throw new BadRequestException("parentLocationId must belong to the requested branchId");
      }
    }

    return this.prisma.warehouseLocation.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(parentLocationId ? { parent_location_id: parentLocationId } : {}),
        ...(typeof filters.isActive === "boolean" ? { is_active: filters.isActive } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        parent: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      },
      orderBy: [{ branch_id: "asc" }, { code: "asc" }],
      take: 300
    });
  }

  async createWarehouseLocation(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = this.parseOptionalUuid(body.branch_id ?? body.branchId, "branch_id") ?? user.branchId ?? null;
    if (!branchId) {
      throw new BadRequestException("branch_id is required");
    }
    await this.validateBranchScope(branchId, "branch_id", user);

    const parentLocationId = this.parseOptionalUuid(
      body.parent_location_id ?? body.parentLocationId,
      "parent_location_id"
    );
    if (parentLocationId) {
      const parent = await this.validateWarehouseLocationScope(parentLocationId, "parent_location_id", user, {
        enforceUserBranch: true
      });
      if (parent && parent.branch_id !== branchId) {
        throw new BadRequestException("parent_location_id must reference a location in the same branch");
      }
    }

    const code = this.parseRequiredString(body.code, "code").toUpperCase();
    const duplicate = await this.prisma.warehouseLocation.findFirst({
      where: {
        organization_id: user.organizationId,
        branch_id: branchId,
        code,
        deleted_at: null
      }
    });
    if (duplicate) {
      throw new BadRequestException("code already exists for this branch");
    }

    return this.prisma.warehouseLocation.create({
      data: {
        organization_id: user.organizationId,
        branch_id: branchId,
        parent_location_id: parentLocationId,
        code,
        name: this.parseRequiredString(body.name, "name"),
        location_type: (this.parseOptionalString(body.location_type ?? body.locationType) ?? "GENERAL").toUpperCase(),
        is_active: this.parseBoolean(body.is_active ?? body.isActive, true)
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        parent: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });
  }

  async transitionWarehouseLocation(locationIdRaw: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const locationId = this.parseRequiredUuid(locationIdRaw, "locationId");
    const action = this.parseWarehouseLocationTransitionAction(body.action);
    const location = await this.validateWarehouseLocationScope(locationId, "locationId", user, {
      enforceUserBranch: true
    });
    if (!location) {
      throw new NotFoundException("Warehouse location not found");
    }

    const updated = await this.prisma.warehouseLocation.update({
      where: { id: location.id },
      data: {
        is_active: action === "ACTIVATE"
      },
      include: {
        branch: { select: { id: true, name: true } },
        parent: { select: { id: true, code: true, name: true } }
      }
    });

    await this.recordAuditEvent(user, "DISTRIBUTION_WAREHOUSE_LOCATION_TRANSITION", "warehouse_location", location.id, {
      action,
      from_is_active: location.is_active,
      to_is_active: updated.is_active
    });
    return updated;
  }

  async listLots(filters: LotListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const itemId = filters.itemId ? this.parseRequiredUuid(filters.itemId, "itemId") : undefined;
    const supplierId = filters.supplierId ? this.parseRequiredUuid(filters.supplierId, "supplierId") : undefined;
    const status = this.parseOptionalGenericStatus(filters.status);

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (itemId) {
      await this.validateItemScope(itemId, user);
    }
    if (supplierId) {
      await this.validateSupplierScope(supplierId, user);
    }

    return this.prisma.inventoryLot.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(itemId ? { item_id: itemId } : {}),
        ...(supplierId ? { supplier_id: supplierId } : {}),
        ...(status ? { status } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true } },
        supplier: { select: { id: true, name: true, supplier_code: true } }
      },
      orderBy: [{ branch_id: "asc" }, { created_at: "desc" }],
      take: 300
    });
  }

  async createLot(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = this.parseOptionalUuid(body.branch_id ?? body.branchId, "branch_id") ?? user.branchId ?? null;
    if (!branchId) {
      throw new BadRequestException("branch_id is required");
    }
    await this.validateBranchScope(branchId, "branch_id", user);

    const itemId = this.parseRequiredUuid(body.item_id ?? body.itemId, "item_id");
    await this.validateItemScope(itemId, user);

    const supplierId = this.parseOptionalUuid(body.supplier_id ?? body.supplierId, "supplier_id");
    if (supplierId) {
      await this.validateSupplierScope(supplierId, user);
    }

    const goodsReceiptId = this.parseOptionalUuid(body.goods_receipt_id ?? body.goodsReceiptId, "goods_receipt_id");
    if (goodsReceiptId) {
      const receipt = await this.prisma.goodsReceipt.findFirst({
        where: {
          id: goodsReceiptId,
          organization_id: user.organizationId,
          deleted_at: null
        }
      });
      if (!receipt) {
        throw new BadRequestException("goods_receipt_id must reference a receipt in your organization");
      }
      if (receipt.branch_id !== branchId) {
        throw new BadRequestException("goods_receipt_id must belong to the same branch");
      }
    }

    const quantityReceived = this.parseLotQuantity(
      body.quantity_received ?? body.quantityReceived,
      "quantity_received",
      0
    );
    const quantityAvailable = this.parseLotQuantity(
      body.quantity_available ?? body.quantityAvailable,
      "quantity_available",
      quantityReceived
    );
    if (quantityAvailable > quantityReceived) {
      throw new BadRequestException("quantity_available cannot exceed quantity_received");
    }

    return this.prisma.inventoryLot.create({
      data: {
        organization_id: user.organizationId,
        branch_id: branchId,
        item_id: itemId,
        supplier_id: supplierId,
        goods_receipt_id: goodsReceiptId,
        batch_number: this.parseOptionalString(body.batch_number ?? body.batchNumber),
        serial_number: this.parseOptionalString(body.serial_number ?? body.serialNumber),
        manufacture_date: this.parseDate(body.manufacture_date ?? body.manufactureDate, "manufacture_date"),
        expiry_date: this.parseDate(body.expiry_date ?? body.expiryDate, "expiry_date"),
        quantity_received: quantityReceived,
        quantity_available: quantityAvailable,
        status: this.parseOptionalGenericStatus(body.status) ?? "ACTIVE",
        notes: this.parseOptionalString(body.notes)
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true } },
        supplier: { select: { id: true, name: true, supplier_code: true } }
      }
    });
  }

  async transitionLotStatus(lotIdRaw: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const lotId = this.parseRequiredUuid(lotIdRaw, "lotId");
    const action = this.parseLotTransitionAction(body.action);
    const lot = await this.validateInventoryLotScope(lotId, "lotId", user);
    if (!lot) {
      throw new NotFoundException("Lot not found");
    }

    const nextStatus =
      action === "ACTIVATE" ? "ACTIVE" : action === "HOLD" ? "HOLD" : action === "EXHAUST" ? "EXHAUSTED" : "CLOSED";
    const updated = await this.prisma.inventoryLot.update({
      where: { id: lot.id },
      data: {
        status: nextStatus,
        ...(nextStatus === "EXHAUSTED" || nextStatus === "CLOSED" ? { quantity_available: 0 } : {}),
        notes: this.parseOptionalString(body.notes) ?? undefined
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true } },
        supplier: { select: { id: true, name: true, supplier_code: true } }
      }
    });

    await this.recordAuditEvent(user, "DISTRIBUTION_LOT_TRANSITION", "inventory_lot", lot.id, {
      action,
      from_status: lot.status,
      to_status: nextStatus
    });
    return updated;
  }

  async listLotBalances(filters: LotBalanceListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const itemId = filters.itemId ? this.parseRequiredUuid(filters.itemId, "itemId") : undefined;
    const lotId = filters.lotId ? this.parseRequiredUuid(filters.lotId, "lotId") : undefined;
    const locationId = filters.locationId ? this.parseRequiredUuid(filters.locationId, "locationId") : undefined;

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (itemId) {
      await this.validateItemScope(itemId, user);
    }
    if (lotId) {
      await this.validateInventoryLotScope(lotId, "lotId", user);
    }
    if (locationId) {
      await this.validateWarehouseLocationScope(locationId, "locationId", user);
    }

    return this.prisma.inventoryLotBalance.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(itemId ? { item_id: itemId } : {}),
        ...(lotId ? { lot_id: lotId } : {}),
        ...(locationId ? { location_id: locationId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true } },
        lot: { select: { id: true, batch_number: true, serial_number: true, status: true } },
        location: { select: { id: true, code: true, name: true } }
      },
      orderBy: [{ branch_id: "asc" }, { updated_at: "desc" }],
      take: 500
    });
  }

  async createLotBalance(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = this.parseOptionalUuid(body.branch_id ?? body.branchId, "branch_id") ?? user.branchId ?? null;
    if (!branchId) {
      throw new BadRequestException("branch_id is required");
    }
    await this.validateBranchScope(branchId, "branch_id", user);

    const itemId = this.parseRequiredUuid(body.item_id ?? body.itemId, "item_id");
    await this.validateItemScope(itemId, user);

    const lotId = this.parseRequiredUuid(body.lot_id ?? body.lotId, "lot_id");
    const lot = await this.validateInventoryLotScope(lotId, "lot_id", user);
    if (!lot || lot.branch_id !== branchId) {
      throw new BadRequestException("lot_id must belong to the same branch");
    }
    if (lot.item_id !== itemId) {
      throw new BadRequestException("item_id must match lot item");
    }

    const locationId = this.parseOptionalUuid(body.location_id ?? body.locationId, "location_id");
    if (locationId) {
      const location = await this.validateWarehouseLocationScope(locationId, "location_id", user);
      if (location && location.branch_id !== branchId) {
        throw new BadRequestException("location_id must belong to the same branch");
      }
    }

    const quantityOnHand = this.parseLotQuantity(
      body.quantity_on_hand ?? body.quantityOnHand,
      "quantity_on_hand",
      0
    );
    const reservedQuantity = this.parseLotQuantity(
      body.reserved_quantity ?? body.reservedQuantity,
      "reserved_quantity",
      0
    );
    const damagedQuantity = this.parseLotQuantity(
      body.damaged_quantity ?? body.damagedQuantity,
      "damaged_quantity",
      0
    );
    const inTransitQuantity = this.parseLotQuantity(
      body.in_transit_quantity ?? body.inTransitQuantity,
      "in_transit_quantity",
      0
    );
    const availableQuantity = this.parseLotQuantity(
      body.available_quantity ?? body.availableQuantity,
      "available_quantity",
      Math.max(quantityOnHand - reservedQuantity - damagedQuantity, 0)
    );

    return this.prisma.inventoryLotBalance.create({
      data: {
        organization_id: user.organizationId,
        branch_id: branchId,
        item_id: itemId,
        lot_id: lotId,
        location_id: locationId,
        quantity_on_hand: quantityOnHand,
        reserved_quantity: reservedQuantity,
        available_quantity: availableQuantity,
        damaged_quantity: damagedQuantity,
        in_transit_quantity: inTransitQuantity,
        last_movement_at: this.parseDate(body.last_movement_at ?? body.lastMovementAt, "last_movement_at")
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true } },
        lot: { select: { id: true, batch_number: true, serial_number: true, status: true } },
        location: { select: { id: true, code: true, name: true } }
      }
    });
  }

  async listDispatchPickJobs(dispatchIdRaw: string, filters: DispatchJobListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const dispatchId = this.parseRequiredUuid(dispatchIdRaw, "dispatchId");
    await this.validateDispatchScope(dispatchId, user);
    const status = this.parseOptionalGenericStatus(filters.status);

    return this.prisma.dispatchPickJob.findMany({
      where: {
        organization_id: user.organizationId,
        stock_dispatch_id: dispatchId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(status ? { status } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } },
        lines: {
          include: {
            item: { select: { id: true, name: true, sku: true } },
            stock_dispatch_line: { select: { id: true, quantity: true } }
          }
        }
      },
      orderBy: { created_at: "desc" },
      take: 120
    });
  }

  async createDispatchPickJob(dispatchIdRaw: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const dispatchId = this.parseRequiredUuid(dispatchIdRaw, "dispatchId");
    const dispatch = await this.validateDispatchScope(dispatchId, user);

    const lineItems = this.parsePickJobLineItems(body.line_items ?? body.lineItems);
    const lineIds = [...new Set(lineItems.map((row) => row.stock_dispatch_line_id))];
    const dispatchLines = await this.prisma.stockDispatchLine.findMany({
      where: {
        id: { in: lineIds },
        stock_dispatch_id: dispatch.id
      },
      select: {
        id: true,
        item_id: true
      }
    });
    if (dispatchLines.length !== lineIds.length) {
      throw new BadRequestException("line_items contain stock_dispatch_line_id values outside this dispatch");
    }
    const dispatchLineMap = new Map(dispatchLines.map((row) => [row.id, row]));
    for (const line of lineItems) {
      const dispatchLine = dispatchLineMap.get(line.stock_dispatch_line_id);
      if (!dispatchLine || dispatchLine.item_id !== line.item_id) {
        throw new BadRequestException("line_items item_id must match the linked stock_dispatch_line_id");
      }
    }

    const pickNumber =
      this.parseOptionalString(body.pick_number ?? body.pickNumber) ??
      `PICK-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;

    return this.prisma.dispatchPickJob.create({
      data: {
        organization_id: user.organizationId,
        branch_id: dispatch.branch_id,
        stock_dispatch_id: dispatch.id,
        pick_number: pickNumber,
        status: this.parseOptionalGenericStatus(body.status) ?? "DRAFT",
        notes: this.parseOptionalString(body.notes),
        lines: {
          create: lineItems
        }
      },
      include: {
        branch: { select: { id: true, name: true } },
        lines: {
          include: {
            item: { select: { id: true, name: true, sku: true } },
            stock_dispatch_line: { select: { id: true, quantity: true } }
          }
        }
      }
    });
  }

  async transitionDispatchPickJob(pickJobIdRaw: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const pickJobId = this.parseRequiredUuid(pickJobIdRaw, "pickJobId");
    const action = this.parseDispatchJobTransitionAction(body.action);

    const pickJob = await this.prisma.dispatchPickJob.findFirst({
      where: {
        id: pickJobId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        branch_id: true,
        status: true
      }
    });
    if (!pickJob) {
      throw new NotFoundException("Pick job not found");
    }
    if (user.branchId && pickJob.branch_id !== user.branchId) {
      throw new BadRequestException("Pick job is outside your branch scope");
    }

    const targetStatus = action === "START" ? "IN_PROGRESS" : action === "COMPLETE" ? "COMPLETED" : "CANCELLED";
    const currentStatus = String(pickJob.status).toUpperCase();
    const allowed: Record<string, string[]> = {
      DRAFT: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: []
    };
    if (!allowed[currentStatus]?.includes(targetStatus)) {
      throw new BadRequestException(`Cannot transition pick job from ${currentStatus} to ${targetStatus}`);
    }

    const updated = await this.prisma.dispatchPickJob.update({
      where: { id: pickJob.id },
      data: {
        status: targetStatus,
        started_at: targetStatus === "IN_PROGRESS" ? new Date() : undefined,
        completed_at: targetStatus === "COMPLETED" ? new Date() : undefined,
        picked_by: targetStatus === "IN_PROGRESS" || targetStatus === "COMPLETED" ? user.id : undefined,
        notes: this.parseOptionalString(body.notes) ?? undefined
      },
      include: {
        branch: { select: { id: true, name: true } },
        lines: {
          include: {
            item: { select: { id: true, name: true, sku: true } },
            stock_dispatch_line: { select: { id: true, quantity: true } }
          }
        }
      }
    });
    await this.recordAuditEvent(user, "DISTRIBUTION_PICK_JOB_TRANSITION", "dispatch_pick_job", pickJob.id, {
      action,
      from_status: currentStatus,
      to_status: targetStatus
    });
    return updated;
  }

  async listDispatchPackJobs(dispatchIdRaw: string, filters: DispatchJobListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const dispatchId = this.parseRequiredUuid(dispatchIdRaw, "dispatchId");
    await this.validateDispatchScope(dispatchId, user);
    const status = this.parseOptionalGenericStatus(filters.status);

    return this.prisma.dispatchPackJob.findMany({
      where: {
        organization_id: user.organizationId,
        stock_dispatch_id: dispatchId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(status ? { status } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } },
        lines: {
          include: {
            item: { select: { id: true, name: true, sku: true } },
            stock_dispatch_line: { select: { id: true, quantity: true } }
          }
        }
      },
      orderBy: { created_at: "desc" },
      take: 120
    });
  }

  async createDispatchPackJob(dispatchIdRaw: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const dispatchId = this.parseRequiredUuid(dispatchIdRaw, "dispatchId");
    const dispatch = await this.validateDispatchScope(dispatchId, user);

    const lineItems = this.parsePackJobLineItems(body.line_items ?? body.lineItems);
    const lineIds = [...new Set(lineItems.map((row) => row.stock_dispatch_line_id))];
    const dispatchLines = await this.prisma.stockDispatchLine.findMany({
      where: {
        id: { in: lineIds },
        stock_dispatch_id: dispatch.id
      },
      select: {
        id: true,
        item_id: true
      }
    });
    if (dispatchLines.length !== lineIds.length) {
      throw new BadRequestException("line_items contain stock_dispatch_line_id values outside this dispatch");
    }
    const dispatchLineMap = new Map(dispatchLines.map((row) => [row.id, row]));
    for (const line of lineItems) {
      const dispatchLine = dispatchLineMap.get(line.stock_dispatch_line_id);
      if (!dispatchLine || dispatchLine.item_id !== line.item_id) {
        throw new BadRequestException("line_items item_id must match the linked stock_dispatch_line_id");
      }
    }

    const packNumber =
      this.parseOptionalString(body.pack_number ?? body.packNumber) ??
      `PACK-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;

    return this.prisma.dispatchPackJob.create({
      data: {
        organization_id: user.organizationId,
        branch_id: dispatch.branch_id,
        stock_dispatch_id: dispatch.id,
        pack_number: packNumber,
        status: this.parseOptionalGenericStatus(body.status) ?? "DRAFT",
        carrier_info: this.parseOptionalString(body.carrier_info ?? body.carrierInfo),
        tracking_info: this.parseOptionalString(body.tracking_info ?? body.trackingInfo),
        notes: this.parseOptionalString(body.notes),
        lines: {
          create: lineItems
        }
      },
      include: {
        branch: { select: { id: true, name: true } },
        lines: {
          include: {
            item: { select: { id: true, name: true, sku: true } },
            stock_dispatch_line: { select: { id: true, quantity: true } }
          }
        }
      }
    });
  }

  async transitionDispatchPackJob(packJobIdRaw: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const packJobId = this.parseRequiredUuid(packJobIdRaw, "packJobId");
    const action = this.parseDispatchJobTransitionAction(body.action);

    const packJob = await this.prisma.dispatchPackJob.findFirst({
      where: {
        id: packJobId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        branch_id: true,
        status: true
      }
    });
    if (!packJob) {
      throw new NotFoundException("Pack job not found");
    }
    if (user.branchId && packJob.branch_id !== user.branchId) {
      throw new BadRequestException("Pack job is outside your branch scope");
    }

    const targetStatus = action === "START" ? "IN_PROGRESS" : action === "COMPLETE" ? "COMPLETED" : "CANCELLED";
    const currentStatus = String(packJob.status).toUpperCase();
    const allowed: Record<string, string[]> = {
      DRAFT: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: []
    };
    if (!allowed[currentStatus]?.includes(targetStatus)) {
      throw new BadRequestException(`Cannot transition pack job from ${currentStatus} to ${targetStatus}`);
    }

    const updated = await this.prisma.dispatchPackJob.update({
      where: { id: packJob.id },
      data: {
        status: targetStatus,
        started_at: targetStatus === "IN_PROGRESS" ? new Date() : undefined,
        completed_at: targetStatus === "COMPLETED" ? new Date() : undefined,
        packed_by: targetStatus === "IN_PROGRESS" || targetStatus === "COMPLETED" ? user.id : undefined,
        notes: this.parseOptionalString(body.notes) ?? undefined
      },
      include: {
        branch: { select: { id: true, name: true } },
        lines: {
          include: {
            item: { select: { id: true, name: true, sku: true } },
            stock_dispatch_line: { select: { id: true, quantity: true } }
          }
        }
      }
    });
    await this.recordAuditEvent(user, "DISTRIBUTION_PACK_JOB_TRANSITION", "dispatch_pack_job", packJob.id, {
      action,
      from_status: currentStatus,
      to_status: targetStatus
    });
    return updated;
  }

  async listReservations(filters: ReservationListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const status = this.parseOptionalInventoryReservationStatus(filters.status);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const itemId = filters.itemId ? this.parseRequiredUuid(filters.itemId, "itemId") : undefined;

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (itemId) {
      await this.validateItemScope(itemId, user);
    }

    return this.prisma.inventoryReservation.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(status ? { status } : {}),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(itemId ? { item_id: itemId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      },
      orderBy: { created_at: "desc" },
      take: 100
    });
  }

  async createReservation(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = this.parseOptionalUuid(body.branch_id ?? body.branchId, "branch_id") ?? user.branchId ?? null;
    if (!branchId) {
      throw new BadRequestException("branch_id is required");
    }
    await this.validateBranchScope(branchId, "branch_id", user);

    const itemId = this.parseRequiredUuid(body.item_id ?? body.itemId, "item_id");
    await this.validateItemScope(itemId, user);

    const reservedQuantity = this.parseInteger(
      body.reserved_quantity ?? body.reservedQuantity,
      "reserved_quantity",
      0
    );
    if (reservedQuantity < 1) {
      throw new BadRequestException("reserved_quantity must be at least 1");
    }

    const status = this.parseOptionalInventoryReservationStatus(body.status) ?? InventoryReservationStatus.ACTIVE;

    return this.prisma.inventoryReservation.create({
      data: {
        organization_id: user.organizationId,
        branch_id: branchId,
        item_id: itemId,
        reserved_quantity: reservedQuantity,
        reference_type: this.parseOptionalString(body.reference_type ?? body.referenceType),
        reference_id: this.parseOptionalUuid(body.reference_id ?? body.referenceId, "reference_id"),
        reserved_by: user.id,
        reserved_date: this.parseDate(body.reserved_date ?? body.reservedDate, "reserved_date") ?? new Date(),
        expires_at: this.parseDate(body.expires_at ?? body.expiresAt, "expires_at"),
        status,
        notes: this.parseOptionalString(body.notes)
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    });
  }

  async transitionReservation(reservationIdRaw: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const reservationId = this.parseRequiredUuid(reservationIdRaw, "reservationId");
    const action = this.parseReservationTransitionAction(body.action);
    const reservation = await this.prisma.inventoryReservation.findFirst({
      where: {
        id: reservationId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        branch_id: true,
        status: true
      }
    });
    if (!reservation) {
      throw new NotFoundException("Reservation not found");
    }
    await this.validateBranchScope(reservation.branch_id, "reservation.branch_id", user);

    const currentStatus = reservation.status;
    const targetStatus =
      action === "RELEASE"
        ? InventoryReservationStatus.RELEASED
        : action === "FULFILL"
          ? InventoryReservationStatus.FULFILLED
          : InventoryReservationStatus.CANCELLED;

    const allowed: Record<InventoryReservationStatus, InventoryReservationStatus[]> = {
      [InventoryReservationStatus.ACTIVE]: [
        InventoryReservationStatus.RELEASED,
        InventoryReservationStatus.FULFILLED,
        InventoryReservationStatus.CANCELLED
      ],
      [InventoryReservationStatus.RELEASED]: [],
      [InventoryReservationStatus.EXPIRED]: [],
      [InventoryReservationStatus.FULFILLED]: [],
      [InventoryReservationStatus.CANCELLED]: []
    };
    if (!allowed[currentStatus].includes(targetStatus)) {
      throw new BadRequestException(`Cannot transition reservation from ${currentStatus} to ${targetStatus}`);
    }

    const updated = await this.prisma.inventoryReservation.update({
      where: { id: reservation.id },
      data: {
        status: targetStatus,
        notes: this.parseOptionalString(body.notes) ?? undefined
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    });

    await this.recordAuditEvent(user, "DISTRIBUTION_RESERVATION_TRANSITION", "inventory_reservation", reservation.id, {
      action,
      from_status: currentStatus,
      to_status: targetStatus
    });
    return updated;
  }

  async listReorderRules(filters: ReorderRuleListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const itemId = filters.itemId ? this.parseRequiredUuid(filters.itemId, "itemId") : undefined;

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (itemId) {
      await this.validateItemScope(itemId, user);
    }

    return this.prisma.reorderRule.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(itemId ? { item_id: itemId } : {}),
        ...(typeof filters.isActive === "boolean" ? { is_active: filters.isActive } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        preferred_supplier: {
          select: {
            id: true,
            name: true,
            supplier_code: true
          }
        }
      },
      orderBy: { created_at: "desc" },
      take: 100
    });
  }

  async createReorderRule(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = this.parseOptionalUuid(body.branch_id ?? body.branchId, "branch_id") ?? user.branchId ?? null;
    if (!branchId) {
      throw new BadRequestException("branch_id is required");
    }
    await this.validateBranchScope(branchId, "branch_id", user);

    const itemId = this.parseRequiredUuid(body.item_id ?? body.itemId, "item_id");
    await this.validateItemScope(itemId, user);

    const preferredSupplierId = this.parseOptionalUuid(
      body.preferred_supplier_id ?? body.preferredSupplierId,
      "preferred_supplier_id"
    );
    if (preferredSupplierId) {
      await this.validateSupplierScope(preferredSupplierId, user);
    }

    const minimumStock = this.parseInteger(body.minimum_stock ?? body.minimumStock, "minimum_stock", 0);
    const reorderLevel = this.parseInteger(body.reorder_level ?? body.reorderLevel, "reorder_level", 0);
    const reorderQuantity = this.parseInteger(body.reorder_quantity ?? body.reorderQuantity, "reorder_quantity", 0);
    const leadTimeDays = this.parseInteger(body.lead_time_days ?? body.leadTimeDays, "lead_time_days", 0);

    if (minimumStock < 0 || reorderLevel < 0 || reorderQuantity < 0 || leadTimeDays < 0) {
      throw new BadRequestException(
        "minimum_stock, reorder_level, reorder_quantity, and lead_time_days cannot be negative"
      );
    }
    if (reorderQuantity < 1) {
      throw new BadRequestException("reorder_quantity must be at least 1");
    }

    return this.prisma.reorderRule.create({
      data: {
        organization_id: user.organizationId,
        branch_id: branchId,
        item_id: itemId,
        preferred_supplier_id: preferredSupplierId,
        minimum_stock: minimumStock,
        reorder_level: reorderLevel,
        reorder_quantity: reorderQuantity,
        lead_time_days: leadTimeDays,
        is_active: this.parseBoolean(body.is_active ?? body.isActive, true)
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        preferred_supplier: {
          select: {
            id: true,
            name: true,
            supplier_code: true
          }
        }
      }
    });
  }

  async listRestockingSuggestions(filters: RestockingSuggestionFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }

    const rules = await this.prisma.reorderRule.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {}),
        ...(filters.includeInactive ? {} : { is_active: true })
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        preferred_supplier: {
          select: {
            id: true,
            name: true,
            supplier_code: true
          }
        }
      },
      take: 500
    });

    if (rules.length === 0) {
      return [];
    }

    const itemIds = [...new Set(rules.map((rule) => rule.item_id))];
    const branchIds = [...new Set(rules.map((rule) => rule.branch_id))];

    const stocks = await this.prisma.inventoryStock.findMany({
      where: {
        organization_id: user.organizationId,
        deleted_at: null,
        item_id: { in: itemIds },
        branch_id: { in: branchIds }
      },
      select: {
        item_id: true,
        branch_id: true,
        quantity_on_hand: true
      }
    });

    const stockByItemBranch = new Map<string, number>();
    for (const row of stocks) {
      stockByItemBranch.set(`${row.branch_id}:${row.item_id}`, row.quantity_on_hand ?? 0);
    }

    const suggestions = rules.map((rule) => {
      const key = `${rule.branch_id}:${rule.item_id}`;
      const currentQty = stockByItemBranch.get(key) ?? 0;
      const shortageToLevel = Math.max((rule.reorder_level ?? 0) - currentQty, 0);
      const suggestedOrderQty = shortageToLevel > 0 ? Math.max(shortageToLevel, rule.reorder_quantity ?? 0) : 0;

      return {
        branch_id: rule.branch_id,
        branch_name: rule.branch.name,
        item_id: rule.item_id,
        item_name: rule.item.name,
        sku: rule.item.sku,
        preferred_supplier_id: rule.preferred_supplier_id,
        preferred_supplier_name: rule.preferred_supplier?.name ?? null,
        minimum_stock: rule.minimum_stock,
        reorder_level: rule.reorder_level,
        reorder_quantity: rule.reorder_quantity,
        lead_time_days: rule.lead_time_days,
        is_active: rule.is_active,
        current_stock: currentQty,
        shortage_to_reorder_level: shortageToLevel,
        suggested_order_quantity: suggestedOrderQty,
        needs_restock: suggestedOrderQty > 0
      };
    });

    return filters.includeZero ? suggestions : suggestions.filter((row) => row.needs_restock);
  }

  async listAlerts(filters: AlertListFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    const severity = this.parseOptionalAlertSeverity(filters.severity);

    return this.prisma.stockAlert.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(filters.status ? { status: String(filters.status).trim().toUpperCase() } : {}),
        ...(severity ? { severity } : {}),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      orderBy: [{ severity: "desc" }, { detected_at: "desc" }],
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true } }
      },
      take: 100
    });
  }

  async resolveAlert(alertIdRaw: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const alertId = this.parseRequiredUuid(alertIdRaw, "alertId");
    const resolutionNote = this.parseOptionalString(body.resolution_note ?? body.resolutionNote);

    const alert = await this.prisma.stockAlert.findFirst({
      where: {
        id: alertId,
        organization_id: user.organizationId,
        deleted_at: null
      },
      select: {
        id: true,
        branch_id: true,
        status: true
      }
    });
    if (!alert) {
      throw new NotFoundException("Alert not found");
    }
    if (user.branchId && alert.branch_id && alert.branch_id !== user.branchId) {
      throw new BadRequestException("Alert is outside your branch scope");
    }

    const updated = await this.prisma.stockAlert.update({
      where: { id: alert.id },
      data: {
        status: "RESOLVED",
        resolved_at: new Date(),
        metadata: {
          resolution_note: resolutionNote ?? null,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          previous_status: alert.status
        }
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true } }
      }
    });

    await this.recordAuditEvent(user, "DISTRIBUTION_ALERT_RESOLVED", "stock_alert", updated.id, {
      from_status: alert.status,
      to_status: "RESOLVED"
    });
    return updated;
  }

  async stockOnHandReport(filters: StockOnHandReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const itemId = filters.itemId ? this.parseRequiredUuid(filters.itemId, "itemId") : undefined;

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (itemId) {
      await this.validateItemScope(itemId, user);
    }

    const stocks = await this.prisma.inventoryStock.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(itemId ? { item_id: itemId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            reorder_level: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ branch_id: "asc" }, { item_id: "asc" }],
      take: 500
    });

    const rows = stocks
      .map((row) => {
        const quantityOnHand = row.quantity_on_hand ?? 0;
        const reservedQuantity = row.reserved_quantity ?? 0;
        const availableQuantity = row.available_quantity ?? quantityOnHand - reservedQuantity;
        const inTransitQuantity = row.in_transit_quantity ?? 0;
        const incomingQuantity = row.incoming_quantity ?? 0;
        const damagedQuantity = row.damaged_quantity ?? 0;
        const reorderLevel = row.item.reorder_level ?? 0;
        const outOfStock = quantityOnHand <= 0;
        const lowStock = !outOfStock && reorderLevel > 0 && quantityOnHand <= reorderLevel;

        return {
          branch_id: row.branch_id,
          branch_name: row.branch?.name ?? null,
          item_id: row.item_id,
          item_name: row.item.name,
          sku: row.item.sku,
          quantity_on_hand: quantityOnHand,
          reserved_quantity: reservedQuantity,
          available_quantity: availableQuantity,
          in_transit_quantity: inTransitQuantity,
          incoming_quantity: incomingQuantity,
          damaged_quantity: damagedQuantity,
          reorder_level: reorderLevel,
          low_stock: lowStock,
          out_of_stock: outOfStock,
          last_movement_at: row.last_movement_at
        };
      })
      .filter((row) => (filters.lowOnly ? row.low_stock : true))
      .filter((row) => (filters.outOnly ? row.out_of_stock : true));

    const summary = {
      total_rows: rows.length,
      total_quantity_on_hand: rows.reduce((sum, row) => sum + row.quantity_on_hand, 0),
      total_available_quantity: rows.reduce((sum, row) => sum + row.available_quantity, 0),
      low_stock_count: rows.filter((row) => row.low_stock).length,
      out_of_stock_count: rows.filter((row) => row.out_of_stock).length
    };

    return {
      summary,
      rows,
      generated_at: new Date().toISOString()
    };
  }

  async branchStockSummaryReport(filters: BranchStockSummaryReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }

    const rows = await this.prisma.inventoryStock.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, reorder_level: true } }
      },
      orderBy: [{ branch_id: "asc" }, { item_id: "asc" }],
      take: 1000
    });

    const byBranch = new Map<
      string,
      {
        branch_id: string;
        branch_name: string | null;
        item_row_count: number;
        total_quantity_on_hand: number;
        total_available_quantity: number;
        total_in_transit_quantity: number;
        total_incoming_quantity: number;
        total_damaged_quantity: number;
        low_stock_item_count: number;
        out_of_stock_item_count: number;
      }
    >();

    for (const row of rows) {
      const quantityOnHand = row.quantity_on_hand ?? 0;
      const availableQuantity = row.available_quantity ?? 0;
      const inTransitQuantity = row.in_transit_quantity ?? 0;
      const incomingQuantity = row.incoming_quantity ?? 0;
      const damagedQuantity = row.damaged_quantity ?? 0;
      const reorderLevel = row.item.reorder_level ?? 0;
      const outOfStock = quantityOnHand <= 0;
      const lowStock = !outOfStock && reorderLevel > 0 && quantityOnHand <= reorderLevel;
      const key = row.branch_id;
      const current = byBranch.get(key) ?? {
        branch_id: row.branch_id,
        branch_name: row.branch?.name ?? null,
        item_row_count: 0,
        total_quantity_on_hand: 0,
        total_available_quantity: 0,
        total_in_transit_quantity: 0,
        total_incoming_quantity: 0,
        total_damaged_quantity: 0,
        low_stock_item_count: 0,
        out_of_stock_item_count: 0
      };

      current.item_row_count += 1;
      current.total_quantity_on_hand += quantityOnHand;
      current.total_available_quantity += availableQuantity;
      current.total_in_transit_quantity += inTransitQuantity;
      current.total_incoming_quantity += incomingQuantity;
      current.total_damaged_quantity += damagedQuantity;
      current.low_stock_item_count += lowStock ? 1 : 0;
      current.out_of_stock_item_count += outOfStock ? 1 : 0;
      byBranch.set(key, current);
    }

    const summaryRows = Array.from(byBranch.values()).sort(
      (a, b) => b.total_quantity_on_hand - a.total_quantity_on_hand
    );
    const summary = {
      total_branches: summaryRows.length,
      total_item_rows: summaryRows.reduce((sum, row) => sum + row.item_row_count, 0),
      total_quantity_on_hand: summaryRows.reduce((sum, row) => sum + row.total_quantity_on_hand, 0),
      total_available_quantity: summaryRows.reduce((sum, row) => sum + row.total_available_quantity, 0),
      total_in_transit_quantity: summaryRows.reduce((sum, row) => sum + row.total_in_transit_quantity, 0),
      total_incoming_quantity: summaryRows.reduce((sum, row) => sum + row.total_incoming_quantity, 0),
      total_damaged_quantity: summaryRows.reduce((sum, row) => sum + row.total_damaged_quantity, 0),
      low_stock_item_count: summaryRows.reduce((sum, row) => sum + row.low_stock_item_count, 0),
      out_of_stock_item_count: summaryRows.reduce((sum, row) => sum + row.out_of_stock_item_count, 0)
    };

    return {
      summary,
      rows: summaryRows,
      generated_at: new Date().toISOString()
    };
  }

  async movementHistoryReport(filters: MovementReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const movementType = this.parseOptionalMovementType(filters.movementType);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const itemId = filters.itemId ? this.parseRequiredUuid(filters.itemId, "itemId") : undefined;
    const fromDate = this.parseDate(filters.from, "from");
    const toDate = this.parseDate(filters.to, "to");

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (itemId) {
      await this.validateItemScope(itemId, user);
    }

    const rows = await this.prisma.inventoryMovement.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(movementType ? { movement_type: movementType } : {}),
        ...(itemId ? { item_id: itemId } : {}),
        ...(fromDate || toDate
          ? {
              occurred_at: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {})
              }
            }
          : {}),
        ...(branchId
          ? {
              OR: [{ branch_id: branchId }, { source_branch_id: branchId }, { destination_branch_id: branchId }]
            }
          : {}),
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
      include: {
        item: { select: { id: true, name: true, sku: true } },
        branch: { select: { id: true, name: true } },
        source_branch: { select: { id: true, name: true } },
        destination_branch: { select: { id: true, name: true } }
      },
      orderBy: { occurred_at: "desc" },
      take: 500
    });

    const summary = {
      total_movements: rows.length,
      total_quantity: rows.reduce((sum, row) => sum + row.quantity, 0),
      by_type: rows.reduce<Record<string, number>>((acc, row) => {
        const key = row.movement_type;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    };

    return {
      summary,
      rows,
      generated_at: new Date().toISOString()
    };
  }

  async transferPerformanceReport(filters: TransferReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const status = this.parseOptionalStockTransferStatus(filters.status);
    const sourceBranchId = filters.sourceBranchId
      ? this.parseRequiredUuid(filters.sourceBranchId, "sourceBranchId")
      : undefined;
    const destinationBranchId = filters.destinationBranchId
      ? this.parseRequiredUuid(filters.destinationBranchId, "destinationBranchId")
      : undefined;
    const fromDate = this.parseDate(filters.from, "from");
    const toDate = this.parseDate(filters.to, "to");

    if (sourceBranchId) {
      await this.validateBranchInOrganization(sourceBranchId, "sourceBranchId", user);
    }
    if (destinationBranchId) {
      await this.validateBranchInOrganization(destinationBranchId, "destinationBranchId", user);
    }

    const rows = await this.prisma.stockTransfer.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(status ? { status } : {}),
        ...(sourceBranchId ? { source_branch_id: sourceBranchId } : {}),
        ...(destinationBranchId ? { destination_branch_id: destinationBranchId } : {}),
        ...(fromDate || toDate
          ? {
              created_date: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {})
              }
            }
          : {}),
        ...(user.branchId
          ? {
              OR: [{ source_branch_id: user.branchId }, { destination_branch_id: user.branchId }]
            }
          : {})
      },
      include: {
        source_branch: { select: { id: true, name: true } },
        destination_branch: { select: { id: true, name: true } },
        line_items: true
      },
      orderBy: { created_date: "desc" },
      take: 300
    });

    const reportRows = rows.map((row) => {
      const qtyRequested = row.line_items.reduce((sum, line) => sum + line.quantity_requested, 0);
      const qtySent = row.line_items.reduce((sum, line) => sum + line.quantity_sent, 0);
      const qtyReceived = row.line_items.reduce((sum, line) => sum + line.quantity_received, 0);
      const fillRatePct = qtyRequested > 0 ? Number(((qtyReceived / qtyRequested) * 100).toFixed(2)) : 0;
      return {
        id: row.id,
        transfer_number: row.transfer_number,
        status: row.status,
        source_branch_id: row.source_branch_id,
        source_branch_name: row.source_branch.name,
        destination_branch_id: row.destination_branch_id,
        destination_branch_name: row.destination_branch.name,
        created_date: row.created_date,
        dispatched_date: row.dispatched_date,
        received_date: row.received_date,
        line_count: row.line_items.length,
        quantity_requested_total: qtyRequested,
        quantity_sent_total: qtySent,
        quantity_received_total: qtyReceived,
        fill_rate_pct: fillRatePct
      };
    });

    const summary = {
      total_transfers: reportRows.length,
      quantity_requested_total: reportRows.reduce((sum, row) => sum + row.quantity_requested_total, 0),
      quantity_sent_total: reportRows.reduce((sum, row) => sum + row.quantity_sent_total, 0),
      quantity_received_total: reportRows.reduce((sum, row) => sum + row.quantity_received_total, 0),
      by_status: reportRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1;
        return acc;
      }, {})
    };

    return {
      summary,
      rows: reportRows,
      generated_at: new Date().toISOString()
    };
  }

  async adjustmentVarianceReport(filters: AdjustmentReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const status = this.parseOptionalStockAdjustmentStatus(filters.status);
    const adjustmentType = this.parseOptionalStockAdjustmentType(filters.adjustmentType);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const fromDate = this.parseDate(filters.from, "from");
    const toDate = this.parseDate(filters.to, "to");

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }

    const rows = await this.prisma.stockAdjustment.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(status ? { status } : {}),
        ...(adjustmentType ? { adjustment_type: adjustmentType } : {}),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(fromDate || toDate
          ? {
              created_at: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {})
              }
            }
          : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } },
        line_items: true
      },
      orderBy: { created_at: "desc" },
      take: 300
    });

    const reportRows = rows.map((row) => {
      const lineCount = row.line_items.length;
      const varianceTotal = row.line_items.reduce((sum, line) => sum + line.variance, 0);
      const increaseTotal = row.line_items
        .filter((line) => line.variance > 0)
        .reduce((sum, line) => sum + line.variance, 0);
      const decreaseTotal = row.line_items
        .filter((line) => line.variance < 0)
        .reduce((sum, line) => sum + Math.abs(line.variance), 0);

      return {
        id: row.id,
        adjustment_number: row.adjustment_number,
        status: row.status,
        adjustment_type: row.adjustment_type,
        reason: row.reason,
        branch_id: row.branch_id,
        branch_name: row.branch.name,
        line_count: lineCount,
        variance_total: varianceTotal,
        increase_total: increaseTotal,
        decrease_total: decreaseTotal,
        created_at: row.created_at,
        applied_at: row.applied_at
      };
    });

    const summary = {
      total_adjustments: reportRows.length,
      net_variance_total: reportRows.reduce((sum, row) => sum + row.variance_total, 0),
      increase_total: reportRows.reduce((sum, row) => sum + row.increase_total, 0),
      decrease_total: reportRows.reduce((sum, row) => sum + row.decrease_total, 0),
      by_status: reportRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1;
        return acc;
      }, {})
    };

    return {
      summary,
      rows: reportRows,
      generated_at: new Date().toISOString()
    };
  }

  async receiptFulfillmentReport(filters: ReceiptReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const status = this.parseOptionalGoodsReceiptStatus(filters.status);
    const supplierId = filters.supplierId ? this.parseRequiredUuid(filters.supplierId, "supplierId") : undefined;
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const fromDate = this.parseDate(filters.from, "from");
    const toDate = this.parseDate(filters.to, "to");

    if (supplierId) {
      await this.validateSupplierScope(supplierId, user);
    }
    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }

    const rows = await this.prisma.goodsReceipt.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(status ? { status } : {}),
        ...(supplierId ? { supplier_id: supplierId } : {}),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(fromDate || toDate
          ? {
              received_date: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {})
              }
            }
          : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true, supplier_code: true } },
        line_items: true
      },
      orderBy: { created_at: "desc" },
      take: 300
    });

    const reportRows = rows.map((row) => {
      const orderedQty = row.line_items.reduce((sum, line) => sum + line.ordered_qty, 0);
      const receivedQty = row.line_items.reduce((sum, line) => sum + line.received_qty, 0);
      const rejectedQty = row.line_items.reduce((sum, line) => sum + line.rejected_qty, 0);
      const remainingQty = row.line_items.reduce((sum, line) => sum + line.remaining_qty, 0);
      const fillRatePct = orderedQty > 0 ? Number(((receivedQty / orderedQty) * 100).toFixed(2)) : 0;
      return {
        id: row.id,
        receipt_number: row.receipt_number,
        status: row.status,
        branch_id: row.branch_id,
        branch_name: row.branch.name,
        supplier_id: row.supplier_id,
        supplier_name: row.supplier?.name ?? null,
        ordered_qty_total: orderedQty,
        received_qty_total: receivedQty,
        rejected_qty_total: rejectedQty,
        remaining_qty_total: remainingQty,
        fill_rate_pct: fillRatePct,
        received_date: row.received_date,
        created_at: row.created_at
      };
    });

    const summary = {
      total_receipts: reportRows.length,
      ordered_qty_total: reportRows.reduce((sum, row) => sum + row.ordered_qty_total, 0),
      received_qty_total: reportRows.reduce((sum, row) => sum + row.received_qty_total, 0),
      rejected_qty_total: reportRows.reduce((sum, row) => sum + row.rejected_qty_total, 0),
      remaining_qty_total: reportRows.reduce((sum, row) => sum + row.remaining_qty_total, 0),
      by_status: reportRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1;
        return acc;
      }, {})
    };

    return {
      summary,
      rows: reportRows,
      generated_at: new Date().toISOString()
    };
  }

  async stockLossReport(filters: StockLossReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const fromDate = this.parseDate(filters.from, "from");
    const toDate = this.parseDate(filters.to, "to");
    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }

    const damagedReturns = await this.prisma.stockReturnLine.findMany({
      where: {
        damaged: true,
        stock_return: {
          organization_id: user.organizationId,
          ...(filters.includeDeleted ? {} : { deleted_at: null }),
          ...(branchId
            ? {
                OR: [{ source_branch_id: branchId }, { destination_branch_id: branchId }]
              }
            : {}),
          ...(user.branchId
            ? {
                OR: [{ source_branch_id: user.branchId }, { destination_branch_id: user.branchId }]
              }
            : {}),
          ...(fromDate || toDate
            ? {
                processed_date: {
                  ...(fromDate ? { gte: fromDate } : {}),
                  ...(toDate ? { lte: toDate } : {})
                }
              }
            : {})
        }
      },
      include: {
        item: { select: { id: true, name: true, sku: true } },
        stock_return: {
          select: {
            id: true,
            return_number: true,
            processed_date: true,
            source_branch_id: true,
            destination_branch_id: true
          }
        }
      },
      take: 500
    });

    const decreaseAdjustments = await this.prisma.stockAdjustmentLine.findMany({
      where: {
        variance: { lt: 0 },
        stock_adjustment: {
          organization_id: user.organizationId,
          adjustment_type: StockAdjustmentType.DECREASE,
          ...(filters.includeDeleted ? {} : { deleted_at: null }),
          ...(branchId ? { branch_id: branchId } : {}),
          ...(user.branchId ? { branch_id: user.branchId } : {}),
          ...(fromDate || toDate
            ? {
                created_at: {
                  ...(fromDate ? { gte: fromDate } : {}),
                  ...(toDate ? { lte: toDate } : {})
                }
              }
            : {})
        }
      },
      include: {
        item: { select: { id: true, name: true, sku: true } },
        stock_adjustment: {
          select: {
            id: true,
            adjustment_number: true,
            reason: true,
            created_at: true,
            branch_id: true
          }
        }
      },
      take: 500
    });

    const returnRows = damagedReturns.map((row) => ({
      source: "RETURN_DAMAGED",
      reference_number: row.stock_return.return_number,
      item_id: row.item_id,
      item_name: row.item.name,
      sku: row.item.sku,
      quantity_lost: row.quantity,
      reason: row.condition ?? "damaged return",
      occurred_at: row.stock_return.processed_date,
      branch_id: row.stock_return.destination_branch_id ?? row.stock_return.source_branch_id
    }));

    const adjustmentRows = decreaseAdjustments.map((row) => ({
      source: "ADJUSTMENT_DECREASE",
      reference_number: row.stock_adjustment.adjustment_number,
      item_id: row.item_id,
      item_name: row.item.name,
      sku: row.item.sku,
      quantity_lost: Math.abs(row.variance),
      reason: row.stock_adjustment.reason ?? "stock decrease",
      occurred_at: row.stock_adjustment.created_at,
      branch_id: row.stock_adjustment.branch_id
    }));

    const rows = [...returnRows, ...adjustmentRows].sort(
      (a, b) => (new Date(b.occurred_at ?? 0).getTime() || 0) - (new Date(a.occurred_at ?? 0).getTime() || 0)
    );
    const summary = {
      total_events: rows.length,
      total_quantity_lost: rows.reduce((sum, row) => sum + row.quantity_lost, 0),
      by_source: rows.reduce<Record<string, number>>((acc, row) => {
        acc[row.source] = (acc[row.source] ?? 0) + row.quantity_lost;
        return acc;
      }, {})
    };

    return {
      summary,
      rows,
      generated_at: new Date().toISOString()
    };
  }

  async stockValuationReport(filters: StockValuationReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const itemId = filters.itemId ? this.parseRequiredUuid(filters.itemId, "itemId") : undefined;

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (itemId) {
      await this.validateItemScope(itemId, user);
    }

    const rows = await this.prisma.inventoryStock.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(itemId ? { item_id: itemId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true, cost_price: true } }
      },
      orderBy: [{ branch_id: "asc" }, { item_id: "asc" }],
      take: 500
    });

    const reportRows = rows.map((row) => {
      const quantityOnHand = row.quantity_on_hand ?? 0;
      const unitCost = Number(row.item.cost_price ?? 0);
      const valuation = Number((quantityOnHand * unitCost).toFixed(2));
      return {
        branch_id: row.branch_id,
        branch_name: row.branch?.name ?? null,
        item_id: row.item_id,
        item_name: row.item.name,
        sku: row.item.sku,
        quantity_on_hand: quantityOnHand,
        unit_cost: unitCost,
        stock_valuation: valuation
      };
    });

    const summary = {
      total_rows: reportRows.length,
      total_stock_valuation: Number(reportRows.reduce((sum, row) => sum + row.stock_valuation, 0).toFixed(2)),
      by_branch: reportRows.reduce<Record<string, number>>((acc, row) => {
        const key = row.branch_name ?? row.branch_id;
        acc[key] = Number(((acc[key] ?? 0) + row.stock_valuation).toFixed(2));
        return acc;
      }, {})
    };

    return {
      summary,
      rows: reportRows,
      generated_at: new Date().toISOString()
    };
  }

  async fastSlowMoverReport(filters: FastSlowMoverReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const fromDate = this.parseDate(filters.from, "from");
    const toDate = this.parseDate(filters.to, "to");
    const minMovements = this.parseInteger(filters.minMovements, "minMovements", 1);

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (minMovements < 1) {
      throw new BadRequestException("minMovements must be at least 1");
    }

    const rows = await this.prisma.inventoryMovement.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(fromDate || toDate
          ? {
              occurred_at: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {})
              }
            }
          : {}),
        ...(branchId
          ? {
              OR: [{ branch_id: branchId }, { source_branch_id: branchId }, { destination_branch_id: branchId }]
            }
          : {}),
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
      include: {
        item: { select: { id: true, name: true, sku: true } }
      },
      take: 2000
    });

    const movementMap = new Map<
      string,
      { item_id: string; item_name: string; sku: string; movement_count: number; total_quantity: number }
    >();

    for (const row of rows) {
      const existing = movementMap.get(row.item_id) ?? {
        item_id: row.item_id,
        item_name: row.item.name,
        sku: row.item.sku,
        movement_count: 0,
        total_quantity: 0
      };
      existing.movement_count += 1;
      existing.total_quantity += row.quantity;
      movementMap.set(row.item_id, existing);
    }

    const aggregated = [...movementMap.values()].filter((row) => row.movement_count >= minMovements);
    const sorted = aggregated.sort((a, b) => b.movement_count - a.movement_count || b.total_quantity - a.total_quantity);
    const fastMovers = sorted.slice(0, 20);
    const slowMovers = [...sorted].reverse().slice(0, 20);

    return {
      summary: {
        item_count: aggregated.length,
        total_movements: aggregated.reduce((sum, row) => sum + row.movement_count, 0),
        total_quantity_moved: aggregated.reduce((sum, row) => sum + row.total_quantity, 0)
      },
      fast_movers: fastMovers,
      slow_movers: slowMovers,
      generated_at: new Date().toISOString()
    };
  }

  async supplierFulfillmentReport(filters: SupplierFulfillmentReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const supplierId = filters.supplierId ? this.parseRequiredUuid(filters.supplierId, "supplierId") : undefined;
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const fromDate = this.parseDate(filters.from, "from");
    const toDate = this.parseDate(filters.to, "to");

    if (supplierId) {
      await this.validateSupplierScope(supplierId, user);
    }
    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }

    const rows = await this.prisma.goodsReceipt.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(supplierId ? { supplier_id: supplierId } : {}),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(fromDate || toDate
          ? {
              received_date: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {})
              }
            }
          : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        supplier: { select: { id: true, name: true, supplier_code: true } },
        line_items: true
      },
      take: 1000
    });

    const supplierMap = new Map<
      string,
      {
        supplier_id: string;
        supplier_name: string | null;
        supplier_code: string | null;
        receipt_count: number;
        ordered_qty_total: number;
        received_qty_total: number;
        rejected_qty_total: number;
        remaining_qty_total: number;
      }
    >();

    for (const receipt of rows) {
      const supplierKey = receipt.supplier_id ?? "UNASSIGNED";
      const orderedQty = receipt.line_items.reduce((sum, line) => sum + line.ordered_qty, 0);
      const receivedQty = receipt.line_items.reduce((sum, line) => sum + line.received_qty, 0);
      const rejectedQty = receipt.line_items.reduce((sum, line) => sum + line.rejected_qty, 0);
      const remainingQty = receipt.line_items.reduce((sum, line) => sum + line.remaining_qty, 0);

      const current = supplierMap.get(supplierKey) ?? {
        supplier_id: receipt.supplier_id ?? "UNASSIGNED",
        supplier_name: receipt.supplier?.name ?? null,
        supplier_code: receipt.supplier?.supplier_code ?? null,
        receipt_count: 0,
        ordered_qty_total: 0,
        received_qty_total: 0,
        rejected_qty_total: 0,
        remaining_qty_total: 0
      };

      current.receipt_count += 1;
      current.ordered_qty_total += orderedQty;
      current.received_qty_total += receivedQty;
      current.rejected_qty_total += rejectedQty;
      current.remaining_qty_total += remainingQty;
      supplierMap.set(supplierKey, current);
    }

    const reportRows = [...supplierMap.values()]
      .map((row) => ({
        ...row,
        fulfillment_rate_pct:
          row.ordered_qty_total > 0
            ? Number(((row.received_qty_total / row.ordered_qty_total) * 100).toFixed(2))
            : 0
      }))
      .sort((a, b) => b.fulfillment_rate_pct - a.fulfillment_rate_pct);

    const summary = {
      supplier_count: reportRows.length,
      receipt_count: reportRows.reduce((sum, row) => sum + row.receipt_count, 0),
      ordered_qty_total: reportRows.reduce((sum, row) => sum + row.ordered_qty_total, 0),
      received_qty_total: reportRows.reduce((sum, row) => sum + row.received_qty_total, 0),
      rejected_qty_total: reportRows.reduce((sum, row) => sum + row.rejected_qty_total, 0),
      remaining_qty_total: reportRows.reduce((sum, row) => sum + row.remaining_qty_total, 0)
    };

    return {
      summary,
      rows: reportRows,
      generated_at: new Date().toISOString()
    };
  }

  async operationsExceptionsReport(filters: OperationsExceptionsReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const receiptOverdueDays = this.parseInteger(filters.receiptOverdueDays, "receiptOverdueDays", 2);
    const transferOverdueDays = this.parseInteger(filters.transferOverdueDays, "transferOverdueDays", 2);
    const dispatchOverdueDays = this.parseInteger(filters.dispatchOverdueDays, "dispatchOverdueDays", 2);

    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (receiptOverdueDays < 1 || transferOverdueDays < 1 || dispatchOverdueDays < 1) {
      throw new BadRequestException("overdue day thresholds must be at least 1");
    }

    const now = new Date();
    const receiptCutoff = new Date(now.getTime() - receiptOverdueDays * 24 * 60 * 60 * 1000);
    const transferCutoff = new Date(now.getTime() - transferOverdueDays * 24 * 60 * 60 * 1000);
    const dispatchCutoff = new Date(now.getTime() - dispatchOverdueDays * 24 * 60 * 60 * 1000);

    const overdueReceipts = await this.prisma.goodsReceipt.findMany({
      where: {
        organization_id: user.organizationId,
        status: { in: [GoodsReceiptStatus.DRAFT, GoodsReceiptStatus.PARTIAL] },
        created_at: { lte: receiptCutoff },
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true, supplier_code: true } }
      },
      take: 300
    });

    const overdueTransfers = await this.prisma.stockTransfer.findMany({
      where: {
        organization_id: user.organizationId,
        status: { in: [StockTransferStatus.REQUESTED, StockTransferStatus.APPROVED, StockTransferStatus.DISPATCHED] },
        created_date: { lte: transferCutoff },
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId
          ? {
              OR: [{ source_branch_id: branchId }, { destination_branch_id: branchId }]
            }
          : {}),
        ...(user.branchId
          ? {
              OR: [{ source_branch_id: user.branchId }, { destination_branch_id: user.branchId }]
            }
          : {})
      },
      include: {
        source_branch: { select: { id: true, name: true } },
        destination_branch: { select: { id: true, name: true } }
      },
      take: 300
    });

    const overdueDispatches = await this.prisma.stockDispatch.findMany({
      where: {
        organization_id: user.organizationId,
        status: { in: [DispatchStatus.READY, DispatchStatus.PACKED, DispatchStatus.DISPATCHED] },
        created_at: { lte: dispatchCutoff },
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } }
      },
      take: 300
    });

    const negativeStockRows = await this.prisma.inventoryStock.findMany({
      where: {
        organization_id: user.organizationId,
        quantity_on_hand: { lt: 0 },
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true } }
      },
      take: 300
    });

    return {
      summary: {
        overdue_receipts: overdueReceipts.length,
        overdue_transfers: overdueTransfers.length,
        overdue_dispatches: overdueDispatches.length,
        negative_stock_items: negativeStockRows.length,
        total_exceptions:
          overdueReceipts.length + overdueTransfers.length + overdueDispatches.length + negativeStockRows.length
      },
      overdue_receipts: overdueReceipts,
      overdue_transfers: overdueTransfers,
      overdue_dispatches: overdueDispatches,
      negative_stock_risks: negativeStockRows,
      generated_at: new Date().toISOString()
    };
  }

  async branchSlaReport(filters: BranchSlaReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const slaDays = this.parseInteger(filters.slaDays, "slaDays", 2);
    if (slaDays < 1) {
      throw new BadRequestException("slaDays must be at least 1");
    }
    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }

    const branches = await this.prisma.branch.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { id: branchId } : {}),
        ...(user.branchId ? { id: user.branchId } : {})
      },
      select: {
        id: true,
        name: true
      }
    });
    const branchIds = branches.map((row) => row.id);
    if (branchIds.length === 0) {
      return {
        summary: {
          total_branches: 0,
          receipt_on_time_rate_pct: 0,
          transfer_on_time_rate_pct: 0,
          dispatch_on_time_rate_pct: 0
        },
        rows: [],
        generated_at: new Date().toISOString()
      };
    }

    const receipts = await this.prisma.goodsReceipt.findMany({
      where: {
        organization_id: user.organizationId,
        branch_id: { in: branchIds },
        ...(filters.includeDeleted ? {} : { deleted_at: null })
      },
      select: {
        branch_id: true,
        status: true,
        created_at: true,
        received_date: true
      },
      take: 3000
    });

    const transfers = await this.prisma.stockTransfer.findMany({
      where: {
        organization_id: user.organizationId,
        source_branch_id: { in: branchIds },
        ...(filters.includeDeleted ? {} : { deleted_at: null })
      },
      select: {
        source_branch_id: true,
        status: true,
        created_date: true,
        received_date: true
      },
      take: 3000
    });

    const dispatches = await this.prisma.stockDispatch.findMany({
      where: {
        organization_id: user.organizationId,
        branch_id: { in: branchIds },
        ...(filters.includeDeleted ? {} : { deleted_at: null })
      },
      select: {
        branch_id: true,
        status: true,
        created_at: true,
        dispatch_date: true
      },
      take: 3000
    });

    const now = new Date();
    const rows = branches.map((branch) => {
      const branchReceipts = receipts.filter((row) => row.branch_id === branch.id);
      const branchTransfers = transfers.filter((row) => row.source_branch_id === branch.id);
      const branchDispatches = dispatches.filter((row) => row.branch_id === branch.id);

      const receiptOnTime = branchReceipts.filter((row) => {
        if (!row.received_date) {
          return false;
        }
        const deadline = new Date(row.created_at.getTime() + slaDays * 24 * 60 * 60 * 1000);
        return row.received_date <= deadline;
      }).length;
      const receiptOverdueOpen = branchReceipts.filter((row) => {
        const isOpen = row.status === GoodsReceiptStatus.DRAFT || row.status === GoodsReceiptStatus.PARTIAL;
        if (!isOpen) {
          return false;
        }
        const deadline = new Date(row.created_at.getTime() + slaDays * 24 * 60 * 60 * 1000);
        return deadline <= now;
      }).length;

      const transferOnTime = branchTransfers.filter((row) => {
        if (!row.received_date) {
          return false;
        }
        const deadline = new Date(row.created_date.getTime() + slaDays * 24 * 60 * 60 * 1000);
        return row.received_date <= deadline;
      }).length;
      const transferOverdueOpen = branchTransfers.filter((row) => {
        const isOpen =
          row.status === StockTransferStatus.REQUESTED ||
          row.status === StockTransferStatus.APPROVED ||
          row.status === StockTransferStatus.DISPATCHED;
        if (!isOpen) {
          return false;
        }
        const deadline = new Date(row.created_date.getTime() + slaDays * 24 * 60 * 60 * 1000);
        return deadline <= now;
      }).length;

      const dispatchOnTime = branchDispatches.filter((row) => {
        if (row.status !== DispatchStatus.DELIVERED || !row.dispatch_date) {
          return false;
        }
        const deadline = new Date(row.created_at.getTime() + slaDays * 24 * 60 * 60 * 1000);
        return row.dispatch_date <= deadline;
      }).length;
      const dispatchOverdueOpen = branchDispatches.filter((row) => {
        const isOpen =
          row.status === DispatchStatus.READY ||
          row.status === DispatchStatus.PACKED ||
          row.status === DispatchStatus.DISPATCHED;
        if (!isOpen) {
          return false;
        }
        const deadline = new Date(row.created_at.getTime() + slaDays * 24 * 60 * 60 * 1000);
        return deadline <= now;
      }).length;

      return {
        branch_id: branch.id,
        branch_name: branch.name,
        receipt_total: branchReceipts.length,
        receipt_on_time: receiptOnTime,
        receipt_overdue_open: receiptOverdueOpen,
        receipt_on_time_rate_pct:
          branchReceipts.length > 0 ? Number(((receiptOnTime / branchReceipts.length) * 100).toFixed(2)) : 0,
        transfer_total: branchTransfers.length,
        transfer_on_time: transferOnTime,
        transfer_overdue_open: transferOverdueOpen,
        transfer_on_time_rate_pct:
          branchTransfers.length > 0 ? Number(((transferOnTime / branchTransfers.length) * 100).toFixed(2)) : 0,
        dispatch_total: branchDispatches.length,
        dispatch_on_time: dispatchOnTime,
        dispatch_overdue_open: dispatchOverdueOpen,
        dispatch_on_time_rate_pct:
          branchDispatches.length > 0 ? Number(((dispatchOnTime / branchDispatches.length) * 100).toFixed(2)) : 0
      };
    });

    const summary = {
      total_branches: rows.length,
      receipt_on_time_rate_pct:
        rows.reduce((sum, row) => sum + row.receipt_total, 0) > 0
          ? Number(
              (
                (rows.reduce((sum, row) => sum + row.receipt_on_time, 0) /
                  rows.reduce((sum, row) => sum + row.receipt_total, 0)) *
                100
              ).toFixed(2)
            )
          : 0,
      transfer_on_time_rate_pct:
        rows.reduce((sum, row) => sum + row.transfer_total, 0) > 0
          ? Number(
              (
                (rows.reduce((sum, row) => sum + row.transfer_on_time, 0) /
                  rows.reduce((sum, row) => sum + row.transfer_total, 0)) *
                100
              ).toFixed(2)
            )
          : 0,
      dispatch_on_time_rate_pct:
        rows.reduce((sum, row) => sum + row.dispatch_total, 0) > 0
          ? Number(
              (
                (rows.reduce((sum, row) => sum + row.dispatch_on_time, 0) /
                  rows.reduce((sum, row) => sum + row.dispatch_total, 0)) *
                100
              ).toFixed(2)
            )
          : 0
    };

    return {
      summary,
      rows,
      generated_at: new Date().toISOString()
    };
  }

  async inactiveStockReport(filters: InactiveStockReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }

    const rows = await this.prisma.inventoryStock.findMany({
      where: {
        organization_id: user.organizationId,
        quantity_on_hand: { gt: 0 },
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {}),
        item: {
          status: "INACTIVE"
        }
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            status: true,
            track_inventory: true
          }
        }
      },
      orderBy: [{ branch_id: "asc" }, { quantity_on_hand: "desc" }],
      take: 500
    });

    const reportRows = rows.map((row) => ({
      branch_id: row.branch_id,
      branch_name: row.branch?.name ?? null,
      item_id: row.item_id,
      item_name: row.item.name,
      sku: row.item.sku,
      item_status: row.item.status,
      quantity_on_hand: row.quantity_on_hand,
      available_quantity: row.available_quantity,
      reserved_quantity: row.reserved_quantity,
      in_transit_quantity: row.in_transit_quantity,
      incoming_quantity: row.incoming_quantity,
      last_movement_at: row.last_movement_at
    }));

    const summary = {
      total_rows: reportRows.length,
      total_quantity_on_hand: reportRows.reduce((sum, row) => sum + row.quantity_on_hand, 0),
      total_available_quantity: reportRows.reduce((sum, row) => sum + row.available_quantity, 0),
      affected_branches: [...new Set(reportRows.map((row) => row.branch_id))].length
    };

    return {
      summary,
      rows: reportRows,
      generated_at: new Date().toISOString()
    };
  }

  async shortageReport(filters: ShortageReportFilters, scope?: UserScope) {
    const user = this.requireScope(scope);
    const branchId = filters.branchId ? this.parseRequiredUuid(filters.branchId, "branchId") : undefined;
    const supplierId = filters.supplierId ? this.parseRequiredUuid(filters.supplierId, "supplierId") : undefined;
    if (branchId) {
      await this.validateBranchScope(branchId, "branchId", user);
    }
    if (supplierId) {
      await this.validateSupplierScope(supplierId, user);
    }

    const rules = await this.prisma.reorderRule.findMany({
      where: {
        organization_id: user.organizationId,
        is_active: true,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        ...(branchId ? { branch_id: branchId } : {}),
        ...(supplierId ? { preferred_supplier_id: supplierId } : {}),
        ...(user.branchId ? { branch_id: user.branchId } : {})
      },
      include: {
        branch: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true } },
        preferred_supplier: { select: { id: true, name: true, supplier_code: true } }
      },
      take: 1000
    });

    if (rules.length === 0) {
      return {
        summary: {
          total_rows: 0,
          shortage_item_count: 0,
          total_shortage_quantity: 0,
          total_suggested_reorder_quantity: 0
        },
        rows: [],
        generated_at: new Date().toISOString()
      };
    }

    const stockKeys = rules.map((row) => ({ branch_id: row.branch_id, item_id: row.item_id }));
    const stocks = await this.prisma.inventoryStock.findMany({
      where: {
        organization_id: user.organizationId,
        ...(filters.includeDeleted ? {} : { deleted_at: null }),
        OR: stockKeys.map((row) => ({
          branch_id: row.branch_id,
          item_id: row.item_id
        }))
      },
      select: {
        branch_id: true,
        item_id: true,
        quantity_on_hand: true,
        available_quantity: true
      }
    });
    const stockMap = new Map(stocks.map((row) => [`${row.branch_id}:${row.item_id}`, row]));

    const rows = rules
      .map((rule) => {
        const key = `${rule.branch_id}:${rule.item_id}`;
        const stock = stockMap.get(key);
        const currentQty = stock?.quantity_on_hand ?? 0;
        const availableQty = stock?.available_quantity ?? currentQty;
        const reorderLevel = rule.reorder_level;
        const shortageQty = Math.max(reorderLevel - currentQty, 0);
        const suggestedQty = shortageQty > 0 ? Math.max(shortageQty, rule.reorder_quantity) : 0;
        return {
          branch_id: rule.branch_id,
          branch_name: rule.branch.name,
          item_id: rule.item_id,
          item_name: rule.item.name,
          sku: rule.item.sku,
          supplier_id: rule.preferred_supplier_id,
          supplier_name: rule.preferred_supplier?.name ?? null,
          reorder_level: reorderLevel,
          reorder_quantity: rule.reorder_quantity,
          current_quantity_on_hand: currentQty,
          current_available_quantity: availableQty,
          shortage_quantity: shortageQty,
          suggested_reorder_quantity: suggestedQty,
          needs_restock: shortageQty > 0
        };
      })
      .filter((row) => row.needs_restock)
      .sort((a, b) => b.shortage_quantity - a.shortage_quantity);

    const summary = {
      total_rows: rows.length,
      shortage_item_count: rows.length,
      total_shortage_quantity: rows.reduce((sum, row) => sum + row.shortage_quantity, 0),
      total_suggested_reorder_quantity: rows.reduce((sum, row) => sum + row.suggested_reorder_quantity, 0)
    };

    return {
      summary,
      rows,
      generated_at: new Date().toISOString()
    };
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
        destination_branch: { select: { id: true, name: true } },
        source_location: { select: { id: true, code: true, name: true } },
        destination_location: { select: { id: true, code: true, name: true } }
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
        destination_branch: movement.destination_branch,
        source_location: movement.source_location,
        destination_location: movement.destination_location
      })),
      alerts_and_exceptions: openAlerts,
      generated_at: new Date().toISOString()
    };
  }
}
