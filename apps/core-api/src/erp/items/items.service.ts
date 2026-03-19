import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export type ItemStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

type UserScope = {
  id: string;
  organizationId: string;
  branchId?: string | null;
};

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly validStatuses: ItemStatus[] = ["ACTIVE", "INACTIVE", "ARCHIVED"];
  private readonly validUnits = ["piece", "kg", "liter", "box", "pack", "unit"];

  private requireScope(scope?: UserScope): UserScope {
    if (!scope?.id || !scope.organizationId) {
      throw new NotFoundException("Missing user scope");
    }
    return scope;
  }

  private parseRequiredString(value: unknown, fieldName: string): string {
    const text = String(value ?? "").trim();
    if (!text) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return text;
  }

  private parseOptionalString(value: unknown): string | null {
    const text = String(value ?? "").trim();
    return text ? text : null;
  }

  private parseCurrency(value: unknown): string {
    const text = String(value ?? "").trim().toUpperCase();
    return text || "USD";
  }

  private parseStatus(value: unknown, fallback: ItemStatus): ItemStatus {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return fallback;
    }
    if (!this.validStatuses.includes(text as ItemStatus)) {
      throw new BadRequestException(`status must be one of: ${this.validStatuses.join(", ")}`);
    }
    return text as ItemStatus;
  }

  private parseBoolean(value: unknown, fallback: boolean): boolean {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }
    if (typeof value === "boolean") {
      return value;
    }
    const text = String(value).trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(text)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(text)) {
      return false;
    }
    throw new BadRequestException("Boolean field contains an invalid value");
  }

  private parseNumber(value: unknown, fieldName: string, fallback: number): number {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`${fieldName} must be a valid number`);
    }
    return parsed;
  }

  private parseInteger(value: unknown, fieldName: string, fallback: number): number {
    const parsed = this.parseNumber(value, fieldName, fallback);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${fieldName} must be a whole number`);
    }
    return parsed;
  }

  private parseOptionalInteger(value: unknown, fieldName: string): number | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    return this.parseInteger(value, fieldName, 0);
  }

  private parseTags(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((tag) => String(tag).trim()).filter(Boolean);
    }
    const text = String(value ?? "").trim();
    if (!text) {
      return [];
    }
    return text
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  private parseUnit(value: unknown): string {
    const text = String(value ?? "").trim().toLowerCase();
    if (!text) {
      return "piece";
    }
    if (!this.validUnits.includes(text)) {
      return text;
    }
    return text;
  }

  private normalizeInventoryFields(body: Record<string, unknown>) {
    const isService = this.parseBoolean(body.is_service, false);
    const trackInventory = !isService && this.parseBoolean(body.track_inventory, true);

    return {
      is_service: isService,
      track_inventory: trackInventory,
      quantity_on_hand: trackInventory ? this.parseInteger(body.quantity_on_hand, "quantity_on_hand", 0) : 0,
      reorder_level: trackInventory ? this.parseInteger(body.reorder_level, "reorder_level", 0) : 0,
      max_stock_level: trackInventory ? this.parseOptionalInteger(body.max_stock_level, "max_stock_level") : null
    };
  }

  findAll(includeDeleted: boolean, scope?: UserScope) {
    const user = this.requireScope(scope);
    return this.prisma.item.findMany({
      where: {
        organization_id: user.organizationId,
        created_by: user.id,
        ...(includeDeleted ? {} : { deleted_at: null })
      },
      orderBy: { created_at: "desc" }
    });
  }

  create(body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const inventoryFields = this.normalizeInventoryFields(body);
    return this.prisma.item.create({
      data: {
        organization_id: user.organizationId,
        branch_id: user.branchId ?? null,
        name: this.parseRequiredString(body.name, "name"),
        sku: this.parseRequiredString(body.sku, "sku").toUpperCase(),
        description: this.parseOptionalString(body.description),
        status: this.parseStatus(body.status, "ACTIVE"),
        cost_price: this.parseNumber(body.cost_price, "cost_price", 0),
        selling_price: this.parseNumber(body.selling_price, "selling_price", 0),
        currency: this.parseCurrency(body.currency),
        category_id: this.parseOptionalString(body.category_id),
        tags: this.parseTags(body.tags),
        brand: this.parseOptionalString(body.brand),
        barcode: this.parseOptionalString(body.barcode),
        unit_of_measure: this.parseUnit(body.unit_of_measure),
        tax_rate: this.parseNumber(body.tax_rate, "tax_rate", 0),
        discountable: this.parseBoolean(body.discountable, true),
        ...inventoryFields,
        created_by: user.id,
        updated_by: user.id
      }
    });
  }

  async update(id: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.item.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      }
    });
    if (!existing) {
      throw new NotFoundException("Item not found");
    }

    return this.prisma.item.update({
      where: { id },
      data: {
        name: body.name === undefined ? undefined : this.parseRequiredString(body.name, "name"),
        sku: body.sku === undefined ? undefined : this.parseRequiredString(body.sku, "sku").toUpperCase(),
        description: body.description === undefined ? undefined : this.parseOptionalString(body.description),
        status: body.status === undefined ? undefined : this.parseStatus(body.status, existing.status as ItemStatus),
        cost_price: body.cost_price === undefined ? undefined : this.parseNumber(body.cost_price, "cost_price", 0),
        selling_price:
          body.selling_price === undefined ? undefined : this.parseNumber(body.selling_price, "selling_price", 0),
        currency: body.currency === undefined ? undefined : this.parseCurrency(body.currency),
        category_id: body.category_id === undefined ? undefined : this.parseOptionalString(body.category_id),
        tags: body.tags === undefined ? undefined : this.parseTags(body.tags),
        brand: body.brand === undefined ? undefined : this.parseOptionalString(body.brand),
        barcode: body.barcode === undefined ? undefined : this.parseOptionalString(body.barcode),
        unit_of_measure: body.unit_of_measure === undefined ? undefined : this.parseUnit(body.unit_of_measure),
        tax_rate: body.tax_rate === undefined ? undefined : this.parseNumber(body.tax_rate, "tax_rate", 0),
        discountable:
          body.discountable === undefined ? undefined : this.parseBoolean(body.discountable, existing.discountable ?? true),
        ...(body.track_inventory !== undefined ||
        body.quantity_on_hand !== undefined ||
        body.reorder_level !== undefined ||
        body.max_stock_level !== undefined ||
        body.is_service !== undefined
          ? this.normalizeInventoryFields({
              ...existing,
              ...body
            })
          : {}),
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: user.id
      }
    });
  }

  async restore(id: string, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.item.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      }
    });
    if (!existing) {
      throw new NotFoundException("Item not found");
    }
    return this.prisma.item.update({
      where: { id },
      data: {
        deleted_at: null,
        updated_by: user.id
      }
    });
  }
}
