import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { PurchasingService } from "./purchasing.service";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("erp/purchase-orders")
@Roles("Admin", "ERP Manager")
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string): unknown {
    return this.purchasingService.findAll(includeDeleted === "true");
  }

  @Post()
  create(@Body() body: Record<string, unknown>): unknown {
    return this.purchasingService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>): unknown {
    return this.purchasingService.update(id, body);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() body: Record<string, unknown>): unknown {
    return this.purchasingService.restore(id, body.updated_by ? String(body.updated_by) : undefined);
  }
}
