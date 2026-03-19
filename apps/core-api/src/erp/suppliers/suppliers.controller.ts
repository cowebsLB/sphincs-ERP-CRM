import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { SuppliersService } from "./suppliers.service";
import { Roles } from "../../common/decorators/roles.decorator";

type AuthenticatedRequest = {
  user?: {
    id: string;
    organizationId: string;
    branchId?: string | null;
  };
};

@Controller("erp/suppliers")
@Roles("Admin", "ERP Manager", "Staff")
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string, @Req() req?: AuthenticatedRequest): unknown {
    return this.suppliersService.findAll(includeDeleted === "true", req?.user);
  }

  @Post()
  create(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.suppliersService.create(body, req?.user);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.suppliersService.update(id, body, req?.user);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() _body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.suppliersService.restore(id, req?.user);
  }
}
