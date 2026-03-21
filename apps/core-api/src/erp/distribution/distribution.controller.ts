import { Controller, Get, Req } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { DistributionService } from "./distribution.service";

type AuthenticatedRequest = {
  user?: {
    id: string;
    organizationId: string;
    branchId?: string | null;
  };
};

@Controller("distribution")
@Roles("Admin", "ERP Manager", "Staff", "Warehouse Staff", "Branch Manager", "Read-Only Auditor")
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Get("dashboard")
  dashboard(@Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.dashboard(req?.user);
  }
}

