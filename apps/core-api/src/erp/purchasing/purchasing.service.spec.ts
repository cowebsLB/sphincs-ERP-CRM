import { PurchasingService } from "./purchasing.service";

describe("PurchasingService", () => {
  it("creates purchase orders with DRAFT by default", () => {
    const service = new PurchasingService();
    const order = service.create({ organization_id: "org-1" });
    expect(order.status).toBe("DRAFT");
  });
});

