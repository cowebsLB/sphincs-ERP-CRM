import { ServiceUnavailableException } from "@nestjs/common";
import { BugsService } from "./bugs.service";

describe("BugsService", () => {
  const originalFetch = global.fetch;
  const originalRepo = process.env.GITHUB_ISSUES_REPO;
  const originalToken = process.env.GITHUB_ISSUES_TOKEN;

  beforeEach(() => {
    process.env.GITHUB_ISSUES_REPO = "cowebsLB/sphincs-ERP-CRM";
    process.env.GITHUB_ISSUES_TOKEN = "test-token";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GITHUB_ISSUES_REPO = originalRepo;
    process.env.GITHUB_ISSUES_TOKEN = originalToken;
    jest.restoreAllMocks();
  });

  it("creates a GitHub issue and returns summary payload", async () => {
    const service = new BugsService();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        html_url: "https://github.com/cowebsLB/sphincs-ERP-CRM/issues/123",
        number: 123,
        title: "[ERP] Save button fails",
        state: "open"
      })
    }) as unknown as typeof fetch;

    const result = await service.createGithubIssue(
      {
        title: "Save button fails",
        summary: "Save flow errors after editing values",
        sourceApp: "ERP",
        severity: "high",
        module: "suppliers",
        route: "/erp/suppliers",
        steps: ["Open suppliers", "Edit record", "Click save"],
        expected: "Record should be saved",
        actual: "Request fails with 500"
      },
      {
        id: "user-1",
        email: "tester@sphincs.local",
        roles: ["Staff"],
        organizationId: "org-1",
        branchId: "branch-1"
      }
    );

    expect(result.issueNumber).toBe(123);
    expect(result.issueState).toBe("open");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/cowebsLB/sphincs-ERP-CRM/issues",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("fails when GitHub issue integration is not configured", async () => {
    const service = new BugsService();
    process.env.GITHUB_ISSUES_TOKEN = "";

    await expect(
      service.createGithubIssue(
        {
          title: "Anything",
          summary: "Summary",
          sourceApp: "CRM",
          severity: "low",
          module: "leads",
          route: "/crm/leads",
          steps: ["Open leads", "Click action"],
          expected: "y",
          actual: "z"
        },
        {
          id: "user-1",
          email: "tester@sphincs.local",
          roles: ["Staff"],
          organizationId: "org-1"
        }
      )
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
