import { OpportunitiesService } from "./opportunities.service";

describe("OpportunitiesService", () => {
  const purchasingServiceMock = {
    create: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    const serviceWithDeps = new OpportunitiesService(
      prismaMock as never,
      purchasingServiceMock as never
    );
    const opportunity = await serviceWithDeps.create(
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
    const service = new OpportunitiesService(prismaMock as never, purchasingServiceMock as never);
    await service.findAll(false, {
      id: "user-1",
      organizationId: "org-1",
      branchId: "branch-1"
    });
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
    const service = new OpportunitiesService(prismaMock as never, purchasingServiceMock as never);

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
    const service = new OpportunitiesService(prismaMock as never, purchasingServiceMock as never);

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
    const service = new OpportunitiesService(prismaMock as never, purchasingServiceMock as never);

    await expect(
      service.update(
        "opp-1",
        { lead_id: "44444444-4444-4444-8444-444444444444" },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("lead_id must reference a lead in your organization");
  });

  it("creates a draft purchase-order handoff for won opportunities", async () => {
    const prismaMock = {
      opportunity: {
        findFirst: jest.fn().mockResolvedValue({
          id: "opp-1",
          lead_id: "lead-1",
          status: "WON",
          organization_id: "org-1",
          created_by: "user-1",
          deleted_at: null
        })
      },
      lead: {
        findFirst: jest.fn()
      }
    };
    purchasingServiceMock.create.mockResolvedValue({
      id: "po-1",
      status: "DRAFT"
    });

    const service = new OpportunitiesService(prismaMock as never, purchasingServiceMock as never);
    const result = await service.createPurchaseOrderHandoff(
      "opp-1",
      {
        supplier_id: "66666666-6666-4666-8666-666666666666"
      },
      { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
    );

    expect(purchasingServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        supplier_id: "66666666-6666-4666-8666-666666666666",
        status: "DRAFT",
        payment_status: "UNPAID",
        line_items: expect.any(Array),
        notes: expect.stringContaining("CRM handoff from opportunity opp-1")
      }),
      { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
    );
    expect(result.status).toBe("DRAFT");
  });

  it("rejects handoff when opportunity is not won", async () => {
    const prismaMock = {
      opportunity: {
        findFirst: jest.fn().mockResolvedValue({
          id: "opp-1",
          lead_id: "lead-1",
          status: "OPEN",
          organization_id: "org-1",
          created_by: "user-1",
          deleted_at: null
        })
      },
      lead: {
        findFirst: jest.fn()
      }
    };
    const service = new OpportunitiesService(prismaMock as never, purchasingServiceMock as never);

    await expect(
      service.createPurchaseOrderHandoff(
        "opp-1",
        { supplier_id: "66666666-6666-4666-8666-666666666666" },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("Opportunity must be WON before ERP handoff");
  });
});
