import { Injectable } from "@nestjs/common";

@Injectable()
export class RolesService {
  findAll() {
    return ["Admin", "ERP Manager", "CRM Manager", "Staff"];
  }
}

