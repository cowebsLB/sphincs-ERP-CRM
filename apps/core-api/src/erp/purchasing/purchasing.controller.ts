import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { PurchasingService } from "./purchasing.service";
import { Roles } from "../../common/decorators/roles.decorator";

type AuthenticatedRequest = {
  user?: {
    id: string;
    organizationId: string;
    branchId?: string | null;
  };
};

@Controller("erp/purchase-orders")
@Roles("Admin", "ERP Manager", "Staff")
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string, @Req() req?: AuthenticatedRequest): unknown {
    return this.purchasingService.findAll(includeDeleted === "true", req?.user);
  }

  @Post()
  create(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.purchasingService.create(body, req?.user);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.purchasingService.update(id, body, req?.user);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() _body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.purchasingService.restore(id, req?.user);
  }
}
