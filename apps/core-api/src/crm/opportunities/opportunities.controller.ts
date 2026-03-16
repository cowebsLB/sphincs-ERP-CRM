import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { OpportunitiesService } from "./opportunities.service";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("crm/opportunities")
@Roles("Admin", "CRM Manager")
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string): unknown {
    return this.opportunitiesService.findAll(includeDeleted === "true");
  }

  @Post()
  create(@Body() body: Record<string, unknown>): unknown {
    return this.opportunitiesService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>): unknown {
    return this.opportunitiesService.update(id, body);
  }
}
