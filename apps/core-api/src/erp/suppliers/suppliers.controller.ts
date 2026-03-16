import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { SuppliersService } from "./suppliers.service";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("erp/suppliers")
@Roles("Admin", "ERP Manager")
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string): unknown {
    return this.suppliersService.findAll(includeDeleted === "true");
  }

  @Post()
  create(@Body() body: Record<string, unknown>): unknown {
    return this.suppliersService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>): unknown {
    return this.suppliersService.update(id, body);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() body: Record<string, unknown>): unknown {
    return this.suppliersService.restore(id, body.updated_by ? String(body.updated_by) : undefined);
  }
}
