import { Body, Controller, Post, Req, UnauthorizedException } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateBugReportDto } from "./dto/create-bug-report.dto";
import { BugsService } from "./bugs.service";

type AuthenticatedRequest = {
  user?: {
    id: string;
    email: string;
    roles: string[];
    organizationId: string;
    branchId?: string | null;
  };
};

@Controller("bugs")
@Roles("Admin", "ERP Manager", "CRM Manager", "Staff")
export class BugsController {
  constructor(private readonly bugsService: BugsService) {}

  @Post("report")
  report(@Body() body: CreateBugReportDto, @Req() req?: AuthenticatedRequest) {
    const user = req?.user;
    if (!user) {
      throw new UnauthorizedException("Missing authenticated user context");
    }
    return this.bugsService.createGithubIssue(body, user);
  }
}
