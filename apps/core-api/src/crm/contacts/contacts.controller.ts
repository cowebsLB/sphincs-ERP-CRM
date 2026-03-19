import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ContactsService } from "./contacts.service";
import { Roles } from "../../common/decorators/roles.decorator";

type AuthenticatedRequest = {
  user?: {
    id: string;
    organizationId: string;
    branchId?: string | null;
  };
};

@Controller("crm/contacts")
@Roles("Admin", "CRM Manager", "Staff")
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  findAll(@Query("includeDeleted") includeDeleted?: string, @Req() req?: AuthenticatedRequest): unknown {
    return this.contactsService.findAll(includeDeleted === "true", req?.user);
  }

  @Post()
  create(@Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.contactsService.create(body, req?.user);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.contactsService.update(id, body, req?.user);
  }

  @Post(":id/restore")
  restore(@Param("id") id: string, @Body() _body: Record<string, unknown>, @Req() req?: AuthenticatedRequest): unknown {
    return this.contactsService.restore(id, req?.user);
  }
}
