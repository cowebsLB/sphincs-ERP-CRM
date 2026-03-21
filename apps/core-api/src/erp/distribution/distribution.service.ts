import { Injectable, NotFoundException } from "@nestjs/common";
import { DispatchStatus, GoodsReceiptStatus, StockTransferStatus } from "@prisma/client";
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

@Injectable()
export class DistributionService {
  constructor(private readonly prisma: PrismaService) {}

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
