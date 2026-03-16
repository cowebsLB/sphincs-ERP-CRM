import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

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
  private readonly logs: Array<AuditRecordInput & { id: string; timestamp: string }> = [];

  record(input: AuditRecordInput) {
    this.logs.push({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...input
    });
  }

  findAll(query: Record<string, string>) {
    return this.logs.filter((entry) => {
      if (query.action && entry.action !== query.action) {
        return false;
      }
      if (query.entityType && entry.entityType !== query.entityType) {
        return false;
      }
      return true;
    });
  }
}
