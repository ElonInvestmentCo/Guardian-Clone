#!/bin/bash
# dev-start.sh — Startup orchestrator
#
# Individual artifact workflows (managed by Replit) handle starting each service:
#   • artifacts/api-server: API Server       → runs the Express API
#   • artifacts/guardian-trading: web        → runs the customer-facing React app
#   • artifacts/admin-kyc: web               → runs the admin KYC dashboard
#
# This script waits for the API server to be ready and then prints a status summary.

API_PORT=${API_PORT:-3000}
MAX_WAIT=60

echo ""
echo "Guardian Trading Platform — Dev Environment"
echo "--------------------------------------------"
echo "API server port  : $API_PORT"
echo ""
echo "Waiting for API server to be ready..."

for i in $(seq 1 $MAX_WAIT); do
  if curl -s "http://localhost:$API_PORT/api/health" > /dev/null 2>&1 || \
     nc -z localhost $API_PORT 2>/dev/null; then
    echo "✓ API server is ready (port $API_PORT)"
    break
  fi
  if [ $i -eq $MAX_WAIT ]; then
    echo "⚠ API server did not respond within ${MAX_WAIT}s. Check the API Server workflow logs."
  fi
  sleep 1
done

echo ""
echo "All services are managed by their individual artifact workflows."
echo "Check the workflow panel for per-service logs and status."
echo ""

# Keep the process alive so the workflow shows as 'running'
while true; do
  sleep 30
  # Silently verify API health
  curl -s "http://localhost:$API_PORT/api/health" > /dev/null 2>&1 || true
done
