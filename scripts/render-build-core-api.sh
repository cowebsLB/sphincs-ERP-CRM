#!/usr/bin/env bash
set -euo pipefail

echo "[render-build] cleaning stale installs"
rm -rf node_modules apps/core-api/node_modules

echo "[render-build] installing core-api workspace deps (incl. build tooling)"
pnpm --filter @sphincs/core-api install --frozen-lockfile --prod=false --force

echo "[render-build] prisma generate"
pnpm --filter @sphincs/core-api exec prisma generate --schema prisma/schema.prisma

FAILED_MIGRATION_NAME="20260321_distribution_db_foundation"

resolve_failed_migration() {
  local mode_label="$1"
  echo "[render-build] attempting migrate resolve for ${FAILED_MIGRATION_NAME} (${mode_label})"
  set +e
  pnpm --filter @sphincs/core-api exec prisma migrate resolve --rolled-back "${FAILED_MIGRATION_NAME}" --schema prisma/schema.prisma
  local resolve_exit=$?
  set -e
  if [[ $resolve_exit -eq 0 ]]; then
    echo "[render-build] migrate resolve succeeded (${mode_label})"
  else
    echo "[render-build] migrate resolve skipped/failed (${mode_label}); continuing to deploy migrations"
  fi
}

echo "[render-build] prisma migrate deploy"
if [[ -n "${DIRECT_URL:-}" ]]; then
  echo "[render-build] using DIRECT_URL for migration deploy"
  DATABASE_URL="$DIRECT_URL" resolve_failed_migration "DIRECT_URL"
  set +e
  DATABASE_URL="$DIRECT_URL" pnpm --filter @sphincs/core-api exec prisma migrate deploy --schema prisma/schema.prisma
  DIRECT_MIGRATE_EXIT=$?
  set -e
  if [[ $DIRECT_MIGRATE_EXIT -ne 0 ]]; then
    echo "[render-build] DIRECT_URL migration failed, falling back to DATABASE_URL"
    resolve_failed_migration "DATABASE_URL fallback"
    if ! pnpm --filter @sphincs/core-api exec prisma migrate deploy --schema prisma/schema.prisma; then
      echo "[render-build] prisma migrate deploy failed. If logs show 'Tenant or user not found' against Supabase, the project is paused/deleted or env URLs are wrong — see docs/deployment.md"
      exit 1
    fi
  fi
else
  echo "[render-build] DIRECT_URL not set, using DATABASE_URL for migration deploy"
  resolve_failed_migration "DATABASE_URL"
  if ! pnpm --filter @sphincs/core-api exec prisma migrate deploy --schema prisma/schema.prisma; then
    echo "[render-build] prisma migrate deploy failed. If logs show 'Tenant or user not found' against Supabase, the project is paused/deleted or env URLs are wrong — see docs/deployment.md"
    exit 1
  fi
fi

echo "[render-build] prisma seed"
pnpm --filter @sphincs/core-api prisma:seed

echo "[render-build] nest build"
pnpm --filter @sphincs/core-api build
