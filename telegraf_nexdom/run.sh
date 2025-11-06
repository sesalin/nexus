#!/usr/bin/env bash
set -euo pipefail

# --- limpiar panel de logs del add-on al iniciar (cosmético) ---
clear_logs() {
  printf '\033[2J\033[3J\033[H'
  echo "🧹 Logs reiniciados $(date -Iseconds)"
}
clear_logs

CONFIG_PATH="/data/options.json"

log_info() {
  echo "ℹ️  $*"
}

log_warn() {
  echo "⚠️  $*" >&2
}

log_error() {
  echo "❌ $*" >&2
}

if [[ ! -f "${CONFIG_PATH}" ]]; then
  log_error "No se encontró el archivo de configuración ${CONFIG_PATH}"
  exit 1
fi

if [[ ! -r "${CONFIG_PATH}" ]]; then
  log_error "Sin permisos para leer ${CONFIG_PATH}. UID $(id -u) ($(id -un))"
  log_warn "Entradas en /data:"
  ls -l /data || true
  exit 1
fi

log_info "Leyendo opciones desde ${CONFIG_PATH} con UID $(id -u) ($(id -un))"

INFLUX_URL=$(jq -r '.influx_url // "https://influx.nexdom.mx"' "${CONFIG_PATH}")
INFLUX_TOKEN=$(jq -r '.influx_token // empty' "${CONFIG_PATH}")
if [[ -z "${INFLUX_TOKEN}" ]]; then
  log_error 'Debes definir "influx_token" en las opciones del add-on antes de iniciarlo.'
  exit 1
fi

INFLUX_ORG=$(jq -r '.influx_org // "Nexdom"' "${CONFIG_PATH}")
INFLUX_BUCKET=$(jq -r '.influx_bucket // "haos"' "${CONFIG_PATH}")
MQTT_HOST=$(jq -r '.mqtt_host // "core-mosquitto"' "${CONFIG_PATH}")
MQTT_PORT=$(jq -r '.mqtt_port // 1883' "${CONFIG_PATH}")
MQTT_USER=$(jq -r '.mqtt_user // "telegraf"' "${CONFIG_PATH}")
MQTT_PASSWORD=$(jq -r '.mqtt_password // empty' "${CONFIG_PATH}")
CLIENT_ID=$(jq -r '.client_id // "haos_cliente"' "${CONFIG_PATH}")

export INFLUX_URL INFLUX_TOKEN INFLUX_ORG INFLUX_BUCKET MQTT_HOST MQTT_PORT MQTT_USER MQTT_PASSWORD CLIENT_ID

echo "🚀 Iniciando Telegraf Nexdom Collector..."
echo "   → MQTT ${MQTT_HOST}:${MQTT_PORT} (usuario: ${MQTT_USER}, client_id: ${CLIENT_ID})"
echo "   → Influx ${INFLUX_URL} (bucket: \"${INFLUX_BUCKET}\", org: ${INFLUX_ORG})"

if command -v timeout >/dev/null 2>&1; then
  if timeout 5 bash -c "echo > /dev/tcp/${MQTT_HOST}/${MQTT_PORT}" 2>/dev/null; then
    log_info "Conexión TCP a MQTT verificada"
  else
    log_warn "No se pudo abrir TCP ${MQTT_HOST}:${MQTT_PORT}. El broker podría no estar accesible (se seguirá intentando desde Telegraf)."
  fi
else
  log_warn "timeout no disponible, omitiendo verificación TCP de MQTT."
fi

envsubst < /etc/telegraf/telegraf.conf > /tmp/telegraf_rendered.conf
log_info "Configuración renderizada en /tmp/telegraf_rendered.conf"

telegraf --config /tmp/telegraf_rendered.conf &
TELEGRAF_PID=$!

cleanup() {
  local status=$?
  if [[ $status -eq 0 ]]; then
    echo "✅ Telegraf finalizó correctamente"
  else
    log_warn "Telegraf salió con código $status"
  fi
}

forward_signal() {
  local sig="$1"
  log_info "Reenviando señal ${sig} a Telegraf (pid ${TELEGRAF_PID})"
  kill -s "$sig" "$TELEGRAF_PID" 2>/dev/null || true
}

trap cleanup EXIT
trap 'forward_signal TERM' TERM
trap 'forward_signal INT' INT

wait "$TELEGRAF_PID"
exit "$?"
