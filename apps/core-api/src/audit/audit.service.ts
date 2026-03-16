import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Prisma } from "@prisma/client";

export interface AuditRecordInput {
  organizationId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditRecordInput) {
    await this.prisma.auditLog.create({
      data: {
        organization_id: input.organizationId,
        user_id: input.userId,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId,
        metadata: ((input.metadata ?? {}) as Prisma.InputJsonValue),
        created_by: input.userId,
        updated_by: input.userId
      }
    });
  }

  findAll(query: Record<string, string>) {
    return this.prisma.auditLog.findMany({
      where: {
        action: query.action ?? undefined,
        entity_type: query.entityType ?? undefined,
        user_id: query.userId ?? undefined,
        organization_id: query.organizationId ?? undefined
      },
      orderBy: { created_at: "desc" },
      take: query.limit ? Number(query.limit) : 100
    });
  }
}
