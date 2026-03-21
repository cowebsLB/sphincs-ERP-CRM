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

const DISTRIBUTION_READ_ROLES = [
  "Admin",
  "ERP Manager",
  "Staff",
  "Warehouse Staff",
  "Branch Manager",
  "Read-Only Auditor"
] as const;

const DISTRIBUTION_WRITE_ROLES = ["Admin", "ERP Manager", "Staff", "Warehouse Staff", "Branch Manager"] as const;
const DISTRIBUTION_APPROVAL_ROLES = ["Admin", "ERP Manager", "Branch Manager"] as const;

@Controller("distribution")
@Roles("Admin", "ERP Manager", "Staff", "Warehouse Staff", "Branch Manager", "Read-Only Auditor")
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Get("dashboard")
  @Roles(...DISTRIBUTION_READ_ROLES)
  dashboard(@Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.dashboard(req?.user);
  }

  @Get("movements")
  @Roles(...DISTRIBUTION_READ_ROLES)
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
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createMovement(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createMovement(body, req?.user);
  }

  @Get("receipts")
  @Roles(...DISTRIBUTION_READ_ROLES)
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
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createReceipt(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createReceipt(body, req?.user);
  }

  @Get("transfers")
  @Roles(...DISTRIBUTION_READ_ROLES)
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
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createTransfer(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createTransfer(body, req?.user);
  }

  @Patch("transfers/:transferId/request")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  requestTransfer(
    @Param("transferId") transferId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionTransfer(transferId, { ...body, action: "REQUEST" }, req?.user);
  }

  @Patch("transfers/:transferId/approve")
  @Roles(...DISTRIBUTION_APPROVAL_ROLES)
  approveTransfer(
    @Param("transferId") transferId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionTransfer(transferId, { ...body, action: "APPROVE" }, req?.user);
  }

  @Patch("transfers/:transferId/dispatch")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  dispatchTransfer(
    @Param("transferId") transferId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionTransfer(transferId, { ...body, action: "DISPATCH" }, req?.user);
  }

  @Patch("transfers/:transferId/receive")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  receiveTransfer(
    @Param("transferId") transferId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionTransfer(transferId, { ...body, action: "RECEIVE" }, req?.user);
  }

  @Get("adjustments")
  @Roles(...DISTRIBUTION_READ_ROLES)
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
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createAdjustment(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createAdjustment(body, req?.user);
  }

  @Patch("adjustments/:adjustmentId/submit")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  submitAdjustment(
    @Param("adjustmentId") adjustmentId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionAdjustment(adjustmentId, { ...body, action: "SUBMIT" }, req?.user);
  }

  @Patch("adjustments/:adjustmentId/approve")
  @Roles(...DISTRIBUTION_APPROVAL_ROLES)
  approveAdjustment(
    @Param("adjustmentId") adjustmentId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionAdjustment(adjustmentId, { ...body, action: "APPROVE" }, req?.user);
  }

  @Patch("adjustments/:adjustmentId/apply")
  @Roles(...DISTRIBUTION_APPROVAL_ROLES)
  applyAdjustment(
    @Param("adjustmentId") adjustmentId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionAdjustment(adjustmentId, { ...body, action: "APPLY" }, req?.user);
  }

  @Patch("adjustments/:adjustmentId/reverse")
  @Roles(...DISTRIBUTION_APPROVAL_ROLES)
  reverseAdjustment(
    @Param("adjustmentId") adjustmentId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionAdjustment(adjustmentId, { ...body, action: "REVERSE" }, req?.user);
  }

  @Get("dispatches")
  @Roles(...DISTRIBUTION_READ_ROLES)
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
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createDispatch(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createDispatch(body, req?.user);
  }

  @Patch("dispatches/:dispatchId/ready")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  markDispatchReady(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "READY" }, req?.user);
  }

  @Patch("dispatches/:dispatchId/pack")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  packDispatch(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "PACK" }, req?.user);
  }

  @Patch("dispatches/:dispatchId/dispatch")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  markDispatchDispatched(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "DISPATCH" }, req?.user);
  }

  @Patch("dispatches/:dispatchId/deliver")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  deliverDispatch(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "DELIVER" }, req?.user);
  }

  @Patch("dispatches/:dispatchId/fail")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  failDispatch(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "FAIL" }, req?.user);
  }

  @Patch("dispatches/:dispatchId/return")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  returnDispatch(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatch(dispatchId, { ...body, action: "RETURN" }, req?.user);
  }

  @Get("returns")
  @Roles(...DISTRIBUTION_READ_ROLES)
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
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createReturn(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createReturn(body, req?.user);
  }

  @Patch("returns/:returnId/receive")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  receiveReturn(
    @Param("returnId") returnId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionReturn(returnId, { ...body, action: "RECEIVE" }, req?.user);
  }

  @Patch("returns/:returnId/inspect")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  inspectReturn(
    @Param("returnId") returnId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionReturn(returnId, { ...body, action: "INSPECT" }, req?.user);
  }

  @Patch("returns/:returnId/complete")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  completeReturn(
    @Param("returnId") returnId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionReturn(returnId, { ...body, action: "COMPLETE" }, req?.user);
  }

  @Patch("returns/:returnId/cancel")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  cancelReturn(
    @Param("returnId") returnId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionReturn(returnId, { ...body, action: "CANCEL" }, req?.user);
  }

  @Get("reservations")
  @Roles(...DISTRIBUTION_READ_ROLES)
  listReservations(
    @Query("status") status?: string,
    @Query("branchId") branchId?: string,
    @Query("itemId") itemId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listReservations(
      {
        status,
        branchId,
        itemId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("reservations")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createReservation(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createReservation(body, req?.user);
  }

  @Get("reorder-rules")
  @Roles(...DISTRIBUTION_READ_ROLES)
  listReorderRules(
    @Query("branchId") branchId?: string,
    @Query("itemId") itemId?: string,
    @Query("isActive") isActive?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listReorderRules(
      {
        branchId,
        itemId,
        isActive: isActive === undefined ? undefined : isActive === "true",
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("reorder-rules")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createReorderRule(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createReorderRule(body, req?.user);
  }

  @Get("restocking-suggestions")
  @Roles(...DISTRIBUTION_READ_ROLES)
  listRestockingSuggestions(
    @Query("branchId") branchId?: string,
    @Query("includeInactive") includeInactive?: string,
    @Query("includeZero") includeZero?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listRestockingSuggestions(
      {
        branchId,
        includeInactive: includeInactive === "true",
        includeZero: includeZero === "true",
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("alerts")
  @Roles(...DISTRIBUTION_READ_ROLES)
  listAlerts(
    @Query("status") status?: string,
    @Query("severity") severity?: string,
    @Query("branchId") branchId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listAlerts(
      {
        status,
        severity,
        branchId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Patch("alerts/:alertId/resolve")
  @Roles(...DISTRIBUTION_APPROVAL_ROLES)
  resolveAlert(
    @Param("alertId") alertId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.resolveAlert(alertId, body, req?.user);
  }

  @Get("reports/stock-on-hand")
  @Roles(...DISTRIBUTION_READ_ROLES)
  stockOnHandReport(
    @Query("branchId") branchId?: string,
    @Query("itemId") itemId?: string,
    @Query("lowOnly") lowOnly?: string,
    @Query("outOnly") outOnly?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.stockOnHandReport(
      {
        branchId,
        itemId,
        lowOnly: lowOnly === "true",
        outOnly: outOnly === "true",
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("reports/movements")
  @Roles(...DISTRIBUTION_READ_ROLES)
  movementHistoryReport(
    @Query("movementType") movementType?: string,
    @Query("branchId") branchId?: string,
    @Query("itemId") itemId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.movementHistoryReport(
      {
        movementType,
        branchId,
        itemId,
        from,
        to,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("reports/transfers")
  @Roles(...DISTRIBUTION_READ_ROLES)
  transferPerformanceReport(
    @Query("status") status?: string,
    @Query("sourceBranchId") sourceBranchId?: string,
    @Query("destinationBranchId") destinationBranchId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transferPerformanceReport(
      {
        status,
        sourceBranchId,
        destinationBranchId,
        from,
        to,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("reports/adjustments")
  @Roles(...DISTRIBUTION_READ_ROLES)
  adjustmentVarianceReport(
    @Query("status") status?: string,
    @Query("adjustmentType") adjustmentType?: string,
    @Query("branchId") branchId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.adjustmentVarianceReport(
      {
        status,
        adjustmentType,
        branchId,
        from,
        to,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }
}
