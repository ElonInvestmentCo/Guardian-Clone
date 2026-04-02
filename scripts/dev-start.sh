#!/bin/bash
# dev-start.sh — Startup orchestrator for the Guardian Trading platform
# Starts all services: API server, Guardian Trading frontend, Admin KYC frontend

set -e

# API runs on 3001, frontend (webview) on 3000
API_PORT=${API_PORT:-3001}
WEB_PORT=${PORT:-3000}
ADMIN_PORT=8080
MAX_WAIT=90

echo ""
echo "Guardian Trading Platform — Dev Environment"
echo "--------------------------------------------"
echo "API server port         : $API_PORT"
echo "Guardian Trading port   : $WEB_PORT"
echo "Admin KYC port          : $ADMIN_PORT"
echo ""

# Start API server in background
echo "Starting API server..."
PORT=$API_PORT pnpm --filter @workspace/api-server run dev &
API_PID=$!

# Start Guardian Trading frontend in background
echo "Starting Guardian Trading frontend..."
PORT=$WEB_PORT API_PORT=$API_PORT pnpm --filter @workspace/guardian-trading run dev &
WEB_PID=$!

# Start Admin KYC frontend in background
echo "Starting Admin KYC frontend..."
PORT=$ADMIN_PORT BASE_PATH="/admin-kyc/" API_PORT=$API_PORT pnpm --filter @workspace/admin-kyc run dev &
ADMIN_PID=$!

echo ""
echo "Waiting for Guardian Trading frontend to be ready on port $WEB_PORT..."

for i in $(seq 1 $MAX_WAIT); do
  if curl -s "http://localhost:$WEB_PORT/" > /dev/null 2>&1 || \
     nc -z localhost $WEB_PORT 2>/dev/null; then
    echo "✓ Guardian Trading frontend is ready (port $WEB_PORT)"
    break
  fi
  if [ $i -eq $MAX_WAIT ]; then
    echo "⚠ Frontend did not respond within ${MAX_WAIT}s."
  fi
  sleep 1
done

echo ""
echo "All services started. Press Ctrl+C to stop."
echo ""

# Wait for all background processes
wait $API_PID $WEB_PID $ADMIN_PID
