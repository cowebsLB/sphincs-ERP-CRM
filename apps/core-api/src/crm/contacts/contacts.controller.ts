import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ContactsService } from "./contacts.service";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("crm/contacts")
@Roles("Admin", "CRM Manager")
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string): unknown {
    return this.contactsService.findAll(includeDeleted === "true");
  }

  @Post()
  create(@Body() body: Record<string, unknown>): unknown {
    return this.contactsService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>): unknown {
    return this.contactsService.update(id, body);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() body: Record<string, unknown>): unknown {
    return this.contactsService.restore(id, body.updated_by ? String(body.updated_by) : undefined);
  }
}
