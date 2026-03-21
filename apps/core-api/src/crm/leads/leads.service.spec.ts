import { LeadsService } from "./leads.service";

describe("LeadsService", () => {
  it("creates leads with NEW status by default", async () => {
    const prismaMock = {
      contact: {
        findFirst: jest.fn()
      },
      lead: {
        create: jest.fn().mockResolvedValue({
          id: "lead-1",
          organization_id: "org-1",
          status: "NEW"
        })
      }
    };
    const service = new LeadsService(prismaMock as never);
    const lead = await service.create(
      {},
      { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
    );
    expect(prismaMock.lead.create).toHaveBeenCalled();
    expect(lead.status).toBe("NEW");
  });

  it("queries active leads by default", async () => {
    const prismaMock = {
      contact: {
        findFirst: jest.fn()
      },
      lead: {
        findMany: jest.fn().mockResolvedValue([])
      }
    };
    const service = new LeadsService(prismaMock as never);
    await service.findAll(false, { id: "user-1", organizationId: "org-1", branchId: "branch-1" });
    expect(prismaMock.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organization_id: "org-1",
          created_by: "user-1",
          deleted_at: null
        }
      })
    );
  });

  it("rejects contact relations from another organization", async () => {
    const prismaMock = {
      contact: {
        findFirst: jest.fn().mockResolvedValue(null)
      },
      lead: {
        create: jest.fn()
      }
    };
    const service = new LeadsService(prismaMock as never);

    await expect(
      service.create(
        { contact_id: "33333333-3333-4333-8333-333333333333" },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("contact_id must reference a contact in your organization");
  });

  it("rejects contact relations from another branch when user is branch-scoped", async () => {
    const prismaMock = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({
          id: "33333333-3333-4333-8333-333333333333",
          branch_id: "branch-2"
        })
      },
      lead: {
        create: jest.fn()
      }
    };
    const service = new LeadsService(prismaMock as never);

    await expect(
      service.create(
        { contact_id: "33333333-3333-4333-8333-333333333333" },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("contact_id must reference a contact in your branch");
  });

  it("rejects contact updates that link to another organization", async () => {
    const prismaMock = {
      contact: {
        findFirst: jest.fn().mockResolvedValue(null)
      },
      lead: {
        findFirst: jest.fn().mockResolvedValue({
          id: "lead-1",
          organization_id: "org-1",
          created_by: "user-1"
        }),
        update: jest.fn()
      }
    };
    const service = new LeadsService(prismaMock as never);

    await expect(
      service.update(
        "lead-1",
        { contact_id: "33333333-3333-4333-8333-333333333333" },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("contact_id must reference a contact in your organization");
  });
});
