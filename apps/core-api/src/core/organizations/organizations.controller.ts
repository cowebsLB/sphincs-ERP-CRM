import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.organizationsService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.organizationsService.update(id, body);
  }
}
