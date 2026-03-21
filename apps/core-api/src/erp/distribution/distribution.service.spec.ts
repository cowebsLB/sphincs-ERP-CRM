import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DistributionService } from "./distribution.service";

describe("DistributionService", () => {
  const BRANCH_1 = "11111111-1111-4111-8111-111111111111";
  const BRANCH_2 = "22222222-2222-4222-8222-222222222222";

  const createPrismaMock = () => ({
    inventoryStock: {
      findMany: jest.fn().mockResolvedValue([
        {
          branch_id: "branch-1",
          quantity_on_hand: 12,
          in_transit_quantity: 3,
          incoming_quantity: 5,
          damaged_quantity: 1,
          last_movement_at: new Date("2026-03-21T10:00:00.000Z"),
          item: {
            name: "Widget A",
            sku: "W-A",
            reorder_level: 20,
            track_inventory: true,
            deleted_at: null
          }
        },
        {
          branch_id: "branch-1",
          quantity_on_hand: 0,
          in_transit_quantity: 0,
          incoming_quantity: 2,
          damaged_quantity: 0,
          last_movement_at: new Date("2026-03-21T09:00:00.000Z"),
          item: {
            name: "Widget B",
            sku: "W-B",
            reorder_level: 5,
            track_inventory: true,
            deleted_at: null
          }
        }
      ]),
      updateMany: jest.fn()
    },
    goodsReceipt: {
      count: jest.fn().mockResolvedValue(4),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: "gr-1",
        receipt_number: "GR-20260321120000-ABCD",
        status: "PARTIAL",
        line_items: []
      })
    },
    stockTransfer: {
      count: jest.fn().mockResolvedValue(3),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: "tr-1",
        transfer_number: "TR-20260321120000-ABCD",
        status: "DRAFT",
        line_items: []
      })
    },
    stockDispatch: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: "disp-1",
        dispatch_number: "DISP-20260321120000-ABCD",
        status: "DRAFT",
        line_items: []
      })
    },
    stockAdjustment: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: "adj-1",
        adjustment_number: "ADJ-20260321120000-ABCD",
        status: "DRAFT",
        line_items: []
      })
    },
    stockAlert: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "a1",
          alert_type: "LOW_STOCK",
          severity: "HIGH",
          title: "Low stock on W-A",
          message: "Reorder recommended",
          detected_at: new Date("2026-03-21T08:00:00.000Z"),
          branch: { id: "branch-1", name: "Main" },
          item: { id: "item-1", name: "Widget A", sku: "W-A" }
        }
      ])
    },
    inventoryMovement: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "m1",
          movement_type: "TRANSFER_IN",
          quantity: 10,
          unit: "piece",
          status: "POSTED",
          notes: "Transfer completed",
          occurred_at: new Date("2026-03-21T10:10:00.000Z"),
          item: { id: "item-1", name: "Widget A", sku: "W-A" },
          source_branch_id: BRANCH_2,
          destination_branch_id: BRANCH_1,
          source_branch: { id: BRANCH_2, name: "North" },
          destination_branch: { id: BRANCH_1, name: "Main" }
        }
      ]),
      create: jest.fn().mockResolvedValue({
        id: "m2",
        movement_type: "TRANSFER_OUT",
        quantity: 5,
        unit: "piece",
        status: "POSTED"
      })
    },
    branch: {
      findMany: jest.fn().mockResolvedValue([{ id: BRANCH_1, name: "Main" }]),
      findFirst: jest.fn().mockImplementation(async (args: { where: { id?: string } }) => {
        const branchId = args?.where?.id;
        if (branchId === BRANCH_1 || branchId === BRANCH_2) {
          return { id: branchId, organization_id: "org-1", deleted_at: null };
        }
        return null;
      })
    },
    item: {
      findFirst: jest.fn().mockResolvedValue({ id: "item-1", organization_id: "org-1", branch_id: BRANCH_1 })
    },
    supplier: {
      findFirst: jest.fn().mockResolvedValue({ id: "sup-1", organization_id: "org-1", branch_id: BRANCH_1 })
    },
    purchaseOrder: {
      findFirst: jest.fn().mockResolvedValue({ id: "po-1", organization_id: "org-1", branch_id: BRANCH_1 })
    },
    stockReturnLine: {
      findMany: jest.fn().mockResolvedValue([
        {
          quantity: 2,
          stock_return: {
            source_branch_id: BRANCH_1,
            destination_branch_id: BRANCH_2
          }
        }
      ])
    }
  });

  it("builds distribution dashboard metrics from scoped data", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.dashboard({
      id: "user-1",
      organizationId: "org-1",
      branchId: BRANCH_1
    });

    expect(result.metrics).toEqual(
      expect.arrayContaining([
        { label: "total_stock_on_hand", value: 12 },
        { label: "low_stock_items", value: 1 },
        { label: "out_of_stock_items", value: 1 },
        { label: "incoming_stock", value: 7 },
        { label: "pending_receipts", value: 4 },
        { label: "pending_transfers", value: 3 },
        { label: "pending_dispatches", value: 2 },
        { label: "damaged_returned_stock", value: 3 }
      ])
    );
    expect(result.branch_stock_summary).toHaveLength(1);
    expect(result.alerts_and_exceptions).toHaveLength(1);
    expect(result.recent_inventory_activity).toHaveLength(1);
  });

  it("creates movement records with branch-scoped validation", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createMovement(
      {
        movement_type: "TRANSFER_OUT",
        item_id: "11111111-1111-4111-8111-111111111111",
        quantity: 5,
        source_branch_id: BRANCH_1
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movement_type: "TRANSFER_OUT",
          quantity: 5,
          organization_id: "org-1",
          performed_by: "user-1"
        })
      })
    );
    expect(result.id).toBe("m2");
  });

  it("rejects movement create when quantity is invalid", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.createMovement(
        {
          movement_type: "TRANSFER_OUT",
          item_id: "11111111-1111-4111-8111-111111111111",
          quantity: 0,
          source_branch_id: BRANCH_1
        },
        {
          id: "user-1",
          organizationId: "org-1",
          branchId: BRANCH_1
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("lists movements with scoped filters", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.listMovements(
      {
        movementType: "TRANSFER_IN",
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.inventoryMovement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          movement_type: "TRANSFER_IN",
          deleted_at: null
        })
      })
    );
  });

  it("creates goods receipts with partial status when quantities are incomplete", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createReceipt(
      {
        branch_id: BRANCH_1,
        supplier_id: "11111111-1111-4111-8111-111111111111",
        purchase_order_id: "22222222-2222-4222-8222-222222222222",
        line_items: [
          {
            item_id: "33333333-3333-4333-8333-333333333333",
            ordered_qty: 10,
            received_qty: 6,
            rejected_qty: 1
          }
        ]
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.goodsReceipt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organization_id: "org-1",
          branch_id: BRANCH_1,
          status: "PARTIAL"
        })
      })
    );
    expect(result.id).toBe("gr-1");
  });

  it("lists receipts with status filters", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.listReceipts(
      {
        status: "PARTIAL",
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.goodsReceipt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          status: "PARTIAL",
          branch_id: BRANCH_1,
          deleted_at: null
        })
      })
    );
  });

  it("rejects receipt lines when received and rejected exceed ordered qty", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.createReceipt(
        {
          branch_id: BRANCH_1,
          line_items: [
            {
              item_id: "33333333-3333-4333-8333-333333333333",
              ordered_qty: 10,
              received_qty: 8,
              rejected_qty: 3
            }
          ]
        },
        {
          id: "user-1",
          organizationId: "org-1",
          branchId: BRANCH_1
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates stock transfers with scoped branch checks", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createTransfer(
      {
        source_branch_id: BRANCH_1,
        destination_branch_id: BRANCH_2,
        line_items: [
          {
            item_id: "33333333-3333-4333-8333-333333333333",
            quantity_requested: 10,
            quantity_sent: 8,
            quantity_received: 5
          }
        ]
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockTransfer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organization_id: "org-1",
          source_branch_id: BRANCH_1,
          destination_branch_id: BRANCH_2,
          requested_by: "user-1"
        })
      })
    );
    expect(result.id).toBe("tr-1");
  });

  it("lists transfers with status filter", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.listTransfers(
      {
        status: "REQUESTED",
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockTransfer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          status: "REQUESTED",
          deleted_at: null
        })
      })
    );
  });

  it("rejects transfer when source and destination are identical", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.createTransfer(
        {
          source_branch_id: BRANCH_1,
          destination_branch_id: BRANCH_1,
          line_items: [
            {
              item_id: "33333333-3333-4333-8333-333333333333",
              quantity_requested: 10
            }
          ]
        },
        {
          id: "user-1",
          organizationId: "org-1",
          branchId: BRANCH_1
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates stock adjustments with line validation", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createAdjustment(
      {
        branch_id: BRANCH_1,
        adjustment_type: "DECREASE",
        reason: "damage",
        line_items: [
          {
            item_id: "33333333-3333-4333-8333-333333333333",
            previous_qty: 20,
            adjusted_qty: 15,
            variance: -5
          }
        ]
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockAdjustment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organization_id: "org-1",
          branch_id: BRANCH_1,
          adjustment_type: "DECREASE",
          reason: "damage"
        })
      })
    );
    expect(result.id).toBe("adj-1");
  });

  it("lists adjustments with filters", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.listAdjustments(
      {
        status: "APPROVED",
        adjustmentType: "DECREASE",
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockAdjustment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          status: "APPROVED",
          adjustment_type: "DECREASE",
          branch_id: BRANCH_1,
          deleted_at: null
        })
      })
    );
  });

  it("rejects adjustments when variance does not match qty delta", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.createAdjustment(
        {
          branch_id: BRANCH_1,
          adjustment_type: "DECREASE",
          reason: "damage",
          line_items: [
            {
              item_id: "33333333-3333-4333-8333-333333333333",
              previous_qty: 20,
              adjusted_qty: 15,
              variance: -3
            }
          ]
        },
        {
          id: "user-1",
          organizationId: "org-1",
          branchId: BRANCH_1
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates dispatch records with line validation", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createDispatch(
      {
        branch_id: BRANCH_1,
        destination: "Customer Beirut",
        status: "READY",
        line_items: [
          {
            item_id: "33333333-3333-4333-8333-333333333333",
            quantity: 4
          }
        ]
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockDispatch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organization_id: "org-1",
          branch_id: BRANCH_1,
          destination: "Customer Beirut",
          status: "READY"
        })
      })
    );
    expect(result.id).toBe("disp-1");
  });

  it("lists dispatches with status filter", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.listDispatches(
      {
        status: "DISPATCHED",
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockDispatch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          status: "DISPATCHED",
          branch_id: BRANCH_1,
          deleted_at: null
        })
      })
    );
  });

  it("rejects dispatch line with non-positive quantity", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.createDispatch(
        {
          branch_id: BRANCH_1,
          destination: "Customer Beirut",
          line_items: [
            {
              item_id: "33333333-3333-4333-8333-333333333333",
              quantity: 0
            }
          ]
        },
        {
          id: "user-1",
          organizationId: "org-1",
          branchId: BRANCH_1
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("enforces user scope for dashboard access", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);
    await expect(service.dashboard(undefined)).rejects.toBeInstanceOf(NotFoundException);
  });
});
