import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseOptionalPlanId(value: unknown): number | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === "") {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return undefined;
    }
    return parsed;
  }

  findAll(includeDeleted = false) {
    return this.prisma.organization.findMany({
      where: includeDeleted ? {} : { deleted_at: null },
      orderBy: { created_at: "desc" }
    });
  }

  create(body: Record<string, unknown>) {
    const planId = this.parseOptionalPlanId(body.plan_id);
    return this.prisma.organization.create({
      data: {
        name: String(body.name ?? "Unnamed organization"),
        plan_id: planId ?? null,
        created_by: body.created_by ? String(body.created_by) : null,
        updated_by: body.updated_by ? String(body.updated_by) : null
      }
    });
  }

  async update(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Organization not found");
    }

    const planId = this.parseOptionalPlanId(body.plan_id);
    return this.prisma.organization.update({
      where: { id },
      data: {
        name: body.name ? String(body.name) : undefined,
        plan_id: planId,
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: body.updated_by ? String(body.updated_by) : undefined
      }
    });
  }

  async findSettings(id: string) {
    const existing = await this.prisma.organization.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, name: true }
    });
    if (!existing) {
      throw new NotFoundException("Organization not found");
    }
    return this.prisma.organizationSetting.findMany({
      where: { organization_id: id },
      orderBy: { key: "asc" }
    });
  }

  async restore(id: string, updatedBy?: string) {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Organization not found");
    }
    return this.prisma.organization.update({
      where: { id },
      data: {
        deleted_at: null,
        updated_by: updatedBy ?? undefined
      }
    });
  }
}
