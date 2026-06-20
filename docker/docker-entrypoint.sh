#!/bin/sh
set -e

# Replace placeholder in env.template.js with runtime env var and write env.js
API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
TEMPLATE="/usr/share/nginx/html/assets/env.template.js"
OUT="/usr/share/nginx/html/assets/env.js"

if [ -f "$TEMPLATE" ]; then
  sed "s|%%API_BASE_URL%%|$API_BASE_URL|g" "$TEMPLATE" > "$OUT"
fi

exec "$@"
