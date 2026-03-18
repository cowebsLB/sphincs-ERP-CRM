#!/usr/bin/env bash
set -euo pipefail

echo "[render-build] cleaning stale installs"
rm -rf node_modules apps/core-api/node_modules

echo "[render-build] installing core-api workspace deps (incl. build tooling)"
pnpm --filter @sphincs/core-api install --frozen-lockfile --prod=false --force

echo "[render-build] prisma generate"
pnpm --filter @sphincs/core-api exec prisma generate --schema prisma/schema.prisma

echo "[render-build] prisma migrate deploy"
pnpm --filter @sphincs/core-api exec prisma migrate deploy --schema prisma/schema.prisma

echo "[render-build] prisma seed"
pnpm --filter @sphincs/core-api prisma:seed

echo "[render-build] nest build"
pnpm --filter @sphincs/core-api build
