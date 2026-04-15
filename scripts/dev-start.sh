#!/bin/bash
# dev-start.sh — Legacy orchestrator (no longer used as main workflow)
#
# Single-preview architecture — LOCKED. Only ONE webview is permitted.
#
# Services are managed exclusively by these named workflows:
#   • "Guardian Trading"   → Guardian Trading frontend  (port 3000, webview — ONLY preview)
#   • "API Server"         → Express API server         (port 3001, console — background only)
#   • "Admin KYC"          → Admin KYC dashboard        (port 8080, console — background only)
#
# Admin KYC is accessible at /admin-kyc/ via proxy from the Guardian Trading Vite server.
# API routes are accessible at /api/ via proxy.
#
# DO NOT add outputType = "webview" to Admin KYC or API Server workflows.
# DO NOT start the artifact-triggered workflows (artifacts/*) — they are disabled no-ops.

echo "[INFO] Guardian Trading — use the individual named workflows in the workflow panel."
echo "[INFO] Single-preview architecture: only Guardian Trading (port 3000) serves a webview."
