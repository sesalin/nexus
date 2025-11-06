# Nexdom Health Reporter

Add-on ligero para Home Assistant OS que recopila el estado local (Core, Supervisor, dispositivos, almacenamiento) y lo envía periódicamente a un webhook central (n8n, Apps Script, etc.). Pensado para construir un tablero simple (ej. Google Sheets) sin depender de MQTT/Telegraf.

## Qué reporta

- **HAOS activo** (`haos_up`): si el endpoint `/api/` responde.
- **Add-ons pendientes** (`updates`): lista de `update_available` obtenida de Supervisor.
- **Dispositivos offline** (`devices`): entidades con estado `unavailable / offline / unknown` desde `/api/states`.
- **Almacenamiento** (`storage`): porcentaje libre obtenido de `/host/info`.

Cada campo se clasifica como:
- `ok`: sin incidencias.
- `warn`: dentro de umbrales de alerta.
- `error`: fuera de tolerancia o sin respuesta.

El payload enviado al webhook tiene la forma:

```json
{
  "client": "haos_cheko",
  "ts": "2025-11-06T12:34:56.789012+00:00",
  "status": {
    "haos_up": {"state": "ok", "detail": "Core reachable"},
    "updates": {"state": "warn", "detail": "core_matter_server (1.4 → 1.5)"},
    "devices": {"state": "error", "detail": "12 offline: sensor.foo, light.bar …"},
    "storage": {"state": "ok", "detail": "62.5% libre"}
  },
  "meta": {
    "pending_addons": ["core_matter_server (1.4 → 1.5)"],
    "offline_entities": ["sensor.foo", "light.bar"]
  }
}
```

## Requisitos

- **Home Assistant OS / Supervisor** (acceso a API interna con token).
- Webhook accesible desde HAOS (n8n, script propio, etc.).

## Instalación

1. Copiá la carpeta `client_addon_health/nexdom_health` al repositorio de add-ons que usa tu HAOS (ej. `/addons/nexdom_health/`).
2. Agregá ese repositorio custom en el Add-on Store de Home Assistant.
3. Instala “Nexdom Health Reporter”.

## Configuración

Desde la pestaña **Configuration** del add-on:

| Opción | Descripción | Default |
| --- | --- | --- |
| `client_id` | Identificador del host (aparece en el webhook) | `haos_cliente` |
| `ha_token` | Long-Lived Token con acceso a Core/Supervisor | _obligatorio_ |
| `webhook_url` | Endpoint donde se enviarán los reportes | `https://n8n.nexdom.mx/webhook/health` |
| `interval_seconds` | Frecuencia de envío (mínimo 60s) | `300` |
| `device_warn_threshold` | Máx. entidades offline para `warn` | `1` |
| `device_error_threshold` | Máx. entidades offline antes de `error` | `10` |
| `storage_warn_free_percent` | % libre (o menos) para `warn` | `20` |
| `storage_error_free_percent` | % libre (o menos) para `error` | `10` |
| `log_level` | Nivel de logs | `info` |

Guarda la configuración y enciende el add-on.

## Verificación

1. `docker logs -f addon_nexdom_health` (el nombre exacto aparece en “Info”). Deberías ver líneas tipo:
   ```
   2025-11-06T12:00:01 I health | Reporte haos_cheko | haos=ok updates=warn devices=error storage=ok
   ```
2. Confirmá en tu webhook (n8n) que llegan requests con el JSON mostrado en la sección anterior.

## Flujo sugerido en n8n

1. `Webhook` node (POST) → recibe el JSON.
2. Opcional: filtrar/transformar con `Function` node.
3. `Google Sheets` node (Update Row) → actualiza la fila correspondiente con:
   - `HAOS`, `Updates`, `Devices`, `Storage` = valores `state`.
   - `Detalle` = concatenar los `detail`.
   - `Última revisión` = `ts`.
4. Usa formato condicional en Sheets (`ok` verde, `warn` amarillo, `error` rojo).

## Publicar la imagen

El `release.sh` en la raíz del repo ya contempla este add-on. Para construir y publicar sólo “nexdom_health”:

```bash
./release.sh 0.1.0 \
  --addon health \
  --platforms "linux/amd64,linux/arm64,linux/arm/v7" \
  --image-health docker.io/tu_usuario/nexdom_health \
  --push-latest
```

## Notas

- Cada host se reporta por sí mismo. Si deja de enviar, tu dashboard lo verá como “último reporte” viejo; podés alertar por eso.
- Cambiar umbrales en `interval_seconds` o almacenamiento requiere reiniciar el add-on para aplicar.
- No expone puertos ni depende de MQTT/Influx. Sólo necesita acceso a las APIs internas y salida HTTP al webhook.
