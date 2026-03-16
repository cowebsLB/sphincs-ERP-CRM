import { LeadsService } from "./leads.service";

describe("LeadsService", () => {
  it("creates leads with NEW status by default", () => {
    const service = new LeadsService();
    const lead = service.create({ organization_id: "org-1" });
    expect(lead.status).toBe("NEW");
  });

  it("excludes soft-deleted leads by default", () => {
    const service = new LeadsService();
    const lead = service.create({ organization_id: "org-1" });
    service.update(lead.id, { deleted_at: new Date().toISOString() });

    expect(service.findAll(false)).toHaveLength(0);
    expect(service.findAll(true)).toHaveLength(1);
  });
});

