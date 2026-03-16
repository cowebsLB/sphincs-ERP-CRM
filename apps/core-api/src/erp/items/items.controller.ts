import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ItemsService } from "./items.service";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("erp/items")
@Roles("Admin", "ERP Manager")
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string): unknown {
    return this.itemsService.findAll(includeDeleted === "true");
  }

  @Post()
  create(@Body() body: Record<string, unknown>): unknown {
    return this.itemsService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>): unknown {
    return this.itemsService.update(id, body);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() body: Record<string, unknown>): unknown {
    return this.itemsService.restore(id, body.updated_by ? String(body.updated_by) : undefined);
  }
}
