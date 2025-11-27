#!/usr/bin/with-contenv sh
set -euo pipefail

echo "[Info] Arrancando Nexdom Dashboard (nginx)"

mkdir -p /run/nginx
nginx -g 'daemon off;'