import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.usersService.create(body);
  }

  @Patch(":id")
  update(@Body() body: Record<string, unknown>) {
    return this.usersService.update(body);
  }
}

