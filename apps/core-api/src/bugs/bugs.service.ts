import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { CreateBugReportDto } from "./dto/create-bug-report.dto";

type BugReporter = {
  id: string;
  email: string;
  roles: string[];
  organizationId: string;
  branchId?: string | null;
};

@Injectable()
export class BugsService {
  private resolveRepository(): string {
    return (process.env.GITHUB_ISSUES_REPO || process.env.GITHUB_REPOSITORY || "").trim();
  }

  private resolveLabels(): string[] {
    const raw = process.env.GITHUB_ISSUES_LABELS?.trim() || "bug,beta-feedback";
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private sanitizeLabel(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 40);
  }

  private buildLabels(input: CreateBugReportDto): string[] {
    const source = this.sanitizeLabel(input.sourceApp);
    const area = this.sanitizeLabel(input.module);
    const labels = [
      ...this.resolveLabels(),
      `severity:${input.severity}`,
      `module:${source}`,
      `area:${area}`
    ];
    return Array.from(new Set(labels.filter(Boolean)));
  }

  private buildIssueBody(input: CreateBugReportDto, reporter: BugReporter): string {
    const stepLines = input.steps.map((step, index) => `${index + 1}. ${step.trim()}`).join("\n");
    const timestamp = new Date().toISOString();
    const pageUrlSection = input.pageUrl?.trim() ? `- Page URL: ${input.pageUrl.trim()}\n` : "";
    return [
      "## Bug Summary",
      "",
      input.summary.trim(),
      "",
      "## Steps To Reproduce",
      "",
      stepLines,
      "",
      "## Expected Result",
      "",
      input.expected.trim(),
      "",
      "## Actual Result",
      "",
      input.actual.trim(),
      "",
      "## Severity",
      "",
      input.severity.charAt(0).toUpperCase() + input.severity.slice(1),
      "",
      "## Context",
      "",
      `- Module: ${input.module}`,
      `- Route: ${input.route}`,
      `- App: ${input.sourceApp}`,
      `- Version: ${input.appVersion ?? "beta-v1"}`,
      `- User ID: ${reporter.id}`,
      `- User Email: ${reporter.email}`,
      `- Contact Email: ${input.contactEmail ?? "not provided"}`,
      `- Organization: ${reporter.organizationId}`,
      `- Branch: ${reporter.branchId ?? "none"}`,
      `- Time: ${timestamp}`,
      `- User Agent: ${input.userAgent ?? "unknown"}`,
      pageUrlSection ? pageUrlSection.trimEnd() : "",
      input.screenshotUrl ? `- Screenshot URL: ${input.screenshotUrl}` : ""
    ]
      .filter((line) => line !== "")
      .join("\n");
  }

  async createGithubIssue(input: CreateBugReportDto, reporter: BugReporter) {
    const token = (process.env.GITHUB_ISSUES_TOKEN || "").trim();
    const repository = this.resolveRepository();
    if (!token || !repository.includes("/")) {
      throw new ServiceUnavailableException(
        "Bug reporting is not configured. Missing GitHub token or repository."
      );
    }

    const response = await fetch(`https://api.github.com/repos/${repository}/issues`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: `[${input.sourceApp}] ${input.title.trim()}`,
        body: this.buildIssueBody(input, reporter),
        labels: this.buildLabels(input)
      })
    });

    if (!response.ok) {
      const details = await response.text();
      throw new ServiceUnavailableException(
        `GitHub issue creation failed with status ${response.status}: ${details || "unknown error"}`
      );
    }

    const payload = (await response.json()) as {
      html_url: string;
      number: number;
      title: string;
      state: string;
    };

    return {
      issueUrl: payload.html_url,
      issueNumber: payload.number,
      issueTitle: payload.title,
      issueState: payload.state
    };
  }
}
