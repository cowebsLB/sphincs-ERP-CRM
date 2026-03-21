import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
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

  @Patch("transfers/:transferId/request")
  requestTransfer(
    @Param("transferId") transferId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionTransfer(transferId, { ...body, action: "REQUEST" }, req?.user);
  }

  @Patch("transfers/:transferId/approve")
  approveTransfer(
    @Param("transferId") transferId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionTransfer(transferId, { ...body, action: "APPROVE" }, req?.user);
  }

  @Patch("transfers/:transferId/dispatch")
  dispatchTransfer(
    @Param("transferId") transferId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionTransfer(transferId, { ...body, action: "DISPATCH" }, req?.user);
  }

  @Patch("transfers/:transferId/receive")
  receiveTransfer(
    @Param("transferId") transferId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionTransfer(transferId, { ...body, action: "RECEIVE" }, req?.user);
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

  @Patch("dispatches/:dispatchId/ready")
  markDispatchReady(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "READY" }, req?.user);
  }

  @Patch("dispatches/:dispatchId/pack")
  packDispatch(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "PACK" }, req?.user);
  }

  @Patch("dispatches/:dispatchId/dispatch")
  markDispatchDispatched(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "DISPATCH" }, req?.user);
  }

  @Patch("dispatches/:dispatchId/deliver")
  deliverDispatch(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "DELIVER" }, req?.user);
  }

  @Patch("dispatches/:dispatchId/fail")
  failDispatch(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "FAIL" }, req?.user);
  }

  @Patch("dispatches/:dispatchId/return")
  returnDispatch(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "RETURN" }, req?.user);
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
