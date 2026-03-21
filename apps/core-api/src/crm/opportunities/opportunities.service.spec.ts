import { OpportunitiesService } from "./opportunities.service";

describe("OpportunitiesService", () => {
  it("creates opportunities with OPEN status by default", async () => {
    const prismaMock = {
      lead: {
        findFirst: jest.fn()
      },
      opportunity: {
        create: jest.fn().mockResolvedValue({
          id: "opp-1",
          organization_id: "org-1",
          status: "OPEN"
        })
      }
    };
    const service = new OpportunitiesService(prismaMock as never);
    const opportunity = await service.create(
      {},
      { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
    );
    expect(prismaMock.opportunity.create).toHaveBeenCalled();
    expect(opportunity.status).toBe("OPEN");
  });

  it("queries active opportunities by default", async () => {
    const prismaMock = {
      lead: {
        findFirst: jest.fn()
      },
      opportunity: {
        findMany: jest.fn().mockResolvedValue([])
      }
    };
    const service = new OpportunitiesService(prismaMock as never);
    await service.findAll(false, { id: "user-1", organizationId: "org-1", branchId: "branch-1" });
    expect(prismaMock.opportunity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organization_id: "org-1",
          created_by: "user-1",
          deleted_at: null
        }
      })
    );
  });

  it("rejects lead relations from another organization", async () => {
    const prismaMock = {
      lead: {
        findFirst: jest.fn().mockResolvedValue(null)
      },
      opportunity: {
        create: jest.fn()
      }
    };
    const service = new OpportunitiesService(prismaMock as never);

    await expect(
      service.create(
        { lead_id: "44444444-4444-4444-8444-444444444444" },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("lead_id must reference a lead in your organization");
  });

  it("rejects lead relations from another branch when user is branch-scoped", async () => {
    const prismaMock = {
      lead: {
        findFirst: jest.fn().mockResolvedValue({
          id: "44444444-4444-4444-8444-444444444444",
          branch_id: "branch-2"
        })
      },
      opportunity: {
        create: jest.fn()
      }
    };
    const service = new OpportunitiesService(prismaMock as never);

    await expect(
      service.create(
        { lead_id: "44444444-4444-4444-8444-444444444444" },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("lead_id must reference a lead in your branch");
  });

  it("rejects lead updates that link to another organization", async () => {
    const prismaMock = {
      lead: {
        findFirst: jest.fn().mockResolvedValue(null)
      },
      opportunity: {
        findFirst: jest.fn().mockResolvedValue({
          id: "opp-1",
          organization_id: "org-1",
          created_by: "user-1"
        }),
        update: jest.fn()
      }
    };
    const service = new OpportunitiesService(prismaMock as never);

    await expect(
      service.update(
        "opp-1",
        { lead_id: "44444444-4444-4444-8444-444444444444" },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("lead_id must reference a lead in your organization");
  });
});
