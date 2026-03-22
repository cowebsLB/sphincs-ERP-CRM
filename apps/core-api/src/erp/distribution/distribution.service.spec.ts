import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DistributionService } from "./distribution.service";

describe("DistributionService", () => {
  const BRANCH_1 = "11111111-1111-4111-8111-111111111111";
  const BRANCH_2 = "22222222-2222-4222-8222-222222222222";
  const LOCATION_PARENT_BRANCH_1 = "33333333-3333-4333-8333-333333333333";
  const LOCATION_PARENT_BRANCH_2 = "44444444-4444-4444-8444-444444444444";

  const createPrismaMock = () => ({
    inventoryStock: {
      findMany: jest.fn().mockResolvedValue([
        {
          item_id: "item-1",
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
          item_id: "item-2",
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
      findFirst: jest.fn().mockResolvedValue({
        id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        organization_id: "org-1",
        branch_id: BRANCH_1
      }),
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
      findFirst: jest.fn().mockResolvedValue({
        id: "tr-1",
        status: "DRAFT",
        source_branch_id: BRANCH_1,
        destination_branch_id: BRANCH_2,
        status_history: []
      }),
      create: jest.fn().mockResolvedValue({
        id: "tr-1",
        transfer_number: "TR-20260321120000-ABCD",
        status: "DRAFT",
        line_items: []
      }),
      update: jest.fn().mockResolvedValue({
        id: "tr-1",
        transfer_number: "TR-20260321120000-ABCD",
        status: "REQUESTED",
        line_items: []
      })
    },
    stockDispatch: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({
        id: "disp-1",
        status: "DRAFT",
        branch_id: BRANCH_1
      }),
      create: jest.fn().mockResolvedValue({
        id: "disp-1",
        dispatch_number: "DISP-20260321120000-ABCD",
        status: "DRAFT",
        line_items: []
      }),
      update: jest.fn().mockResolvedValue({
        id: "disp-1",
        dispatch_number: "DISP-20260321120000-ABCD",
        status: "READY",
        line_items: []
      })
    },
    stockAdjustment: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({
        id: "adj-1",
        status: "DRAFT",
        branch_id: BRANCH_1
      }),
      create: jest.fn().mockResolvedValue({
        id: "adj-1",
        adjustment_number: "ADJ-20260321120000-ABCD",
        status: "DRAFT",
        line_items: []
      }),
      update: jest.fn().mockResolvedValue({
        id: "adj-1",
        adjustment_number: "ADJ-20260321120000-ABCD",
        status: "SUBMITTED",
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
      ]),
      findFirst: jest.fn().mockResolvedValue({
        id: "a1",
        branch_id: BRANCH_1,
        status: "OPEN"
      }),
      update: jest.fn().mockResolvedValue({
        id: "a1",
        status: "RESOLVED",
        branch: { id: BRANCH_1, name: "Main" },
        item: { id: "item-1", name: "Widget A", sku: "W-A" }
      })
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
    warehouseLocation: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "55555555-5555-4555-8555-555555555555",
          organization_id: "org-1",
          branch_id: BRANCH_1,
          parent_location_id: LOCATION_PARENT_BRANCH_1,
          code: "BIN-A1",
          name: "Bin A1",
          location_type: "BIN",
          is_active: true,
          branch: { id: BRANCH_1, name: "Main" },
          parent: { id: LOCATION_PARENT_BRANCH_1, code: "ZONE-A", name: "Zone A" }
        }
      ]),
      findFirst: jest.fn().mockImplementation(
        async (args: { where: { id?: string; branch_id?: string; code?: string; organization_id?: string } }) => {
          const where = args?.where ?? {};
          if (where.id === LOCATION_PARENT_BRANCH_1) {
            return {
              id: LOCATION_PARENT_BRANCH_1,
              organization_id: "org-1",
              branch_id: BRANCH_1,
              code: "ZONE-A",
              name: "Zone A",
              deleted_at: null
            };
          }
          if (where.id === LOCATION_PARENT_BRANCH_2) {
            return {
              id: LOCATION_PARENT_BRANCH_2,
              organization_id: "org-1",
              branch_id: BRANCH_2,
              code: "ZONE-N",
              name: "Zone North",
              deleted_at: null
            };
          }
          if (where.id === "77777777-7777-4777-8777-777777777777") {
            return {
              id: "77777777-7777-4777-8777-777777777777",
              organization_id: "org-1",
              branch_id: BRANCH_1,
              code: "BIN-A2",
              name: "Bin A2",
              is_active: true,
              deleted_at: null
            };
          }
          if (
            where.organization_id === "org-1" &&
            where.branch_id === BRANCH_1 &&
            where.code === "BIN-DUPLICATE"
          ) {
            return {
              id: "66666666-6666-4666-8666-666666666666",
              organization_id: "org-1",
              branch_id: BRANCH_1,
              code: "BIN-DUPLICATE",
              name: "Existing Bin",
              deleted_at: null
            };
          }
          return null;
        }
      ),
      create: jest.fn().mockResolvedValue({
        id: "77777777-7777-4777-8777-777777777777",
        code: "BIN-A2",
        name: "Bin A2",
        location_type: "BIN",
        is_active: true,
        branch: { id: BRANCH_1, name: "Main" },
        parent: { id: LOCATION_PARENT_BRANCH_1, code: "ZONE-A", name: "Zone A" }
      }),
      update: jest.fn().mockResolvedValue({
        id: "77777777-7777-4777-8777-777777777777",
        code: "BIN-A2",
        is_active: false,
        branch: { id: BRANCH_1, name: "Main" },
        parent: { id: LOCATION_PARENT_BRANCH_1, code: "ZONE-A", name: "Zone A" }
      })
    },
    inventoryLot: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "88888888-8888-4888-8888-888888888888",
          branch_id: BRANCH_1,
          item_id: "item-1",
          status: "ACTIVE",
          batch_number: "BATCH-001",
          branch: { id: BRANCH_1, name: "Main" },
          item: { id: "item-1", name: "Widget A", sku: "W-A" },
          supplier: { id: "sup-1", name: "Supplier A", supplier_code: "SUP-A" }
        }
      ]),
      findFirst: jest.fn().mockImplementation(async (args: { where: { id?: string } }) => {
        const lotId = args?.where?.id;
        if (lotId === "88888888-8888-4888-8888-888888888888") {
          return {
            id: lotId,
            organization_id: "org-1",
            branch_id: BRANCH_1,
            item_id: "33333333-3333-4333-8333-333333333333",
            status: "ACTIVE",
            deleted_at: null
          };
        }
        return null;
      }),
      create: jest.fn().mockResolvedValue({
        id: "99999999-9999-4999-8999-999999999999",
        branch_id: BRANCH_1,
        item_id: "33333333-3333-4333-8333-333333333333",
        status: "ACTIVE"
      }),
      update: jest.fn().mockResolvedValue({
        id: "99999999-9999-4999-8999-999999999999",
        branch_id: BRANCH_1,
        item_id: "33333333-3333-4333-8333-333333333333",
        status: "HOLD"
      })
    },
    inventoryLotBalance: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        branch_id: BRANCH_1,
        item_id: "33333333-3333-4333-8333-333333333333",
        lot_id: "88888888-8888-4888-8888-888888888888",
        quantity_on_hand: 10,
        available_quantity: 8
      })
    },
    stockDispatchLine: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          item_id: "33333333-3333-4333-8333-333333333333"
        }
      ])
    },
    dispatchPickJob: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        branch_id: BRANCH_1,
        status: "DRAFT"
      }),
      create: jest.fn().mockResolvedValue({
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        status: "DRAFT"
      }),
      update: jest.fn().mockResolvedValue({
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        status: "IN_PROGRESS"
      })
    },
    dispatchPackJob: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        branch_id: BRANCH_1,
        status: "DRAFT"
      }),
      create: jest.fn().mockResolvedValue({
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        status: "DRAFT"
      }),
      update: jest.fn().mockResolvedValue({
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        status: "IN_PROGRESS"
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
    stockReturn: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({
        id: "ret-1",
        status: "DRAFT",
        source_branch_id: BRANCH_1,
        destination_branch_id: BRANCH_2
      }),
      create: jest.fn().mockResolvedValue({
        id: "ret-1",
        return_number: "RET-20260321120000-ABCD",
        status: "DRAFT",
        line_items: []
      }),
      update: jest.fn().mockResolvedValue({
        id: "ret-1",
        return_number: "RET-20260321120000-ABCD",
        status: "RECEIVED",
        line_items: []
      })
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
    },
    stockAdjustmentLine: {
      findMany: jest.fn().mockResolvedValue([])
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({
        id: "audit-1"
      })
    },
    inventoryReservation: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: "res-1",
        reserved_quantity: 3,
        status: "ACTIVE"
      })
    },
    reorderRule: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        id: "rr-1",
        reorder_quantity: 10,
        is_active: true
      })
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
        source_branch_id: BRANCH_1,
        source_location_id: LOCATION_PARENT_BRANCH_1
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
          source_location_id: LOCATION_PARENT_BRANCH_1,
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
        receiving_location_id: LOCATION_PARENT_BRANCH_1,
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
          receiving_location_id: LOCATION_PARENT_BRANCH_1,
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
        source_location_id: LOCATION_PARENT_BRANCH_1,
        destination_location_id: LOCATION_PARENT_BRANCH_2,
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
          source_location_id: LOCATION_PARENT_BRANCH_1,
          destination_location_id: LOCATION_PARENT_BRANCH_2,
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

  it("transitions transfer to REQUESTED from DRAFT", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.transitionTransfer(
      "33333333-3333-4333-8333-333333333333",
      { action: "REQUEST", notes: "Submit for approval" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockTransfer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "33333333-3333-4333-8333-333333333333",
          organization_id: "org-1",
          deleted_at: null
        })
      })
    );
    expect(prismaMock.stockTransfer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "REQUESTED",
          requested_by: "user-1"
        })
      })
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "DISTRIBUTION_TRANSFER_TRANSITION",
          entity_type: "stock_transfer",
          user_id: "user-1"
        })
      })
    );
  });

  it("transitions transfer to COMPLETED on receive", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.stockTransfer.findFirst.mockResolvedValue({
      id: "tr-1",
      status: "DISPATCHED",
      source_branch_id: BRANCH_1,
      destination_branch_id: BRANCH_2,
      status_history: []
    });
    const service = new DistributionService(prismaMock as never);

    await service.transitionTransfer(
      "33333333-3333-4333-8333-333333333333",
      { action: "RECEIVE", status: "COMPLETED" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_2
      }
    );

    expect(prismaMock.stockTransfer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "COMPLETED",
          received_date: expect.any(Date)
        })
      })
    );
  });

  it("rejects invalid transfer transition", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.stockTransfer.findFirst.mockResolvedValue({
      id: "tr-1",
      status: "DRAFT",
      source_branch_id: BRANCH_1,
      destination_branch_id: BRANCH_2,
      status_history: []
    });
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.transitionTransfer(
        "33333333-3333-4333-8333-333333333333",
        { action: "DISPATCH" },
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

  it("transitions adjustment to SUBMITTED from DRAFT", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.transitionAdjustment(
      "77777777-7777-4777-8777-777777777777",
      { action: "SUBMIT" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockAdjustment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "77777777-7777-4777-8777-777777777777",
          organization_id: "org-1",
          deleted_at: null
        })
      })
    );
    expect(prismaMock.stockAdjustment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SUBMITTED"
        })
      })
    );
  });

  it("transitions adjustment to APPLIED from APPROVED", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.stockAdjustment.findFirst.mockResolvedValue({
      id: "adj-1",
      status: "APPROVED",
      branch_id: BRANCH_1
    });
    const service = new DistributionService(prismaMock as never);

    await service.transitionAdjustment(
      "77777777-7777-4777-8777-777777777777",
      { action: "APPLY" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockAdjustment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "APPLIED",
          approved_by: "user-1",
          applied_at: expect.any(Date)
        })
      })
    );
  });

  it("rejects invalid adjustment transition", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.stockAdjustment.findFirst.mockResolvedValue({
      id: "adj-1",
      status: "DRAFT",
      branch_id: BRANCH_1
    });
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.transitionAdjustment(
        "77777777-7777-4777-8777-777777777777",
        { action: "APPLY" },
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
        dispatch_location_id: LOCATION_PARENT_BRANCH_1,
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
          dispatch_location_id: LOCATION_PARENT_BRANCH_1,
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

  it("transitions dispatch to READY from DRAFT", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.transitionDispatch(
      "44444444-4444-4444-8444-444444444444",
      { action: "READY" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockDispatch.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "44444444-4444-4444-8444-444444444444",
          organization_id: "org-1",
          deleted_at: null
        })
      })
    );
    expect(prismaMock.stockDispatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "READY"
        })
      })
    );
  });

  it("transitions dispatch to DELIVERED from DISPATCHED", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.stockDispatch.findFirst.mockResolvedValue({
      id: "disp-1",
      status: "DISPATCHED",
      branch_id: BRANCH_1
    });
    const service = new DistributionService(prismaMock as never);

    await service.transitionDispatch(
      "44444444-4444-4444-8444-444444444444",
      { action: "DELIVER" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockDispatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "DELIVERED",
          dispatched_by: "user-1",
          dispatch_date: expect.any(Date)
        })
      })
    );
  });

  it("rejects invalid dispatch transition", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.stockDispatch.findFirst.mockResolvedValue({
      id: "disp-1",
      status: "DRAFT",
      branch_id: BRANCH_1
    });
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.transitionDispatch(
        "44444444-4444-4444-8444-444444444444",
        { action: "DELIVER" },
        {
          id: "user-1",
          organizationId: "org-1",
          branchId: BRANCH_1
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates return records with scoped validation", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createReturn(
      {
        return_type: "CUSTOMER_RETURN",
        source_branch_id: BRANCH_1,
        destination_branch_id: BRANCH_2,
        source_location_id: LOCATION_PARENT_BRANCH_1,
        destination_location_id: LOCATION_PARENT_BRANCH_2,
        line_items: [
          {
            item_id: "33333333-3333-4333-8333-333333333333",
            quantity: 2,
            restock: true,
            damaged: false
          }
        ]
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockReturn.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organization_id: "org-1",
          return_type: "CUSTOMER_RETURN",
          source_branch_id: BRANCH_1,
          source_location_id: LOCATION_PARENT_BRANCH_1,
          destination_location_id: LOCATION_PARENT_BRANCH_2
        })
      })
    );
    expect(result.id).toBe("ret-1");
  });

  it("lists returns with filters", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.listReturns(
      {
        status: "RECEIVED",
        returnType: "CUSTOMER_RETURN",
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockReturn.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          status: "RECEIVED",
          return_type: "CUSTOMER_RETURN",
          deleted_at: null
        })
      })
    );
  });

  it("rejects return when branch scope is not included", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.createReturn(
        {
          return_type: "CUSTOMER_RETURN",
          source_branch_id: BRANCH_2,
          destination_branch_id: BRANCH_2,
          line_items: [
            {
              item_id: "33333333-3333-4333-8333-333333333333",
              quantity: 2
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

  it("transitions return to RECEIVED from DRAFT", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.transitionReturn(
      "55555555-5555-4555-8555-555555555555",
      { action: "RECEIVE" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockReturn.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "55555555-5555-4555-8555-555555555555",
          organization_id: "org-1",
          deleted_at: null
        })
      })
    );
    expect(prismaMock.stockReturn.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "RECEIVED",
          processed_date: expect.any(Date)
        })
      })
    );
  });

  it("transitions return to COMPLETED from INSPECTED", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.stockReturn.findFirst.mockResolvedValue({
      id: "ret-1",
      status: "INSPECTED",
      source_branch_id: BRANCH_1,
      destination_branch_id: BRANCH_2
    });
    const service = new DistributionService(prismaMock as never);

    await service.transitionReturn(
      "55555555-5555-4555-8555-555555555555",
      { action: "COMPLETE" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_2
      }
    );

    expect(prismaMock.stockReturn.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "COMPLETED",
          processed_by: "user-1",
          processed_date: expect.any(Date)
        })
      })
    );
  });

  it("rejects invalid return transition", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.stockReturn.findFirst.mockResolvedValue({
      id: "ret-1",
      status: "DRAFT",
      source_branch_id: BRANCH_1,
      destination_branch_id: BRANCH_2
    });
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.transitionReturn(
        "55555555-5555-4555-8555-555555555555",
        { action: "COMPLETE" },
        {
          id: "user-1",
          organizationId: "org-1",
          branchId: BRANCH_1
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("lists warehouse locations with scoped filters", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.listWarehouseLocations(
      {
        branchId: BRANCH_1,
        isActive: true,
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.warehouseLocation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          branch_id: BRANCH_1,
          is_active: true,
          deleted_at: null
        })
      })
    );
  });

  it("creates warehouse locations with parent validation", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createWarehouseLocation(
      {
        branch_id: BRANCH_1,
        parent_location_id: LOCATION_PARENT_BRANCH_1,
        code: "bin-a2",
        name: "Bin A2",
        location_type: "bin",
        is_active: true
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.warehouseLocation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organization_id: "org-1",
          branch_id: BRANCH_1,
          parent_location_id: LOCATION_PARENT_BRANCH_1,
          code: "BIN-A2",
          location_type: "BIN",
          is_active: true
        })
      })
    );
    expect(result.id).toBe("77777777-7777-4777-8777-777777777777");
  });

  it("rejects warehouse locations when parent belongs to another branch", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.createWarehouseLocation(
        {
          branch_id: BRANCH_1,
          parent_location_id: LOCATION_PARENT_BRANCH_2,
          code: "bin-a3",
          name: "Bin A3"
        },
        {
          id: "user-1",
          organizationId: "org-1",
          branchId: BRANCH_1
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("deactivates warehouse location and writes audit", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.transitionWarehouseLocation(
      "77777777-7777-4777-8777-777777777777",
      { action: "DEACTIVATE" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.warehouseLocation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          is_active: false
        })
      })
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "DISTRIBUTION_WAREHOUSE_LOCATION_TRANSITION",
          entity_type: "warehouse_location"
        })
      })
    );
    expect(result.id).toBe("77777777-7777-4777-8777-777777777777");
  });

  it("lists lots with scoped filters", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.listLots(
      {
        branchId: BRANCH_1,
        status: "active",
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.inventoryLot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          branch_id: BRANCH_1,
          status: "ACTIVE",
          deleted_at: null
        })
      })
    );
  });

  it("creates lot records with quantity validation", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createLot(
      {
        branch_id: BRANCH_1,
        item_id: "33333333-3333-4333-8333-333333333333",
        goods_receipt_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        batch_number: "BATCH-NEW",
        quantity_received: 12,
        quantity_available: 10
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.inventoryLot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organization_id: "org-1",
          branch_id: BRANCH_1,
          quantity_received: 12,
          quantity_available: 10
        })
      })
    );
    expect(result.id).toBe("99999999-9999-4999-8999-999999999999");
  });

  it("transitions lot status to HOLD and writes audit", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.transitionLotStatus(
      "88888888-8888-4888-8888-888888888888",
      { action: "HOLD" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.inventoryLot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "HOLD"
        })
      })
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "DISTRIBUTION_LOT_TRANSITION",
          entity_type: "inventory_lot"
        })
      })
    );
    expect(result.status).toBe("HOLD");
  });

  it("creates lot balances with same-branch lot linkage", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createLotBalance(
      {
        branch_id: BRANCH_1,
        item_id: "33333333-3333-4333-8333-333333333333",
        lot_id: "88888888-8888-4888-8888-888888888888",
        quantity_on_hand: 10,
        reserved_quantity: 2
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.inventoryLotBalance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organization_id: "org-1",
          branch_id: BRANCH_1,
          quantity_on_hand: 10,
          reserved_quantity: 2
        })
      })
    );
    expect(result.id).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });

  it("creates dispatch pick jobs with line validation", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createDispatchPickJob(
      "12121212-1212-4121-8121-121212121212",
      {
        line_items: [
          {
            stock_dispatch_line_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            item_id: "33333333-3333-4333-8333-333333333333",
            requested_qty: 5,
            picked_qty: 0
          }
        ]
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.dispatchPickJob.create).toHaveBeenCalled();
    expect(result.id).toBe("cccccccc-cccc-4ccc-8ccc-cccccccccccc");
  });

  it("transitions dispatch pack jobs to IN_PROGRESS", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.transitionDispatchPackJob(
      "13131313-1313-4131-8131-131313131313",
      {
        action: "START"
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.dispatchPackJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          packed_by: "user-1"
        })
      })
    );
    expect(result.id).toBe("dddddddd-dddd-4ddd-8ddd-dddddddddddd");
  });

  it("writes audit for dispatch pick job transition", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.transitionDispatchPickJob(
      "14141414-1414-4141-8141-141414141414",
      { action: "START" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "DISTRIBUTION_PICK_JOB_TRANSITION",
          entity_type: "dispatch_pick_job"
        })
      })
    );
  });

  it("creates reservations with scoped validation", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createReservation(
      {
        branch_id: BRANCH_1,
        item_id: "33333333-3333-4333-8333-333333333333",
        reserved_quantity: 3,
        reference_type: "SALES_ORDER"
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.inventoryReservation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organization_id: "org-1",
          branch_id: BRANCH_1,
          reserved_quantity: 3,
          status: "ACTIVE"
        })
      })
    );
    expect(result.id).toBe("res-1");
  });

  it("lists reservations with status filter", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.listReservations(
      {
        status: "ACTIVE",
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.inventoryReservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          status: "ACTIVE",
          branch_id: BRANCH_1,
          deleted_at: null
        })
      })
    );
  });

  it("rejects reservations with non-positive quantity", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.createReservation(
        {
          branch_id: BRANCH_1,
          item_id: "33333333-3333-4333-8333-333333333333",
          reserved_quantity: 0
        },
        {
          id: "user-1",
          organizationId: "org-1",
          branchId: BRANCH_1
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates reorder rules with scoped validation", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.createReorderRule(
      {
        branch_id: BRANCH_1,
        item_id: "33333333-3333-4333-8333-333333333333",
        preferred_supplier_id: "66666666-6666-4666-8666-666666666666",
        minimum_stock: 5,
        reorder_level: 12,
        reorder_quantity: 10,
        lead_time_days: 4,
        is_active: true
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.reorderRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organization_id: "org-1",
          branch_id: BRANCH_1,
          reorder_quantity: 10,
          is_active: true
        })
      })
    );
    expect(result.id).toBe("rr-1");
  });

  it("lists reorder rules with active filter", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.listReorderRules(
      {
        isActive: true,
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.reorderRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          is_active: true,
          branch_id: BRANCH_1,
          deleted_at: null
        })
      })
    );
  });

  it("rejects reorder rules with non-positive reorder_quantity", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await expect(
      service.createReorderRule(
        {
          branch_id: BRANCH_1,
          item_id: "33333333-3333-4333-8333-333333333333",
          reorder_quantity: 0
        },
        {
          id: "user-1",
          organizationId: "org-1",
          branchId: BRANCH_1
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("builds restocking suggestions from rules and stock", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.reorderRule.findMany.mockResolvedValue([
      {
        id: "rr-1",
        organization_id: "org-1",
        branch_id: BRANCH_1,
        item_id: "item-1",
        preferred_supplier_id: "sup-1",
        minimum_stock: 5,
        reorder_level: 12,
        reorder_quantity: 10,
        lead_time_days: 4,
        is_active: true,
        branch: { id: BRANCH_1, name: "Main" },
        item: { id: "item-1", name: "Widget A", sku: "W-A" },
        preferred_supplier: { id: "sup-1", name: "Supplier A", supplier_code: "SUP-A" }
      }
    ]);
    prismaMock.inventoryStock.findMany.mockResolvedValue([
      {
        branch_id: BRANCH_1,
        item_id: "item-1",
        quantity_on_hand: 3
      }
    ]);
    const service = new DistributionService(prismaMock as never);

    const result = await service.listRestockingSuggestions(
      {
        includeZero: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        item_id: "item-1",
        current_stock: 3,
        shortage_to_reorder_level: 9,
        suggested_order_quantity: 10,
        needs_restock: true
      })
    );
  });

  it("can include zero-need restocking suggestions", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.reorderRule.findMany.mockResolvedValue([
      {
        id: "rr-1",
        organization_id: "org-1",
        branch_id: BRANCH_1,
        item_id: "item-1",
        preferred_supplier_id: null,
        minimum_stock: 5,
        reorder_level: 8,
        reorder_quantity: 4,
        lead_time_days: 2,
        is_active: true,
        branch: { id: BRANCH_1, name: "Main" },
        item: { id: "item-1", name: "Widget A", sku: "W-A" },
        preferred_supplier: null
      }
    ]);
    prismaMock.inventoryStock.findMany.mockResolvedValue([
      {
        branch_id: BRANCH_1,
        item_id: "item-1",
        quantity_on_hand: 11
      }
    ]);
    const service = new DistributionService(prismaMock as never);

    const result = await service.listRestockingSuggestions(
      {
        includeZero: true
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        current_stock: 11,
        shortage_to_reorder_level: 0,
        suggested_order_quantity: 0,
        needs_restock: false
      })
    );
  });

  it("lists alerts with severity filter", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    await service.listAlerts(
      {
        severity: "HIGH",
        status: "OPEN",
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          severity: "HIGH",
          status: "OPEN",
          branch_id: BRANCH_1,
          deleted_at: null
        })
      })
    );
  });

  it("resolves alerts within scoped branch and writes audit", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.resolveAlert(
      "88888888-8888-4888-8888-888888888888",
      { resolution_note: "Issue fixed" },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.stockAlert.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "RESOLVED",
          resolved_at: expect.any(Date)
        })
      })
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "DISTRIBUTION_ALERT_RESOLVED",
          entity_type: "stock_alert",
          user_id: "user-1"
        })
      })
    );
    expect(result.id).toBe("a1");
  });

  it("builds stock-on-hand report summary and applies low-stock filter", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.stockOnHandReport(
      {
        lowOnly: true,
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(prismaMock.inventoryStock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          branch_id: BRANCH_1,
          deleted_at: null
        })
      })
    );
    expect(result.summary).toEqual(
      expect.objectContaining({
        total_rows: 1,
        low_stock_count: 1
      })
    );
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        item_name: "Widget A",
        low_stock: true,
        out_of_stock: false
      })
    );
  });

  it("builds movement history report with summary totals", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);

    const result = await service.movementHistoryReport(
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
    expect(result.summary).toEqual(
      expect.objectContaining({
        total_movements: 1,
        total_quantity: 10
      })
    );
    expect(result.summary.by_type.TRANSFER_IN).toBe(1);
  });

  it("builds transfer performance report with fill-rate totals", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.stockTransfer.findMany.mockResolvedValue([
      {
        id: "tr-1",
        transfer_number: "TR-1001",
        status: "DISPATCHED",
        source_branch_id: BRANCH_1,
        destination_branch_id: BRANCH_2,
        created_date: new Date("2026-03-21T10:00:00.000Z"),
        dispatched_date: new Date("2026-03-21T11:00:00.000Z"),
        received_date: null,
        source_branch: { id: BRANCH_1, name: "Main" },
        destination_branch: { id: BRANCH_2, name: "North" },
        line_items: [
          { quantity_requested: 10, quantity_sent: 8, quantity_received: 6 },
          { quantity_requested: 4, quantity_sent: 4, quantity_received: 4 }
        ]
      }
    ]);
    const service = new DistributionService(prismaMock as never);

    const result = await service.transferPerformanceReport(
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

    expect(prismaMock.stockTransfer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          status: "DISPATCHED",
          deleted_at: null
        })
      })
    );
    expect(result.summary).toEqual(
      expect.objectContaining({
        total_transfers: 1,
        quantity_requested_total: 14,
        quantity_sent_total: 12,
        quantity_received_total: 10
      })
    );
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        transfer_number: "TR-1001",
        line_count: 2,
        fill_rate_pct: 71.43
      })
    );
  });

  it("builds adjustment variance report with grouped totals", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.stockAdjustment.findMany.mockResolvedValue([
      {
        id: "adj-1",
        adjustment_number: "ADJ-1001",
        status: "APPLIED",
        adjustment_type: "DECREASE",
        reason: "damage",
        branch_id: BRANCH_1,
        created_at: new Date("2026-03-21T10:00:00.000Z"),
        applied_at: new Date("2026-03-21T10:30:00.000Z"),
        branch: { id: BRANCH_1, name: "Main" },
        line_items: [{ variance: -3 }, { variance: 1 }]
      }
    ]);
    const service = new DistributionService(prismaMock as never);

    const result = await service.adjustmentVarianceReport(
      {
        status: "APPLIED",
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
          status: "APPLIED",
          branch_id: BRANCH_1,
          deleted_at: null
        })
      })
    );
    expect(result.summary).toEqual(
      expect.objectContaining({
        total_adjustments: 1,
        net_variance_total: -2,
        increase_total: 1,
        decrease_total: 3
      })
    );
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        adjustment_number: "ADJ-1001",
        line_count: 2,
        variance_total: -2
      })
    );
  });

  it("builds receipt fulfillment report with quantity summaries", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.goodsReceipt.findMany.mockResolvedValue([
      {
        id: "gr-1",
        receipt_number: "GR-1001",
        status: "PARTIAL",
        branch_id: BRANCH_1,
        supplier_id: "sup-1",
        received_date: new Date("2026-03-21T11:00:00.000Z"),
        created_at: new Date("2026-03-21T10:00:00.000Z"),
        branch: { id: BRANCH_1, name: "Main" },
        supplier: { id: "sup-1", name: "Supplier A", supplier_code: "SUP-A" },
        line_items: [
          { ordered_qty: 10, received_qty: 7, rejected_qty: 1, remaining_qty: 2 },
          { ordered_qty: 5, received_qty: 5, rejected_qty: 0, remaining_qty: 0 }
        ]
      }
    ]);
    const service = new DistributionService(prismaMock as never);

    const result = await service.receiptFulfillmentReport(
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
    expect(result.summary).toEqual(
      expect.objectContaining({
        total_receipts: 1,
        ordered_qty_total: 15,
        received_qty_total: 12,
        rejected_qty_total: 1,
        remaining_qty_total: 2
      })
    );
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        receipt_number: "GR-1001",
        fill_rate_pct: 80
      })
    );
  });

  it("builds stock-loss report from returns and adjustment decreases", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.stockReturnLine.findMany.mockResolvedValue([
      {
        quantity: 3,
        condition: "damaged",
        item_id: "item-1",
        item: { id: "item-1", name: "Widget A", sku: "W-A" },
        stock_return: {
          id: "ret-1",
          return_number: "RET-1001",
          processed_date: new Date("2026-03-21T12:00:00.000Z"),
          source_branch_id: BRANCH_1,
          destination_branch_id: BRANCH_2
        }
      }
    ]);
    prismaMock.stockAdjustmentLine.findMany.mockResolvedValue([
      {
        variance: -4,
        item_id: "item-2",
        item: { id: "item-2", name: "Widget B", sku: "W-B" },
        stock_adjustment: {
          id: "adj-1",
          adjustment_number: "ADJ-1001",
          reason: "expired",
          created_at: new Date("2026-03-21T11:00:00.000Z"),
          branch_id: BRANCH_1
        }
      }
    ]);
    const service = new DistributionService(prismaMock as never);

    const result = await service.stockLossReport(
      {
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(result.summary).toEqual(
      expect.objectContaining({
        total_events: 2,
        total_quantity_lost: 7
      })
    );
    expect(result.summary.by_source.RETURN_DAMAGED).toBe(3);
    expect(result.summary.by_source.ADJUSTMENT_DECREASE).toBe(4);
  });

  it("builds stock-valuation report with branch totals", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.inventoryStock.findMany.mockResolvedValue([
      {
        branch_id: BRANCH_1,
        item_id: "item-1",
        quantity_on_hand: 10,
        branch: { id: BRANCH_1, name: "Main" },
        item: { id: "item-1", name: "Widget A", sku: "W-A", cost_price: 12.5 }
      },
      {
        branch_id: BRANCH_1,
        item_id: "item-2",
        quantity_on_hand: 4,
        branch: { id: BRANCH_1, name: "Main" },
        item: { id: "item-2", name: "Widget B", sku: "W-B", cost_price: 5 }
      }
    ]);
    const service = new DistributionService(prismaMock as never);

    const result = await service.stockValuationReport(
      {
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(result.summary).toEqual(
      expect.objectContaining({
        total_rows: 2,
        total_stock_valuation: 145
      })
    );
    expect(result.summary.by_branch.Main).toBe(145);
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        item_name: "Widget A",
        stock_valuation: 125
      })
    );
  });

  it("builds fast/slow mover report from movement aggregates", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.inventoryMovement.findMany.mockResolvedValue([
      {
        item_id: "item-1",
        quantity: 10,
        item: { id: "item-1", name: "Widget A", sku: "W-A" }
      },
      {
        item_id: "item-1",
        quantity: 4,
        item: { id: "item-1", name: "Widget A", sku: "W-A" }
      },
      {
        item_id: "item-2",
        quantity: 3,
        item: { id: "item-2", name: "Widget B", sku: "W-B" }
      }
    ]);
    const service = new DistributionService(prismaMock as never);

    const result = await service.fastSlowMoverReport(
      {
        minMovements: 1,
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(result.summary).toEqual(
      expect.objectContaining({
        item_count: 2,
        total_movements: 3,
        total_quantity_moved: 17
      })
    );
    expect(result.fast_movers[0]).toEqual(
      expect.objectContaining({
        item_id: "item-1",
        movement_count: 2,
        total_quantity: 14
      })
    );
  });

  it("builds supplier fulfillment report with aggregated rates", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.goodsReceipt.findMany.mockResolvedValue([
      {
        supplier_id: "sup-1",
        supplier: { id: "sup-1", name: "Supplier A", supplier_code: "SUP-A" },
        line_items: [
          { ordered_qty: 10, received_qty: 8, rejected_qty: 1, remaining_qty: 1 },
          { ordered_qty: 5, received_qty: 5, rejected_qty: 0, remaining_qty: 0 }
        ]
      },
      {
        supplier_id: "sup-1",
        supplier: { id: "sup-1", name: "Supplier A", supplier_code: "SUP-A" },
        line_items: [{ ordered_qty: 10, received_qty: 7, rejected_qty: 2, remaining_qty: 1 }]
      },
      {
        supplier_id: "sup-2",
        supplier: { id: "sup-2", name: "Supplier B", supplier_code: "SUP-B" },
        line_items: [{ ordered_qty: 8, received_qty: 8, rejected_qty: 0, remaining_qty: 0 }]
      }
    ]);
    const service = new DistributionService(prismaMock as never);

    const result = await service.supplierFulfillmentReport(
      {
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(result.summary).toEqual(
      expect.objectContaining({
        supplier_count: 2,
        receipt_count: 3,
        ordered_qty_total: 33,
        received_qty_total: 28
      })
    );
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        supplier_id: "sup-2",
        fulfillment_rate_pct: 100
      })
    );
  });

  it("builds operations exceptions report with overdue and negative-stock counts", async () => {
    const prismaMock = createPrismaMock();
    prismaMock.goodsReceipt.findMany.mockResolvedValue([
      {
        id: "gr-overdue",
        status: "PARTIAL",
        branch: { id: BRANCH_1, name: "Main" },
        supplier: { id: "sup-1", name: "Supplier A", supplier_code: "SUP-A" }
      }
    ]);
    prismaMock.stockTransfer.findMany.mockResolvedValue([
      {
        id: "tr-overdue",
        status: "APPROVED",
        source_branch: { id: BRANCH_1, name: "Main" },
        destination_branch: { id: BRANCH_2, name: "North" }
      }
    ]);
    prismaMock.stockDispatch.findMany.mockResolvedValue([
      {
        id: "disp-overdue",
        status: "READY",
        branch: { id: BRANCH_1, name: "Main" }
      }
    ]);
    prismaMock.inventoryStock.findMany.mockResolvedValue([
      {
        id: "stk-neg",
        branch_id: BRANCH_1,
        item_id: "item-1",
        quantity_on_hand: -2,
        branch: { id: BRANCH_1, name: "Main" },
        item: { id: "item-1", name: "Widget A", sku: "W-A" }
      }
    ]);
    const service = new DistributionService(prismaMock as never);

    const result = await service.operationsExceptionsReport(
      {
        receiptOverdueDays: 2,
        transferOverdueDays: 2,
        dispatchOverdueDays: 2,
        includeDeleted: false
      },
      {
        id: "user-1",
        organizationId: "org-1",
        branchId: BRANCH_1
      }
    );

    expect(result.summary).toEqual(
      expect.objectContaining({
        overdue_receipts: 1,
        overdue_transfers: 1,
        overdue_dispatches: 1,
        negative_stock_items: 1,
        total_exceptions: 4
      })
    );
  });

  it("enforces user scope for dashboard access", async () => {
    const prismaMock = createPrismaMock();
    const service = new DistributionService(prismaMock as never);
    await expect(service.dashboard(undefined)).rejects.toBeInstanceOf(NotFoundException);
  });
});
