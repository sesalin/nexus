#!/usr/bin/env bash
set -euo pipefail

# --- Config ---
DASH_DIR="nexdom_dashboard"
IMAGE_TAG="nexdom-dashboard:latest"
COMMIT_MSG="${1:-3}"   # Puedes pasar mensaje como argumento: ./deploy.sh "mi mensaje"

echo "==> Entrando a $DASH_DIR" 
cd "$DASH_DIR"

echo "==> npm run build"
npm run build

echo "==> docker build -t $IMAGE_TAG ."
docker build -t "$IMAGE_TAG" .

echo "==> Regresando a raíz del repo"
cd ..

echo "==> git add ."
git add .

echo "==> git commit -m \"$COMMIT_MSG\""
# Evita truene si no hay cambios
if git diff --cached --quiet; then
  echo "No hay cambios para commitear."
else
  git commit -m "$COMMIT_MSG"
fi

echo "==> git push"
git push

echo "✅ Listo."
