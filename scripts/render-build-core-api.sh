#!/usr/bin/env bash
set -euo pipefail

echo "[render-build] cleaning stale installs"
rm -rf node_modules apps/core-api/node_modules

echo "[render-build] installing core-api workspace deps (incl. build tooling)"
pnpm --filter @sphincs/core-api install --frozen-lockfile --prod=false --force

echo "[render-build] prisma generate"
pnpm --filter @sphincs/core-api exec prisma generate --schema prisma/schema.prisma

echo "[render-build] SKIP_PRISMA_MIGRATE=${SKIP_PRISMA_MIGRATE:-<unset>} (set to 1|true|yes|on to skip migrate+seed)"

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

skip_migrate_and_seed() {
  local v="${SKIP_PRISMA_MIGRATE:-}"
  v="${v//[[:space:]]/}"
  case "$v" in
    1|true|TRUE|yes|YES|on|ON) return 0 ;;
    *) return 1 ;;
  esac
}

migrate_failed_hint() {
  echo "[render-build] prisma migrate deploy failed (database unreachable or bad credentials)."
  echo "[render-build] Fix: set live DATABASE_URL and DIRECT_URL on this Render service, then redeploy."
  echo "[render-build] Temporary build-only bypass: Dashboard → Environment → add SKIP_PRISMA_MIGRATE = 1 (exact name), save, clear build cache optional, redeploy. Remove after DB is fixed."
  echo "[render-build] Docs: docs/deployment.md (Supabase 'Tenant or user not found')."
}

if skip_migrate_and_seed; then
  echo "[render-build] SKIP_PRISMA_MIGRATE=$SKIP_PRISMA_MIGRATE — skipping prisma migrate deploy and prisma seed"
  echo "[render-build] WARNING: deploy a working DATABASE_URL/DIRECT_URL and redeploy without this flag, or run migrate deploy against the DB before relying on this service."
else
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
        migrate_failed_hint
        exit 1
      fi
    fi
  else
    echo "[render-build] DIRECT_URL not set, using DATABASE_URL for migration deploy"
    resolve_failed_migration "DATABASE_URL"
    if ! pnpm --filter @sphincs/core-api exec prisma migrate deploy --schema prisma/schema.prisma; then
      migrate_failed_hint
      exit 1
    fi
  fi

  echo "[render-build] prisma seed"
  pnpm --filter @sphincs/core-api prisma:seed
fi

echo "[render-build] nest build"
pnpm --filter @sphincs/core-api build
