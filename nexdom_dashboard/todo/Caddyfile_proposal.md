# Propuesta de Corrección para Caddyfile

Basado en el reporte de debug `nexdom_ingress_debug_report.md`, el problema principal es que el Supervisor de Home Assistant rechaza la creación de la sesión (cookie) cuando el callback se hace a `/api/hassio_ingress/<slug>/`.

La solución recomendada es cambiar el endpoint del callback a `/hassio/ingress/<slug>/`.

## Cambios Sugeridos

En tu archivo `Caddyfile`, busca la sección donde manejas el callback de autenticación (probablemente donde interceptas `auth_callback=1`).

Debes cambiar la URL de redirección:

```caddy
# ANTES (Probable configuración actual)
# redir https://cheko.nexdom.mx/api/hassio_ingress/nexdom_dashboard/?auth_callback=1&code={query.code}&store_token=1

# DESPUÉS (Corrección propuesta)
redir https://cheko.nexdom.mx/hassio/ingress/nexdom_dashboard/?auth_callback=1&code={query.code}&store_token=1
```

### Por qué esto debería funcionar:

1.  **Endpoint Correcto**: `/hassio/ingress/` es el endpoint "frontend" del Ingress que maneja la creación de cookies de sesión de manera más permisiva o correcta para accesos desde el navegador, mientras que `/api/hassio_ingress/` es a menudo tratado como una API estricta.
2.  **Validación de Sesión**: Al usar `/hassio/ingress/`, el Supervisor intenta establecer la cookie `ingress_session` correctamente antes de cargar el iframe o redirigir al contenido del add-on.

## Verificación Adicional

Asegúrate también de que los headers necesarios se estén pasando correctamente si estás haciendo proxy inverso hacia HA:

```caddy
header_up X-Forwarded-Host {host}
header_up X-Ingress-Path /api/hassio_ingress/nexdom_dashboard/
```

(Nota: `X-Ingress-Path` podría ser necesario si Caddy está actuando como intermediario directo al add-on, pero si estás redirigiendo al Ingress de HA, el cambio de URL es lo más crítico).

## Pasos para aplicar:

1.  Modifica tu `Caddyfile` con el cambio de URL de redirección.
2.  Reinicia Caddy (`caddy reload` o reinicia el contenedor).
3.  Prueba el flujo de login nuevamente.
