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

  @Get("receipts")
  listReceipts(
    @Query("status") status?: string,
    @Query("supplierId") supplierId?: string,
    @Query("branchId") branchId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listReceipts(
      {
        status,
        supplierId,
        branchId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("receipts")
  createReceipt(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createReceipt(body, req?.user);
  }

  @Get("transfers")
  listTransfers(
    @Query("status") status?: string,
    @Query("sourceBranchId") sourceBranchId?: string,
    @Query("destinationBranchId") destinationBranchId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listTransfers(
      {
        status,
        sourceBranchId,
        destinationBranchId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("transfers")
  createTransfer(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createTransfer(body, req?.user);
  }

  @Get("adjustments")
  listAdjustments(
    @Query("status") status?: string,
    @Query("adjustmentType") adjustmentType?: string,
    @Query("branchId") branchId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listAdjustments(
      {
        status,
        adjustmentType,
        branchId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("adjustments")
  createAdjustment(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createAdjustment(body, req?.user);
  }

  @Get("dispatches")
  listDispatches(
    @Query("status") status?: string,
    @Query("branchId") branchId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listDispatches(
      {
        status,
        branchId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("dispatches")
  createDispatch(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createDispatch(body, req?.user);
  }

  @Get("returns")
  listReturns(
    @Query("status") status?: string,
    @Query("returnType") returnType?: string,
    @Query("sourceBranchId") sourceBranchId?: string,
    @Query("destinationBranchId") destinationBranchId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listReturns(
      {
        status,
        returnType,
        sourceBranchId,
        destinationBranchId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("returns")
  createReturn(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createReturn(body, req?.user);
  }
}
