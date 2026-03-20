import { BadRequestException, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  function createPrismaMock() {
    return {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      role: {
        findMany: jest.fn()
      },
      userRole: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      refreshToken: {
        updateMany: jest.fn()
      }
    };
  }

  it("creates a user with explicit role assignments", async () => {
    const prisma = createPrismaMock();
    prisma.user.create.mockResolvedValue({
      id: "user-1"
    });
    prisma.role.findMany.mockResolvedValue([
      { id: "role-admin", name: "Admin" },
      { id: "role-erp", name: "ERP Manager" }
    ]);
    prisma.userRole.findMany.mockResolvedValue([]);
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      organization_id: "org-1",
      branch_id: "branch-1",
      email: "admin@sphincs.local",
      status: "ACTIVE",
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      user_roles: [{ role: { name: "Admin" } }, { role: { name: "ERP Manager" } }]
    });

    const service = new UsersService(prisma as never);
    const created = await service.create({
      email: "admin@sphincs.local",
      password: "ChangeMe123!",
      organization_id: "org-1",
      branch_id: "branch-1",
      roles: ["Admin", "ERP Manager"]
    });

    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.userRole.create).toHaveBeenCalledTimes(2);
    expect(created.roles).toEqual(["Admin", "ERP Manager"]);
  });

  it("rejects unknown role names on update", async () => {
    const prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      organization_id: "org-1",
      branch_id: null,
      email: "staff@sphincs.local",
      status: "ACTIVE",
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      user_roles: [{ role: { name: "Staff" } }]
    });
    prisma.user.update.mockResolvedValue({});
    prisma.role.findMany.mockResolvedValue([]);

    const service = new UsersService(prisma as never);

    await expect(service.update("user-1", { roles: ["Ghost Role"] })).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it("revokes active refresh sessions when roles change", async () => {
    const prisma = createPrismaMock();
    prisma.user.findUnique
      .mockResolvedValueOnce({
        id: "user-1",
        organization_id: "org-1",
        branch_id: null,
        email: "staff@sphincs.local",
        status: "ACTIVE",
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        user_roles: [{ role: { name: "Staff" } }]
      })
      .mockResolvedValueOnce({
        id: "user-1",
        organization_id: "org-1",
        branch_id: null,
        email: "staff@sphincs.local",
        status: "ACTIVE",
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        user_roles: [{ role: { name: "ERP Manager" } }]
      });
    prisma.user.update.mockResolvedValue({});
    prisma.role.findMany.mockResolvedValue([{ id: "role-erp", name: "ERP Manager" }]);
    prisma.userRole.findMany.mockResolvedValue([
      {
        id: "assignment-1",
        deleted_at: null,
        role: { name: "Staff" }
      }
    ]);
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

    const service = new UsersService(prisma as never);
    const updated = await service.update("user-1", {
      roles: ["ERP Manager"],
      updated_by: "admin-1"
    });

    expect(prisma.userRole.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deleted_at: expect.any(Date)
        })
      })
    );
    expect(prisma.userRole.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role_id: "role-erp",
          user_id: "user-1"
        })
      })
    );
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    expect(updated.roles).toEqual(["ERP Manager"]);
  });

  it("throws when restoring a missing user", async () => {
    const prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    const service = new UsersService(prisma as never);

    await expect(service.restore("missing-user")).rejects.toBeInstanceOf(NotFoundException);
  });
});
