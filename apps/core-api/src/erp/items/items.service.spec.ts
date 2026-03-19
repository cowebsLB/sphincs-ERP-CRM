import { BadRequestException } from "@nestjs/common";
import { ItemsService } from "./items.service";

describe("ItemsService", () => {
  it("creates items with expanded defaults", async () => {
    const prismaMock = {
      item: {
        create: jest.fn().mockResolvedValue({
          id: "item-1",
          organization_id: "org-1",
          sku: "SKU-1",
          status: "ACTIVE",
          currency: "USD",
          track_inventory: true
        })
      }
    };
    const service = new ItemsService(prismaMock as never);
    const item = await service.create(
      { name: "Widget", sku: "sku-1" },
      { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
    );

    expect(prismaMock.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Widget",
          sku: "SKU-1",
          status: "ACTIVE",
          currency: "USD",
          track_inventory: true
        })
      })
    );
    expect(item.status).toBe("ACTIVE");
  });

  it("disables inventory quantities when item is a service", async () => {
    const prismaMock = {
      item: {
        create: jest.fn().mockResolvedValue({
          id: "item-2",
          is_service: true,
          track_inventory: false,
          quantity_on_hand: 0
        })
      }
    };
    const service = new ItemsService(prismaMock as never);

    await service.create(
      {
        name: "Consulting",
        sku: "svc-1",
        is_service: true,
        track_inventory: true,
        quantity_on_hand: 25
      },
      { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
    );

    expect(prismaMock.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          is_service: true,
          track_inventory: false,
          quantity_on_hand: 0,
          reorder_level: 0,
          max_stock_level: null
        })
      })
    );
  });

  it("rejects invalid item status values", async () => {
    const prismaMock = {
      item: {
        create: jest.fn()
      }
    };
    const service = new ItemsService(prismaMock as never);

    expect(() =>
      service.create(
        {
          name: "Widget",
          sku: "sku-1",
          status: "BROKEN"
        },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).toThrow(BadRequestException);
  });
});
