import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../../prisma.service";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeDeleted = false) {
    return this.prisma.user.findMany({
      where: includeDeleted ? {} : { deleted_at: null },
      orderBy: { created_at: "desc" }
    });
  }

  create(body: Record<string, unknown>) {
    const rawPassword = String(body.password ?? "ChangeMe123!");
    return this.prisma.user.create({
      data: {
        organization_id: String(body.organization_id ?? "00000000-0000-0000-0000-000000000001"),
        branch_id: body.branch_id ? String(body.branch_id) : null,
        email: String(body.email ?? `user-${Date.now()}@sphincs.local`),
        password_hash: hashPassword(rawPassword),
        status: String(body.status ?? "ACTIVE"),
        created_by: body.created_by ? String(body.created_by) : null,
        updated_by: body.updated_by ? String(body.updated_by) : null
      }
    });
  }

  async update(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        branch_id: body.branch_id === undefined ? undefined : (body.branch_id ? String(body.branch_id) : null),
        status: body.status ? String(body.status) : undefined,
        password_hash: body.password ? hashPassword(String(body.password)) : undefined,
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: body.updated_by ? String(body.updated_by) : undefined
      }
    });
  }
}
