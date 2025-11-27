# Nexdom Pulse – Documentación técnica del add-on

- Objetivo: enviar a Supabase (RPC `sp_report_entity`) el estado de entidades de Home Assistant, tanto la foto inicial como los cambios posteriores. Corre como add-on en el Supervisor y usa la API WebSocket de Home Assistant para leer estados.
- Stack: Python 3.11, dependencias principales `websockets` y `requests`. La imagen se construye desde `$BUILD_FROM`, instala Python y ejecuta `/app/main.py` mediante `run.sh`.

## Flujo de ejecución
- Carga configuración desde `/data/options.json` (ver opciones abajo) y ajusta el nivel de log.
- Obtiene el `SUPERVISOR_TOKEN` desde la env var o archivos estándar (`/run/secrets/supervisor_token`, `/data/supervisor_token` o el definido en `SUPERVISOR_TOKEN_FILE`).
- Valida obligatorios (`client_id`, `supabase_url`, `supabase_token`, `update_interval`, `entities` y token de supervisor); si falta alguno, el proceso se detiene.
- Abre WebSocket a `ws://supervisor/core/websocket`, realiza `auth_required`/`auth_ok` con el token y solicita `get_states` para obtener el snapshot inicial.
- Para cada entidad del snapshot que cumpla con el filtro, construye el payload y lo envía a Supabase si `reporting_enabled` es `true`.
- Se suscribe a eventos `state_changed`; cada cambio válido se coloca en un buffer (`changed_buffer`), sobrescribiendo por `entity_id` para conservar solo el último cambio pendiente.
- Un ciclo `periodic_flush` envía el buffer cada `update_interval` segundos. Si `reporting_enabled` es `false`, el buffer se descarta.
- Manejo de resiliencia: reconecta al WebSocket con backoff exponencial (1s a 60s) y reintenta peticiones HTTP hasta 3 veces ante códigos 5xx con esperas 1s, 2s, 4s (máx. 10s por cálculo).

## Configuración del add-on (`config.json`)
- `client_id` (str, requerido): identificador único del cliente que se envía a Supabase.
- `supabase_url` (str, requerido): URL base del proyecto Supabase.
- `supabase_token` (str, requerido): token de servicio usado en headers `Authorization` y `apikey`.
- `update_interval` (int, requerido): intervalo (segundos) para vaciar el buffer de cambios.
- `entities` (lista de str, requerido): lista de ids o patrones tipo glob (`*`, `sensor.*`, `light.sala`). `*` incluye todas.
- `client_name` (str opcional): etiqueta informativa, no usada en el flujo actual.
- `reporting_enabled` (bool): permite pausar el envío; el buffer se limpia sin transmitir cuando está en `false`.
- `log_level` (`debug`|`info`|`warning`|`error`): controla verbosidad del log.
- Metadatos de add-on: `host_network: true`, `full_access: true`, `homeassistant_api: true`, `hassio_api: true`, `auth_api: true`, arranque como servicio (`startup: services`) y auto (`boot: auto`).

## Datos recolectados desde Home Assistant
- Fuente: WebSocket `get_states` (snapshot inicial) y eventos `state_changed`.
- Filtro de entidades: `matches()` soporta:
  - comodín total `*`
  - patrones con `*` (usa `fnmatch`, ej. `sensor.*`)
  - coincidencia exacta de `entity_id`.
- Para cada estado, `build_payload` produce:
  - `entity_id`
  - `state`
  - `attributes` (dict de atributos tal cual los entrega Home Assistant)
  - `last_changed`

## Datos enviados a Supabase
- Endpoint: `${supabase_url}/rest/v1/rpc/sp_report_entity`.
- Headers: `Authorization: Bearer <supabase_token>`, `apikey: <supabase_token>`, `Content-Type: application/json`.
- Cuerpo:
  - `p_client_id`: el `client_id` configurado.
  - `p_entity`: payload con `entity_id`, `state`, `attributes`, `last_changed` (ver sección anterior).
- Política de reintentos: hasta 3 intentos ante códigos 5xx con backoff creciente; ante éxito (<300) se continúa, ante fallo tras 3 intentos se abandona y se registra error.

## Registro y observabilidad
- `logging.basicConfig` con formato `timestamp level mensaje`.
- Niveles ajustables vía `log_level`; valores inválidos caen en `INFO`.
- Eventos de error registrados para: token faltante, fallas de autenticación WebSocket, errores HTTP y desconexiones.

## Consideraciones operativas
- El buffer conserva solo el último cambio por entidad hasta el siguiente `flush`; reduce duplicados pero puede omitir cambios intermedios si son más rápidos que `update_interval`.
- `reporting_enabled: false` permite desactivar envíos sin desinstalar; se siguen leyendo eventos pero se descartan.
- Se recomienda usar `https` en `supabase_url`, `supabase_token` con mínimos privilegios y `client_id` único por instancia.
- Dependencias de prueba (`pytest`, `pytest-asyncio`, `responses`) están listadas en `requirements.txt` pero no se instalan en modo producción salvo que el builder los conserve.

## Cómo probar en desarrollo
- Requisitos: Python ≥3.11.
- Instalar dependencias: `pip install -r requirements.txt`.
- Ejecutar suite: `pytest -q` (las pruebas mockean WebSocket y Supabase; no requieren red).
