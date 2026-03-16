import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { BranchesService } from "./branches.service";

@Controller("branches")
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.branchesService.create(body);
  }

  @Patch(":id")
  update(@Body() body: Record<string, unknown>) {
    return this.branchesService.update(body);
  }
}

