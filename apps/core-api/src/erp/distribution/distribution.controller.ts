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

  @Get("inventory-stocks")
  @Roles(...DISTRIBUTION_READ_ROLES)
  listInventoryStocks(
    @Query("branchId") branchId?: string,
    @Query("itemId") itemId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listInventoryStocks(
      {
        branchId,
        itemId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("inventory-stocks")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createInventoryStock(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createInventoryStock(body, req?.user);
  }

  @Patch("inventory-stocks/:stockId")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  updateInventoryStock(
    @Param("stockId") stockId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.updateInventoryStock(stockId, body, req?.user);
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

  @Get("dispatches/:dispatchId/pick-jobs")
  @Roles(...DISTRIBUTION_READ_ROLES)
  listDispatchPickJobs(
    @Param("dispatchId") dispatchId: string,
    @Query("status") status?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listDispatchPickJobs(
      dispatchId,
      {
        status,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("dispatches/:dispatchId/pick-jobs")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createDispatchPickJob(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.createDispatchPickJob(dispatchId, body, req?.user);
  }

  @Patch("pick-jobs/:pickJobId/start")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  startDispatchPickJob(
    @Param("pickJobId") pickJobId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatchPickJob(pickJobId, { ...body, action: "START" }, req?.user);
  }

  @Patch("pick-jobs/:pickJobId/complete")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  completeDispatchPickJob(
    @Param("pickJobId") pickJobId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatchPickJob(pickJobId, { ...body, action: "COMPLETE" }, req?.user);
  }

  @Patch("pick-jobs/:pickJobId/cancel")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  cancelDispatchPickJob(
    @Param("pickJobId") pickJobId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatchPickJob(pickJobId, { ...body, action: "CANCEL" }, req?.user);
  }

  @Get("dispatches/:dispatchId/pack-jobs")
  @Roles(...DISTRIBUTION_READ_ROLES)
  listDispatchPackJobs(
    @Param("dispatchId") dispatchId: string,
    @Query("status") status?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listDispatchPackJobs(
      dispatchId,
      {
        status,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("dispatches/:dispatchId/pack-jobs")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createDispatchPackJob(
    @Param("dispatchId") dispatchId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.createDispatchPackJob(dispatchId, body, req?.user);
  }

  @Patch("pack-jobs/:packJobId/start")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  startDispatchPackJob(
    @Param("packJobId") packJobId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatchPackJob(packJobId, { ...body, action: "START" }, req?.user);
  }

  @Patch("pack-jobs/:packJobId/complete")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  completeDispatchPackJob(
    @Param("packJobId") packJobId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatchPackJob(packJobId, { ...body, action: "COMPLETE" }, req?.user);
  }

  @Patch("pack-jobs/:packJobId/cancel")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  cancelDispatchPackJob(
    @Param("packJobId") packJobId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionDispatchPackJob(packJobId, { ...body, action: "CANCEL" }, req?.user);
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

  @Get("warehouse-locations")
  @Roles(...DISTRIBUTION_READ_ROLES)
  listWarehouseLocations(
    @Query("branchId") branchId?: string,
    @Query("parentLocationId") parentLocationId?: string,
    @Query("isActive") isActive?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listWarehouseLocations(
      {
        branchId,
        parentLocationId,
        isActive: isActive === undefined ? undefined : isActive === "true",
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("warehouse-locations")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createWarehouseLocation(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createWarehouseLocation(body, req?.user);
  }

  @Patch("warehouse-locations/:locationId/activate")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  activateWarehouseLocation(
    @Param("locationId") locationId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionWarehouseLocation(locationId, { ...body, action: "ACTIVATE" }, req?.user);
  }

  @Patch("warehouse-locations/:locationId/deactivate")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  deactivateWarehouseLocation(
    @Param("locationId") locationId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionWarehouseLocation(
      locationId,
      { ...body, action: "DEACTIVATE" },
      req?.user
    );
  }

  @Get("lots")
  @Roles(...DISTRIBUTION_READ_ROLES)
  listLots(
    @Query("branchId") branchId?: string,
    @Query("itemId") itemId?: string,
    @Query("supplierId") supplierId?: string,
    @Query("status") status?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listLots(
      {
        branchId,
        itemId,
        supplierId,
        status,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("lots")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createLot(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createLot(body, req?.user);
  }

  @Patch("lots/:lotId/activate")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  activateLot(
    @Param("lotId") lotId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionLotStatus(lotId, { ...body, action: "ACTIVATE" }, req?.user);
  }

  @Patch("lots/:lotId/hold")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  holdLot(@Param("lotId") lotId: string, @Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest) {
    return this.distributionService.transitionLotStatus(lotId, { ...body, action: "HOLD" }, req?.user);
  }

  @Patch("lots/:lotId/exhaust")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  exhaustLot(
    @Param("lotId") lotId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionLotStatus(lotId, { ...body, action: "EXHAUST" }, req?.user);
  }

  @Patch("lots/:lotId/close")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  closeLot(@Param("lotId") lotId: string, @Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest) {
    return this.distributionService.transitionLotStatus(lotId, { ...body, action: "CLOSE" }, req?.user);
  }

  @Get("lot-balances")
  @Roles(...DISTRIBUTION_READ_ROLES)
  listLotBalances(
    @Query("branchId") branchId?: string,
    @Query("itemId") itemId?: string,
    @Query("lotId") lotId?: string,
    @Query("locationId") locationId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.listLotBalances(
      {
        branchId,
        itemId,
        lotId,
        locationId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Post("lot-balances")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  createLotBalance(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.distributionService.createLotBalance(body, req?.user);
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

  @Patch("reservations/:reservationId/release")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  releaseReservation(
    @Param("reservationId") reservationId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionReservation(reservationId, { ...body, action: "RELEASE" }, req?.user);
  }

  @Patch("reservations/:reservationId/fulfill")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  fulfillReservation(
    @Param("reservationId") reservationId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionReservation(reservationId, { ...body, action: "FULFILL" }, req?.user);
  }

  @Patch("reservations/:reservationId/cancel")
  @Roles(...DISTRIBUTION_WRITE_ROLES)
  cancelReservation(
    @Param("reservationId") reservationId: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.transitionReservation(reservationId, { ...body, action: "CANCEL" }, req?.user);
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

  @Get("reports/receipts")
  @Roles(...DISTRIBUTION_READ_ROLES)
  receiptFulfillmentReport(
    @Query("status") status?: string,
    @Query("supplierId") supplierId?: string,
    @Query("branchId") branchId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.receiptFulfillmentReport(
      {
        status,
        supplierId,
        branchId,
        from,
        to,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("reports/stock-loss")
  @Roles(...DISTRIBUTION_READ_ROLES)
  stockLossReport(
    @Query("branchId") branchId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.stockLossReport(
      {
        branchId,
        from,
        to,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("reports/stock-valuation")
  @Roles(...DISTRIBUTION_READ_ROLES)
  stockValuationReport(
    @Query("branchId") branchId?: string,
    @Query("itemId") itemId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.stockValuationReport(
      {
        branchId,
        itemId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("reports/fast-slow-movers")
  @Roles(...DISTRIBUTION_READ_ROLES)
  fastSlowMoverReport(
    @Query("branchId") branchId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("minMovements") minMovements?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.fastSlowMoverReport(
      {
        branchId,
        from,
        to,
        minMovements: minMovements ? Number(minMovements) : undefined,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("reports/supplier-fulfillment")
  @Roles(...DISTRIBUTION_READ_ROLES)
  supplierFulfillmentReport(
    @Query("supplierId") supplierId?: string,
    @Query("branchId") branchId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.supplierFulfillmentReport(
      {
        supplierId,
        branchId,
        from,
        to,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("reports/operations-exceptions")
  @Roles(...DISTRIBUTION_READ_ROLES)
  operationsExceptionsReport(
    @Query("branchId") branchId?: string,
    @Query("receiptOverdueDays") receiptOverdueDays?: string,
    @Query("transferOverdueDays") transferOverdueDays?: string,
    @Query("dispatchOverdueDays") dispatchOverdueDays?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.operationsExceptionsReport(
      {
        branchId,
        receiptOverdueDays: receiptOverdueDays ? Number(receiptOverdueDays) : undefined,
        transferOverdueDays: transferOverdueDays ? Number(transferOverdueDays) : undefined,
        dispatchOverdueDays: dispatchOverdueDays ? Number(dispatchOverdueDays) : undefined,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("reports/branch-sla")
  @Roles(...DISTRIBUTION_READ_ROLES)
  branchSlaReport(
    @Query("branchId") branchId?: string,
    @Query("slaDays") slaDays?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.branchSlaReport(
      {
        branchId,
        slaDays: slaDays ? Number(slaDays) : undefined,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("reports/inactive-stock")
  @Roles(...DISTRIBUTION_READ_ROLES)
  inactiveStockReport(
    @Query("branchId") branchId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.inactiveStockReport(
      {
        branchId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }

  @Get("reports/shortages")
  @Roles(...DISTRIBUTION_READ_ROLES)
  shortageReport(
    @Query("branchId") branchId?: string,
    @Query("supplierId") supplierId?: string,
    @Query("includeDeleted") includeDeleted?: string,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.distributionService.shortageReport(
      {
        branchId,
        supplierId,
        includeDeleted: includeDeleted === "true"
      },
      req?.user
    );
  }
}
