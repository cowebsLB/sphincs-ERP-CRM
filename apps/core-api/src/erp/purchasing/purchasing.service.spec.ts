import { PurchasingService } from "./purchasing.service";

describe("PurchasingService", () => {
  it("creates purchase orders with DRAFT by default", async () => {
    const prismaMock = {
      purchaseOrder: {
        create: jest.fn().mockResolvedValue({
          id: "po-1",
          organization_id: "org-1",
          status: "DRAFT"
        })
      }
    };

    const service = new PurchasingService(prismaMock as never);
    const order = await service.create({ organization_id: "org-1" });

    expect(prismaMock.purchaseOrder.create).toHaveBeenCalled();
    expect(order.status).toBe("DRAFT");
  });
});
