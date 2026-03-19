import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

export type SupplierStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";

type UserScope = {
  id: string;
  organizationId: string;
  branchId?: string | null;
};

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly validStatuses: SupplierStatus[] = ["ACTIVE", "INACTIVE", "BLACKLISTED"];

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

  private parseStatus(value: unknown, fallback: SupplierStatus): SupplierStatus {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) {
      return fallback;
    }
    if (!this.validStatuses.includes(text as SupplierStatus)) {
      throw new BadRequestException(`status must be one of: ${this.validStatuses.join(", ")}`);
    }
    return text as SupplierStatus;
  }

  private parseCurrency(value: unknown): string {
    const text = String(value ?? "").trim().toUpperCase();
    return text || "USD";
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

  private parseOptionalInteger(value: unknown, fieldName: string): number | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${fieldName} must be a whole number`);
    }
    return parsed;
  }

  private parseSupplierCode(value: unknown): string | null {
    const text = String(value ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");
    return text ? text.slice(0, 32) : null;
  }

  findAll(includeDeleted: boolean, scope?: UserScope) {
    const user = this.requireScope(scope);
    return this.prisma.supplier.findMany({
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
    return this.prisma.supplier.create({
      data: {
        organization_id: user.organizationId,
        branch_id: user.branchId ?? null,
        name: this.parseRequiredString(body.name, "name"),
        supplier_code: this.parseSupplierCode(body.supplier_code),
        status: this.parseStatus(body.status, "ACTIVE"),
        email: this.parseOptionalString(body.email),
        phone: this.parseOptionalString(body.phone),
        mobile: this.parseOptionalString(body.mobile),
        website: this.parseOptionalString(body.website),
        country: this.parseOptionalString(body.country),
        city: this.parseOptionalString(body.city),
        address_line_1: this.parseOptionalString(body.address_line_1),
        address_line_2: this.parseOptionalString(body.address_line_2),
        postal_code: this.parseOptionalString(body.postal_code),
        payment_terms: this.parseOptionalString(body.payment_terms),
        currency: this.parseCurrency(body.currency),
        tax_id: this.parseOptionalString(body.tax_id),
        vat_number: this.parseOptionalString(body.vat_number),
        credit_limit: this.parseNumber(body.credit_limit, "credit_limit", 0),
        balance: 0,
        contact_name: this.parseOptionalString(body.contact_name),
        contact_email: this.parseOptionalString(body.contact_email),
        contact_phone: this.parseOptionalString(body.contact_phone),
        notes: this.parseOptionalString(body.notes),
        rating: this.parseOptionalInteger(body.rating, "rating"),
        preferred_supplier: this.parseBoolean(body.preferred_supplier, false),
        created_by: user.id,
        updated_by: user.id
      }
    });
  }

  async update(id: string, body: Record<string, unknown>, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.supplier.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      }
    });
    if (!existing) {
      throw new NotFoundException("Supplier not found");
    }

    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: body.name === undefined ? undefined : this.parseRequiredString(body.name, "name"),
        supplier_code: body.supplier_code === undefined ? undefined : this.parseSupplierCode(body.supplier_code),
        status: body.status === undefined ? undefined : this.parseStatus(body.status, existing.status as SupplierStatus),
        email: body.email === undefined ? undefined : this.parseOptionalString(body.email),
        phone: body.phone === undefined ? undefined : this.parseOptionalString(body.phone),
        mobile: body.mobile === undefined ? undefined : this.parseOptionalString(body.mobile),
        website: body.website === undefined ? undefined : this.parseOptionalString(body.website),
        country: body.country === undefined ? undefined : this.parseOptionalString(body.country),
        city: body.city === undefined ? undefined : this.parseOptionalString(body.city),
        address_line_1: body.address_line_1 === undefined ? undefined : this.parseOptionalString(body.address_line_1),
        address_line_2: body.address_line_2 === undefined ? undefined : this.parseOptionalString(body.address_line_2),
        postal_code: body.postal_code === undefined ? undefined : this.parseOptionalString(body.postal_code),
        payment_terms: body.payment_terms === undefined ? undefined : this.parseOptionalString(body.payment_terms),
        currency: body.currency === undefined ? undefined : this.parseCurrency(body.currency),
        tax_id: body.tax_id === undefined ? undefined : this.parseOptionalString(body.tax_id),
        vat_number: body.vat_number === undefined ? undefined : this.parseOptionalString(body.vat_number),
        credit_limit:
          body.credit_limit === undefined ? undefined : this.parseNumber(body.credit_limit, "credit_limit", 0),
        contact_name: body.contact_name === undefined ? undefined : this.parseOptionalString(body.contact_name),
        contact_email: body.contact_email === undefined ? undefined : this.parseOptionalString(body.contact_email),
        contact_phone: body.contact_phone === undefined ? undefined : this.parseOptionalString(body.contact_phone),
        notes: body.notes === undefined ? undefined : this.parseOptionalString(body.notes),
        rating: body.rating === undefined ? undefined : this.parseOptionalInteger(body.rating, "rating"),
        preferred_supplier:
          body.preferred_supplier === undefined
            ? undefined
            : this.parseBoolean(body.preferred_supplier, existing.preferred_supplier ?? false),
        deleted_at: body.deleted_at === undefined ? undefined : (body.deleted_at as Date | null),
        updated_by: user.id
      }
    });
  }

  async restore(id: string, scope?: UserScope) {
    const user = this.requireScope(scope);
    const existing = await this.prisma.supplier.findFirst({
      where: {
        id,
        organization_id: user.organizationId,
        created_by: user.id
      }
    });
    if (!existing) {
      throw new NotFoundException("Supplier not found");
    }
    return this.prisma.supplier.update({
      where: { id },
      data: {
        deleted_at: null,
        updated_by: user.id
      }
    });
  }
}
