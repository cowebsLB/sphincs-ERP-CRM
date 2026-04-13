-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "plan_id" INTEGER;

-- CreateTable
CREATE TABLE "subscription_plans" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "max_users" INTEGER,
  "max_branches" INTEGER NOT NULL DEFAULT 1,
  "max_storage_gb" INTEGER NOT NULL DEFAULT 5,
  "features" JSONB NOT NULL DEFAULT '{}',
  "price_monthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "price_yearly" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_plan_id" ON "organizations"("plan_id");

-- AddForeignKey
ALTER TABLE "organizations"
ADD CONSTRAINT "organizations_plan_id_fkey"
FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
