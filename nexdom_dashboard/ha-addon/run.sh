#!/bin/ash
set -e

echo "[Nexdom OS] Iniciando frontend estático (nginx)..."

# Asegura directorio de runtime para nginx
mkdir -p /run/nginx

# Arranca nginx en foreground
exec nginx -g 'daemon off;'
