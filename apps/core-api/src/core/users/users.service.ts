import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

@Injectable()
export class UsersService {
  findAll() {
    return [];
  }

  create(body: Record<string, unknown>) {
    return { id: randomUUID(), ...body };
  }

  update(body: Record<string, unknown>) {
    return body;
  }
}
