#!/bin/sh
set -e

echo "[entrypoint] running prisma migrate deploy"
pnpm prisma migrate deploy

echo "[entrypoint] running prisma seed (idempotent)"
pnpm prisma:seed || echo "[entrypoint] seed skipped (already bootstrapped)"

echo "[entrypoint] starting next"
exec pnpm start
