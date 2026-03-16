import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string) {
    return this.organizationsService.findAll(includeDeleted === "true");
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.organizationsService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.organizationsService.update(id, body);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.organizationsService.restore(id, body.updated_by ? String(body.updated_by) : undefined);
  }
}
