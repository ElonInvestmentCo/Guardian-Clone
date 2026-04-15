#!/usr/bin/env bash
set -euo pipefail

echo "==> Building guardian-trading frontend..."
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/guardian-trading run build

echo "==> Building admin-kyc frontend..."
PORT=3000 BASE_PATH=/admin-kyc/ pnpm --filter @workspace/admin-kyc run build

echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

echo "==> Production build complete."
