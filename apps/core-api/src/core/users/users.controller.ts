import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string) {
    return this.usersService.findAll(includeDeleted === "true");
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.usersService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.usersService.update(id, body);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.usersService.restore(id, body.updated_by ? String(body.updated_by) : undefined);
  }
}
