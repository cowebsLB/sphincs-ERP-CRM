import { LeadsService } from "./leads.service";

describe("LeadsService", () => {
  it("creates leads with NEW status by default", async () => {
    const prismaMock = {
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
});
