import { BadRequestException } from "@nestjs/common";
import { SuppliersService } from "./suppliers.service";

describe("SuppliersService", () => {
  it("creates suppliers with expanded defaults", async () => {
    const prismaMock = {
      supplier: {
        create: jest.fn().mockResolvedValue({
          id: "supplier-1",
          organization_id: "org-1",
          supplier_code: "SUP-001",
          status: "ACTIVE",
          currency: "USD",
          preferred_supplier: false
        })
      }
    };
    const service = new SuppliersService(prismaMock as never);

    const supplier = await service.create(
      {
        name: "Northwind Supplies",
        supplier_code: "sup-001"
      },
      { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
    );

    expect(prismaMock.supplier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Northwind Supplies",
          supplier_code: "SUP-001",
          status: "ACTIVE",
          currency: "USD",
          balance: 0
        })
      })
    );
    expect(supplier.status).toBe("ACTIVE");
  });

  it("stores preferred supplier and financial fields cleanly", async () => {
    const prismaMock = {
      supplier: {
        create: jest.fn().mockResolvedValue({
          id: "supplier-2",
          preferred_supplier: true,
          credit_limit: 2500
        })
      }
    };
    const service = new SuppliersService(prismaMock as never);

    await service.create(
      {
        name: "Prime Vendor",
        preferred_supplier: true,
        credit_limit: "2500",
        currency: "eur"
      },
      { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
    );

    expect(prismaMock.supplier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          preferred_supplier: true,
          credit_limit: 2500,
          currency: "EUR"
        })
      })
    );
  });

  it("rejects invalid supplier status values", async () => {
    const prismaMock = {
      supplier: {
        create: jest.fn()
      }
    };
    const service = new SuppliersService(prismaMock as never);

    expect(() =>
      service.create(
        {
          name: "Broken Supplier",
          status: "UNKNOWN"
        },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).toThrow(BadRequestException);
  });
});
