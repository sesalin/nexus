#!/usr/bin/env bash
set -euo pipefail

CONFIG_PATH="/data/options.json"

if [[ ! -f "${CONFIG_PATH}" ]]; then
  echo "ERROR: No se encontró el archivo de configuración ${CONFIG_PATH}" >&2
  exit 1
fi

INFLUX_TOKEN=$(jq -r '.influx_token // empty' "${CONFIG_PATH}")
if [[ -z "${INFLUX_TOKEN}" ]]; then
  echo "ERROR: Debes definir \"influx_token\" en las opciones del add-on antes de iniciarlo." >&2
  exit 1
fi

INFLUX_ORG=$(jq -r '.influx_org // "Nexdom"' "${CONFIG_PATH}")
INFLUX_BUCKET=$(jq -r '.influx_bucket // "haos"' "${CONFIG_PATH}")
MQTT_HOST=$(jq -r '.mqtt_host // "core-mosquitto"' "${CONFIG_PATH}")
MQTT_PORT=$(jq -r '.mqtt_port // 1883' "${CONFIG_PATH}")
MQTT_USER=$(jq -r '.mqtt_user // "telegraf"' "${CONFIG_PATH}")
MQTT_PASSWORD=$(jq -r '.mqtt_password // empty' "${CONFIG_PATH}")
CLIENT_ID=$(jq -r '.client_id // "haos_cliente"' "${CONFIG_PATH}")

export INFLUX_TOKEN INFLUX_ORG INFLUX_BUCKET MQTT_HOST MQTT_PORT MQTT_USER MQTT_PASSWORD CLIENT_ID

echo "🚀 Iniciando Telegraf Nexdom Collector..."
echo "   → MQTT ${MQTT_HOST}:${MQTT_PORT} (usuario: ${MQTT_USER}, client_id: ${CLIENT_ID})"
echo "   → Influx bucket \"${INFLUX_BUCKET}\" (org: ${INFLUX_ORG})"

envsubst < /etc/telegraf/telegraf.conf > /tmp/telegraf_rendered.conf
exec telegraf --config /tmp/telegraf_rendered.conf
