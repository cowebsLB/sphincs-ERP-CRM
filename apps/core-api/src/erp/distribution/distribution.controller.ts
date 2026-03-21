import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
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

  @Get("movements")
  listMovements(
    @Query("movementType") movementType?: string,
    @Query("itemId") itemId?: string,
    @Query("status") status?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listMovements(
      {
        movementType,
        itemId,
        status,
        from,
        to,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("movements")
  createMovement(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createMovement(body, req?.user);
  }
}
