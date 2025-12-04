#!/bin/ash
set -e

echo "[Nexdom OS] Iniciando add-on..."

# Verificar variables de entorno esenciales
if [ -z "$HASSIO_TOKEN" ]; then
    echo "[Error] HASSIO_TOKEN is required but not provided"
    echo "[Debug] Available HASSIO/SUPERVISOR env vars:"
    env | grep -i "hassio\|supervisor" || echo "  (none found)"
    exit 1
fi

# ---- BLINDAJE PROD + RAM ----
export NODE_ENV=production
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=256}"

# Configuración por defecto
export SUPERVISOR_URL=${SUPERVISOR_URL:-"http://supervisor"}
export BACKEND_PORT=${BACKEND_PORT:-"3000"}
export FRONTEND_PORT=${FRONTEND_PORT:-"8123"}

echo "[Nexdom OS] Configuration:"
echo "  Supervisor URL: $SUPERVISOR_URL"
echo "  Backend Port: $BACKEND_PORT"
echo "  Frontend Port: $FRONTEND_PORT"
echo "  Has Token: $([ -n "$HASSIO_TOKEN" ] && echo 'yes' || echo 'no')"

# Verificar conexión con Home Assistant Supervisor (solo 1 intento)
echo "[Nexdom OS] Verificando conexión con Home Assistant Supervisor..."
if curl -f -H "Authorization: Bearer $HASSIO_TOKEN" "$SUPERVISOR_URL/api/" >/dev/null 2>&1; then
    echo "[Nexdom OS] Conexión con Home Assistant exitosa"
else
    echo "[Nexdom OS] No se pudo verificar conexión (puede que el Supervisor esté ocupado), continuando..."
fi

# Iniciar backend proxy en background
echo "[Nexdom OS] Iniciando backend proxy..."
cd /app/backend
export SUPERVISOR_URL="$SUPERVISOR_URL"
export HASSIO_TOKEN="$HASSIO_TOKEN"
export BACKEND_PORT="$BACKEND_PORT"
export FRONTEND_PORT="$FRONTEND_PORT"

npm start &
BACKEND_PID=$!

# Esperar que el backend esté listo
echo "[Nexdom OS] Esperando que backend esté listo..."
sleep 5

# Verificar que el backend esté funcionando
if ! curl -f http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
    echo "[Error] Backend proxy no está funcionando"
    echo "[Debug] Backend logs:"
    kill -0 $BACKEND_PID 2>/dev/null && echo "  Backend process is running" || echo "  Backend process died"
    exit 1
fi

echo "[Nexdom OS] Backend proxy funcionando en puerto $BACKEND_PORT"

# Iniciar nginx
echo "[Nexdom OS] Iniciando servidor web..."
exec nginx -g 'daemon off;'

cleanup() {
    echo "[Nexdom OS] Cerrando servicios..."
    kill $BACKEND_PID 2>/dev/null || true
    nginx -s quit 2>/dev/null || true
    wait
}

trap cleanup SIGTERM SIGINT
