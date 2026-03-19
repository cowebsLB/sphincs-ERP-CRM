import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { OpportunitiesService } from "./opportunities.service";
import { Roles } from "../../common/decorators/roles.decorator";

type AuthenticatedRequest = {
  user?: {
    id: string;
    organizationId: string;
    branchId?: string | null;
  };
};

@Controller("crm/opportunities")
@Roles("Admin", "CRM Manager", "Staff")
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string, @Req() req?: AuthenticatedRequest): unknown {
    return this.opportunitiesService.findAll(includeDeleted === "true", req?.user);
  }

  @Post()
  create(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.opportunitiesService.create(body, req?.user);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.opportunitiesService.update(id, body, req?.user);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() _body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.opportunitiesService.restore(id, req?.user);
  }
}
