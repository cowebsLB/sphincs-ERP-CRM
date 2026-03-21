import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { Roles } from "../../common/decorators/roles.decorator";

type AuthenticatedRequest = {
  user?: {
    id: string;
    organizationId: string;
    branchId?: string | null;
  };
};

@Controller("crm/leads")
@Roles("Admin", "CRM Manager", "Staff")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string, @Req() req?: AuthenticatedRequest): unknown {
    return this.leadsService.findAll(includeDeleted === "true", req?.user);
  }

  @Post()
  create(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.leadsService.create(body, req?.user);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.leadsService.update(id, body, req?.user);
  }

  @Post(":id/convert-to-opportunity")
  convertToOpportunity(
    @Param("id") id: string,
    @Body() body: Record<string, unknown>,
    @Req() req?: AuthenticatedRequest
  ): unknown {
    return this.leadsService.convertToOpportunity(id, body, req?.user);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() _body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.leadsService.restore(id, req?.user);
  }
}
