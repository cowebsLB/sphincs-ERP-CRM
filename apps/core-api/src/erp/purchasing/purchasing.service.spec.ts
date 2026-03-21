import { BadRequestException } from "@nestjs/common";
import { PurchasingService } from "./purchasing.service";

describe("PurchasingService", () => {
  it("creates purchase orders with computed totals and DRAFT defaults", async () => {
    const prismaMock = {
      supplier: {
        findFirst: jest.fn().mockResolvedValue({
          id: "11111111-1111-4111-8111-111111111111",
          branch_id: "branch-1"
        })
      },
      item: {
        findFirst: jest.fn()
      },
      purchaseOrder: {
        create: jest.fn().mockResolvedValue({
          id: "po-1",
          organization_id: "org-1",
          status: "DRAFT",
          payment_status: "UNPAID",
          grand_total: 55
        })
      }
    };

    const service = new PurchasingService(prismaMock as never);
    const order = await service.create(
      {
        supplier_id: "11111111-1111-4111-8111-111111111111",
        line_items: [
          {
            description: "Mouse",
            quantity: 2,
            unit_cost: 20,
            tax_rate: 10,
            discount: 5
          }
        ]
      },
      { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
    );

    expect(prismaMock.purchaseOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "DRAFT",
          payment_status: "UNPAID",
          subtotal: 40,
          total_tax: 4,
          total_discount: 5,
          grand_total: 39
        })
      })
    );
    expect(order.status).toBe("DRAFT");
  });

  it("rejects invalid purchase order statuses", async () => {
    const prismaMock = {
      supplier: {
        findFirst: jest.fn()
      },
      item: {
        findFirst: jest.fn()
      },
      purchaseOrder: {
        create: jest.fn()
      }
    };

    const service = new PurchasingService(prismaMock as never);

    await expect(
      service.create(
        {
          status: "BROKEN",
          line_items: [{ description: "Mouse", quantity: 1, unit_cost: 10 }]
        },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects invalid received quantities", async () => {
    const prismaMock = {
      supplier: {
        findFirst: jest.fn()
      },
      item: {
        findFirst: jest.fn()
      },
      purchaseOrder: {
        create: jest.fn()
      }
    };

    const service = new PurchasingService(prismaMock as never);

    await expect(
      service.create(
        {
          line_items: [{ description: "Mouse", quantity: 1, unit_cost: 10, received_quantity: 2 }]
        },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("allows delete-only patch updates without rebuilding line items", async () => {
    const prismaMock = {
      supplier: {
        findFirst: jest.fn()
      },
      item: {
        findFirst: jest.fn()
      },
      purchaseOrder: {
        findFirst: jest.fn().mockResolvedValue({
          id: "po-1",
          organization_id: "org-1",
          created_by: "user-1",
          line_items: []
        }),
        update: jest.fn().mockResolvedValue({
          id: "po-1",
          deleted_at: new Date("2026-03-20T00:00:00.000Z")
        })
      }
    };

    const service = new PurchasingService(prismaMock as never);
    await service.update(
      "po-1",
      { deleted_at: "2026-03-20T00:00:00.000Z" },
      { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
    );

    expect(prismaMock.purchaseOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "po-1" },
        data: expect.objectContaining({
          updated_by: "user-1"
        })
      })
    );
  });

  it("scopes purchase-order list queries to the signed-in user data", async () => {
    const prismaMock = {
      supplier: {
        findFirst: jest.fn()
      },
      item: {
        findFirst: jest.fn()
      },
      purchaseOrder: {
        findMany: jest.fn().mockResolvedValue([])
      }
    };

    const service = new PurchasingService(prismaMock as never);
    await service.findAll(false, {
      id: "user-1",
      organizationId: "org-1",
      branchId: "branch-1"
    });

    expect(prismaMock.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: "org-1",
          created_by: "user-1",
          deleted_at: null
        })
      })
    );
  });

  it("rejects supplier relations from another organization", async () => {
    const prismaMock = {
      supplier: {
        findFirst: jest.fn().mockResolvedValue(null)
      },
      item: {
        findFirst: jest.fn()
      },
      purchaseOrder: {
        create: jest.fn()
      }
    };

    const service = new PurchasingService(prismaMock as never);

    await expect(
      service.create(
        {
          supplier_id: "11111111-1111-4111-8111-111111111111",
          line_items: [{ description: "Mouse", quantity: 1, unit_cost: 10 }]
        },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("supplier_id must reference a supplier in your organization");
  });

  it("rejects item relations from another branch when user is branch-scoped", async () => {
    const prismaMock = {
      supplier: {
        findFirst: jest.fn().mockResolvedValue({
          id: "11111111-1111-4111-8111-111111111111",
          branch_id: "branch-1"
        })
      },
      item: {
        findFirst: jest.fn().mockResolvedValue({
          id: "22222222-2222-4222-8222-222222222222",
          branch_id: "branch-2"
        })
      },
      purchaseOrder: {
        create: jest.fn()
      }
    };

    const service = new PurchasingService(prismaMock as never);

    await expect(
      service.create(
        {
          supplier_id: "11111111-1111-4111-8111-111111111111",
          line_items: [
            {
              item_id: "22222222-2222-4222-8222-222222222222",
              description: "Mouse",
              quantity: 1,
              unit_cost: 10
            }
          ]
        },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("line_items[0].item_id must reference an item in your branch");
  });

  it("rejects supplier updates that link to another organization", async () => {
    const prismaMock = {
      supplier: {
        findFirst: jest.fn().mockResolvedValue(null)
      },
      item: {
        findFirst: jest.fn()
      },
      purchaseOrder: {
        findFirst: jest.fn().mockResolvedValue({
          id: "po-1",
          organization_id: "org-1",
          created_by: "user-1",
          po_number: "PO-20260321-0001",
          status: "DRAFT",
          payment_status: "UNPAID",
          order_date: new Date("2026-03-21T00:00:00.000Z"),
          line_items: [{ description: "Mouse", quantity: 1, unit_cost: 10 }]
        }),
        update: jest.fn()
      }
    };

    const service = new PurchasingService(prismaMock as never);

    await expect(
      service.update(
        "po-1",
        {
          supplier_id: "11111111-1111-4111-8111-111111111111",
          line_items: [{ description: "Mouse", quantity: 1, unit_cost: 10 }]
        },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("supplier_id must reference a supplier in your organization");
  });
});
