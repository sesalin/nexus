## Arquitectura propuesta
- Front siempre en `https://<cliente>.nexdom.mx` (Cloudflared → Caddy → PWA LXC).
- El navegador solo habla con ese origen; Caddy hace proxy interno a HAOS (`http://homeassistant.local:8123`).
- Beneficios: consistencia OAuth2 (mismo host/puerto para `client_id`/`redirect_uri`), cero CORS, TLS/HSTS en el edge, y tráfico API/WS resuelto localmente con baja latencia.

## Ajustes en PWA
- `HAProvider`: usar `window.location.origin` como `hassUrl` en todos los casos; no hardcodear `homeassistant.local` ni `cheko.nexdom.mx`.
- Token: dejar de guardar `payload.result` del `login_flow` como token.
- Implementar OAuth2 estándar:
  1) `login_flow` (usuario/contraseña) para establecer sesión/cookie.
  2) Redirigir a `/auth/authorize?client_id=<ORIGIN>&redirect_uri=<ORIGIN>/auth_callback&state=<...>`.
  3) En `auth_callback`, leer `code` y canjear en `/auth/token` (`application/x-www-form-urlencoded`) con el mismo `client_id`.
  4) Guardar `ha_access_token`, `ha_refresh_token`, `ha_token_expires_at = now + expires_in*1000`.
- Renovación: si el `access_token` expiró, solicitar nuevo en `/auth/token` con `grant_type=refresh_token` y actualizar storage.
- Conexión HAKit: pasar `hassToken={ha_access_token}`; ante `auth_invalid`, limpiar storage y volver al login.

## Caddy (LXC) como reverse proxy
- Site para cada cliente: `https://<cliente>.nexdom.mx` que sirve la PWA y proxyea endpoints de HA:
```
# Caddyfile
<cliente>.nexdom.mx {
  encode zstd gzip
  header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

  # PWA (estático o upstream hacia la LXC de PWA)
  root * /srv/pwa
  try_files {path} /index.html
  file_server

  # Auth y API hacia HAOS (red interna)
  @auth path /auth*        
  reverse_proxy @auth http://homeassistant.local:8123 {
    header_up X-Forwarded-Host {host}
    header_up X-Forwarded-Proto https
  }

  @api path /api*          
  reverse_proxy @api http://homeassistant.local:8123 {
    header_up X-Forwarded-Host {host}
    header_up X-Forwarded-Proto https
  }

  # WebSocket
  @ws path /api/websocket
  reverse_proxy @ws http://homeassistant.local:8123 {
    transport http {
      keepalive 30s
    }
  }
}
```
- Asegura soporte de WebSocket end-to-end (Cloudflared soporta WS; Caddy lo maneja por defecto en `reverse_proxy`).

## Desarrollo local
- Mantener Vite sirviendo en `localhost:5173`, pero usar el mismo flujo OAuth: para pruebas, acceder desde el dominio real (túnel Cloudflared) o configurar un subdominio dev que apunte a tu PWA. Evita mezclar `localhost` con dominio en OAuth.
- (Opcional) Vite proxy solo para dev: `/auth`, `/api` con `target: https://<cliente>.nexdom.mx` y `ws: true`, para que el browser siga hablando con un único origen.

## Archivos a modificar
- `PWA/public/login/index.html`: implementar authorize + token; guardar `access/refresh` y expiración.
- `PWA/public/auth_callback.html` (nuevo): manejar `code` y canjear tokens.
- `PWA/src/providers/HAProvider.tsx`: usar `window.location.origin`, leer/renovar tokens y conectar HAKit.
- `PWA/vite.config.ts`: en dev, habilitar `ws: true` en `/api`; mantener `/auth` y `/api` hacia el dominio del cliente.

## Verificación
- Login en `https://<cliente>.nexdom.mx`: credenciales válidas → authorize → token guardado.
- HAKit abre `wss://<cliente>.nexdom.mx/api/websocket` vía proxy interno; sin `ERR_INVALID_AUTH`.
- Se listan entidades reales en Dashboard; expiración renueva correctamente.

¿Confirmas y procedo a preparar los cambios (sin tocar tu Caddy de producción, solo PWA y Vite)?