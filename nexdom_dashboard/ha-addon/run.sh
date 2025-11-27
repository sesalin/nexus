#!/bin/ash
set -e

echo "[Nexdom OS] Iniciando add-on..."

# Verificar variables de entorno esenciales
if [ -z "$SUPERVISOR_TOKEN" ]; then
    echo "[Error] SUPERVISOR_TOKEN is required"
    exit 1
fi

# Configuración por defecto
export SUPERVISOR_URL=${SUPERVISOR_URL:-"http://supervisor"}
export BACKEND_PORT=${BACKEND_PORT:-"3000"}
export FRONTEND_PORT=${FRONTEND_PORT:-"8123"}

# Verificar conexión con Home Assistant Supervisor
echo "[Nexdom OS] Verificando conexión con Home Assistant Supervisor..."
max_retries=10
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    if curl -f -H "Authorization: Bearer $SUPERVISOR_TOKEN" "$SUPERVISOR_URL/core/api/" >/dev/null 2>&1; then
        echo "[Nexdom OS] Conexión con Home Assistant exitosa"
        break
    fi
    retry_count=$((retry_count + 1))
    echo "[Nexdom OS] Reintentando conexión... ($retry_count/$max_retries)"
    sleep 3
done

if [ $retry_count -eq $max_retries ]; then
    echo "[Error] No se pudo conectar con Home Assistant después de $max_retries intentos"
    echo "[Nexdom OS] Continuando con funcionalidades limitadas..."
fi

# Iniciar backend proxy en background
echo "[Nexdom OS] Iniciando backend proxy..."
cd /app/backend
export SUPERVISOR_URL="$SUPERVISOR_URL"
export SUPERVISOR_TOKEN="$SUPERVISOR_TOKEN"
export BACKEND_PORT="$BACKEND_PORT"
export FRONTEND_PORT="$FRONTEND_PORT"

# Ejecutar backend en background
npm start &
BACKEND_PID=$!

# Esperar que el backend esté listo
echo "[Nexdom OS] Esperando que backend esté listo..."
sleep 5

# Verificar que el backend esté funcionando
if ! curl -f http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
    echo "[Error] Backend proxy no está funcionando"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo "[Nexdom OS] Backend proxy funcionando en puerto $BACKEND_PORT"

# Iniciar nginx
echo "[Nexdom OS] Iniciando servidor web..."
exec nginx -g 'daemon off;'

# Cleanup en caso de cierre
cleanup() {
    echo "[Nexdom OS] Cerrando servicios..."
    kill $BACKEND_PID 2>/dev/null || true
    nginx -s quit 2>/dev/null || true
    wait
}

trap cleanup SIGTERM SIGINT

