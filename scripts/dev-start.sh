#!/bin/bash
# dev-start.sh — Legacy orchestrator (no longer used as main workflow)
#
# Services are now managed by individual workflows:
#   • "Start application"  → Guardian Trading frontend  (port 5000, webview)
#   • "API Server"         → Express API server         (port 3001, console)
#   • "Admin KYC"          → Admin KYC dashboard        (port 8080, console)
#
# Run these directly if needed:
#   PORT=5000 BASE_PATH=/ API_PORT=3001 pnpm --filter @workspace/guardian-trading run dev
#   PORT=3001 pnpm --filter @workspace/api-server run dev
#   PORT=8080 BASE_PATH=/admin-kyc/ API_PORT=3001 pnpm --filter @workspace/admin-kyc run dev

echo "Guardian Trading — use the individual workflows in the workflow panel."
