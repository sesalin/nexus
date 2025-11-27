#!/bin/ash
set -e

# Configuración del add-on Nexdom OS
echo "[Info] Iniciando Nexdom OS Dashboard..."

# Variables de entorno para Home Assistant
export HA_URL=${HA_URL:-"http://homeassistant.local:8123"}
export HA_TOKEN=${HA_TOKEN}
export NEXDOM_WS_URL="ws://homeassistant.local:8123/api/websocket"
export NEXDOM_HTTP_URL="http://homeassistant.local:8123"

# Verificar conexión con Home Assistant
echo "[Info] Verificando conexión con Home Assistant..."
curl -f -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/" || {
    echo "[Error] No se puede conectar con Home Assistant"
    exit 1
}

# Iniciar Nexdom OS
echo "[Info] Iniciando servidor web..."
exec "$@"
