import { LeadsService } from "./leads.service";

describe("LeadsService", () => {
  const auditServiceMock = {
    record: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    const service = new LeadsService(prismaMock as never, auditServiceMock as never);
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
    const service = new LeadsService(prismaMock as never, auditServiceMock as never);
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
    const service = new LeadsService(prismaMock as never, auditServiceMock as never);

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
    const service = new LeadsService(prismaMock as never, auditServiceMock as never);

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
    const service = new LeadsService(prismaMock as never, auditServiceMock as never);

    await expect(
      service.update(
        "lead-1",
        { contact_id: "33333333-3333-4333-8333-333333333333" },
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("contact_id must reference a contact in your organization");
  });

  it("converts a qualified lead to an open opportunity and records audit", async () => {
    const txMock = {
      lead: {
        update: jest.fn().mockResolvedValue({
          id: "lead-1",
          status: "CONVERTED"
        })
      },
      opportunity: {
        create: jest.fn().mockResolvedValue({
          id: "opp-1",
          status: "OPEN"
        })
      }
    };
    const prismaMock = {
      contact: {
        findFirst: jest.fn()
      },
      lead: {
        findFirst: jest.fn().mockResolvedValue({
          id: "lead-1",
          status: "QUALIFIED",
          organization_id: "org-1",
          created_by: "user-1",
          deleted_at: null
        })
      },
      $transaction: jest.fn(async (cb: (tx: typeof txMock) => unknown) => cb(txMock))
    };
    const service = new LeadsService(prismaMock as never, auditServiceMock as never);

    const result = await service.convertToOpportunity(
      "lead-1",
      {},
      { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
    );

    expect(txMock.lead.update).toHaveBeenCalled();
    expect(txMock.opportunity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lead_id: "lead-1",
          status: "OPEN"
        })
      })
    );
    expect(auditServiceMock.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CRM_LEAD_CONVERTED_TO_OPPORTUNITY",
        entityType: "crm_lead",
        entityId: "lead-1"
      })
    );
    expect(result.opportunity.id).toBe("opp-1");
  });

  it("rejects conversion for disqualified leads", async () => {
    const prismaMock = {
      contact: {
        findFirst: jest.fn()
      },
      lead: {
        findFirst: jest.fn().mockResolvedValue({
          id: "lead-1",
          status: "DISQUALIFIED",
          organization_id: "org-1",
          created_by: "user-1",
          deleted_at: null
        })
      },
      $transaction: jest.fn()
    };
    const service = new LeadsService(prismaMock as never, auditServiceMock as never);

    await expect(
      service.convertToOpportunity(
        "lead-1",
        {},
        { id: "user-1", organizationId: "org-1", branchId: "branch-1" }
      )
    ).rejects.toThrow("Disqualified leads cannot be converted to opportunities");
  });
});
