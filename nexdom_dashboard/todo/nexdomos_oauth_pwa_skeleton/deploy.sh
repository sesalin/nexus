#!/usr/bin/env bash
set -euo pipefail

TENANT_NAME=${1:-default}

echo "Deploying NexdomOS skeleton for tenant: $TENANT_NAME"
echo "TODO: build frontend, copy to /data/web/$TENANT_NAME, adjust Caddyfile, restart services."
