import { BadRequestException } from "@nestjs/common";
import { PurchasingService } from "./purchasing.service";

describe("PurchasingService", () => {
  it("creates purchase orders with computed totals and DRAFT defaults", async () => {
    const prismaMock = {
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
      purchaseOrder: {
        create: jest.fn()
      }
    };

    const service = new PurchasingService(prismaMock as never);

    expect(() =>
      service.create(
        {
          status: "BROKEN",
          line_items: [{ description: "Mouse", quantity: 1, unit_cost: 10 }]
        },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).toThrow(BadRequestException);
  });

  it("rejects invalid received quantities", async () => {
    const prismaMock = {
      purchaseOrder: {
        create: jest.fn()
      }
    };

    const service = new PurchasingService(prismaMock as never);

    expect(() =>
      service.create(
        {
          line_items: [{ description: "Mouse", quantity: 1, unit_cost: 10, received_quantity: 2 }]
        },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).toThrow(BadRequestException);
  });
});
