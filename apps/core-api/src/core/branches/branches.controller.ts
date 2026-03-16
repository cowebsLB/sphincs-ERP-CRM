import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { BranchesService } from "./branches.service";

@Controller("branches")
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string) {
    return this.branchesService.findAll(includeDeleted === "true");
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.branchesService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.branchesService.update(id, body);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.branchesService.restore(id, body.updated_by ? String(body.updated_by) : undefined);
  }
}
