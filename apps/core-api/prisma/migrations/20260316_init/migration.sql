CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "branch_id" UUID,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "branch_id" UUID,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "branch_id" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "branch_id" UUID,
    "supplier_id" UUID,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "branch_id" UUID,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "branch_id" UUID,
    "contact_id" UUID,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "branch_id" UUID,
    "lead_id" UUID,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_branches_org" ON "branches"("organization_id");

-- CreateIndex
CREATE INDEX "idx_branches_deleted_at" ON "branches"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_branches_created_at" ON "branches"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_org" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "idx_users_branch" ON "users"("branch_id");

-- CreateIndex
CREATE INDEX "idx_users_deleted_at" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_users_created_at" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "idx_roles_deleted_at" ON "roles"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_roles_created_at" ON "roles"("created_at");

-- CreateIndex
CREATE INDEX "idx_user_roles_user" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_role" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_deleted_at" ON "user_roles"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_roles_user_role" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "idx_items_org" ON "items"("organization_id");

-- CreateIndex
CREATE INDEX "idx_items_branch" ON "items"("branch_id");

-- CreateIndex
CREATE INDEX "idx_items_deleted_at" ON "items"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_items_created_at" ON "items"("created_at");

-- CreateIndex
CREATE INDEX "idx_items_org_deleted_created" ON "items"("organization_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "idx_items_org_branch_deleted_created" ON "items"("organization_id", "branch_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "idx_suppliers_org" ON "suppliers"("organization_id");

-- CreateIndex
CREATE INDEX "idx_suppliers_branch" ON "suppliers"("branch_id");

-- CreateIndex
CREATE INDEX "idx_suppliers_deleted_at" ON "suppliers"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_suppliers_created_at" ON "suppliers"("created_at");

-- CreateIndex
CREATE INDEX "idx_suppliers_org_deleted_created" ON "suppliers"("organization_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_org" ON "purchase_orders"("organization_id");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_branch" ON "purchase_orders"("branch_id");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_status" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_deleted_at" ON "purchase_orders"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_created_at" ON "purchase_orders"("created_at");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_org_branch_deleted_created" ON "purchase_orders"("organization_id", "branch_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "idx_contacts_org" ON "contacts"("organization_id");

-- CreateIndex
CREATE INDEX "idx_contacts_branch" ON "contacts"("branch_id");

-- CreateIndex
CREATE INDEX "idx_contacts_deleted_at" ON "contacts"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_contacts_created_at" ON "contacts"("created_at");

-- CreateIndex
CREATE INDEX "idx_contacts_org_deleted_created" ON "contacts"("organization_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "idx_leads_org" ON "leads"("organization_id");

-- CreateIndex
CREATE INDEX "idx_leads_branch" ON "leads"("branch_id");

-- CreateIndex
CREATE INDEX "idx_leads_status" ON "leads"("status");

-- CreateIndex
CREATE INDEX "idx_leads_deleted_at" ON "leads"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_leads_created_at" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "idx_leads_org_deleted_created" ON "leads"("organization_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "idx_opportunities_org" ON "opportunities"("organization_id");

-- CreateIndex
CREATE INDEX "idx_opportunities_branch" ON "opportunities"("branch_id");

-- CreateIndex
CREATE INDEX "idx_opportunities_status" ON "opportunities"("status");

-- CreateIndex
CREATE INDEX "idx_opportunities_deleted_at" ON "opportunities"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_opportunities_created_at" ON "opportunities"("created_at");

-- CreateIndex
CREATE INDEX "idx_opportunities_org_deleted_created" ON "opportunities"("organization_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_org" ON "audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_deleted_at" ON "audit_logs"("deleted_at");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


