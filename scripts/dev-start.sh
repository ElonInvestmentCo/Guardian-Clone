#!/bin/bash
API_PORT=${API_PORT:-3001}
PORT=${PORT:-3000}

export API_PORT=$API_PORT

echo "Starting API server on port $API_PORT..."
API_PORT=$API_PORT PORT=$API_PORT pnpm --filter @workspace/api-server run dev &
API_PID=$!

echo "Waiting for API server to be ready..."
for i in $(seq 1 30); do
  if curl -s "http://localhost:$API_PORT/api/health" > /dev/null 2>&1 || \
     nc -z localhost $API_PORT 2>/dev/null; then
    echo "API server is ready."
    break
  fi
  sleep 1
done

echo "Starting Guardian Trading frontend on port $PORT..."
PORT=$PORT API_PORT=$API_PORT pnpm --filter @workspace/guardian-trading run dev

wait $API_PID
