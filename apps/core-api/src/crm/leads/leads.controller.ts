import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("crm/leads")
@Roles("Admin", "CRM Manager")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string): unknown {
    return this.leadsService.findAll(includeDeleted === "true");
  }

  @Post()
  create(@Body() body: Record<string, unknown>): unknown {
    return this.leadsService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>): unknown {
    return this.leadsService.update(id, body);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() body: Record<string, unknown>): unknown {
    return this.leadsService.restore(id, body.updated_by ? String(body.updated_by) : undefined);
  }
}
