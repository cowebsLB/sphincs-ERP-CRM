import { Controller, Get, Param } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesService } from "./roles.service";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get(":id/permissions")
  @Roles("Admin")
  findPermissions(@Param("id") id: string) {
    return this.rolesService.findPermissionsForRole(id);
  }

  @Get()
  @Roles("Admin")
  findAll() {
    return this.rolesService.findAll();
  }
}
