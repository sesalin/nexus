
# Nexdom + Home Assistant Login/Ingress Debug Report

## 1. Resumen del Problema

El flujo de autenticación OAuth de Home Assistant **sí genera el código**, pero cuando redirigimos a:

```
https://cheko.nexdom.mx/api/hassio_ingress/<addon_id>/?auth_callback=1&code=XXXX&store_token=1
```

Home Assistant **responde 401** y **NO genera cookie de sesión (`ingress_session` o `session`)**.

Esto indica:

- El código **es válido** (verificado intercambiándolo por tokens en `/auth/token`).
- El problema ocurre **solo al convertir el código en cookie dentro de Ingress**.
- No es Caddy: los tests CURL directos contra el backend (`http://192.168.100.148:8123/...`) dan **el mismo 401**.

---

## 2. Todo lo que ya probamos

### ✓ 2.1 Caddy Config
- Hicimos routing root → login custom.
- Catch del callback `auth_callback=1`.
- Redirección automática a Ingress.
- DNS local corregido para evitar Cloudflare.
- HTTPS reconstruido.
- Probado con `query`, `path_regexp`, `expression`.

### ✓ 2.2 Login Custom
- Movimos:
  ```js
  client_id = ingressURL
  redirect_uri = ingressURL
  ```
- Forzamos callback hacia Ingress.
- Validamos flujo `/auth/login_flow` → OK.
- Validamos código → OK.
- Validamos redirectUrl → OK.

### ✓ 2.3 Tests CLI
- `curl -I` hacia:
  - `/api/hassio_ingress/...` → 401.
  - `/hassio/ingress/...` → 405 sin callback.
- `curl -X POST /auth/token` usando el código obteniendo tokens OK.
- Directo al backend (sin Caddy) → el mismo fallo.

Esto demuestra que **el fallo está en Supervisor/Ingress**.

---

## 3. Evidencia clave del fallo

### 3.1 Log Caddy:
```
Set-Cookie:
```

Vacío. HA no genera cookie.

### 3.2 Log del Ingress desde devtools:
```
GET /api/hassio_ingress/... 401
```

### 3.3 Verificación del código:
```
POST /auth/token → TOKEN VÁLIDO
```

Pero Ingress NO convierte ese token en cookie.

---

## 4. Arquitectura Real del Sistema

```
[Cliente Browser]
       |
       v
[Caddy reverse proxy]
       |
       v
[Home Assistant: /auth/login_flow]
       |
       |-- genera --> OAuth CODE
       |
       v
[Ingreso al Add-on vía Supervisor Ingress]
       |
       |-- debería → generar cookie ingress_session
       |
       X (aquí falla)
```

Después:

```
           [Custom Login]
                |
                | client_id = redirect_uri = ingress_url
                |
  +-------------+------------------+
  |                                |
  v                                v
/auth/login_flow         /auth/login_flow/<id>  POST
        |                                |
        |-------- CODE OK ---------------|
        |
        v
/api/hassio_ingress/<addon>/?auth_callback=1&code=XXXX
        |
        v
      (401)  ← Supervisor no genera cookie
```

---

## 5. Posibles Causas del 401

### **A) client_id NO coincide EXACTAMENTE con el esperado por Ingress**
Los add-ons normalmente esperan:
```
http://[HOST]:8123/
```
NO la URL externa.

### **B) Supervisor bloquea dominios externos**
Ingreso solo acepta:
```
http(s)://<host_internal>
```

### **C) Cookie SameSite / Secure**
Si el Supervisor cree que el dominio externo no coincide → no genera cookie.

### **D) Falta header X-Ingress-Session**
Caddy podría necesitar:
```
header_up X-Ingress-Path /api/hassio_ingress/<id>/
```

### **E) Supervisor rechaza CODE porque fue emitido para otro client_id**
Si en el flujo auth el client_id NO es EXACTO al que espera Ingress → 401.

---

## 6. Pruebas Pendientes que Codex Puede Ejecutar

### **1. Ver Logs de Supervisor**
```
ha supervisor logs
ha core logs
```

Buscar:
- invalid client_id
- invalid redirect_uri
- ingress auth failed
- unable to issue session

### **2. Ver cuál es el client_id que Home Assistant espera para Ingress**
Desde terminal HAOS:
```
grep -R "ingress" -n /usr/src
```

También comprobar:
```
ha addons info <addon_id>
```
Para ver si define client_id.

### **3. Test manual EXACTO REDIRECT**
Enviar con curl:
```
curl -I "http://192.168.100.148:8123/api/hassio_ingress/<id>/?auth_callback=1&code=<CODE>"
```

### **4. Validar si Supervisor bloquea dominios externos**
Probar desde dentro de HAOS:
```
curl -I "https://cheko.nexdom.mx"
```

---

## 7. Posibles Soluciones

### **Solución 1 — Usar client_id EXACTO de Ingress interno**
Intentar:
```
client_id = http://homeassistant.local:8123/
redirect_uri = http://homeassistant.local:8123/api/hassio_ingress/<id>/
```

### **Solución 2 — Hacer callback a /hassio/ingress/ y no /api/hassio_ingress/**
Ejemplo:
```
https://cheko.nexdom.mx/hassio/ingress/<id>?auth_callback=1&code=...
```

### **Solución 3 — Añadir headers especiales para Supervisor Ingress**
En Caddy:
```
header_up X-Ingress-Path /api/hassio_ingress/<id>/
header_up X-Forwarded-Host {host}
header_up X-Forwarded-Proto https
```

### **Solución 4 — NO usar dominio externo como client_id**
HA podría interpretarlo como dominio inseguro.

---

## 8. Recomendación para Codex

Verificar:

```
ha supervisor logs | grep ingress
ha core logs | grep auth
ha core logs | grep oauth
```

Luego confirmar cuál client_id Home Assistant espera para emitir cookie en ingress.

---

## 9. Archivos que Ya Modificamos

### ✓ index.html
- client_id = ingressURL  
- redirect_uri = ingressURL  
- callback directo → Ingress  

### ✓ Caddyfile
- root/login
- callback
- redirecciones
- routing homeassistant
- DNS fijo local

### ✓ server.js
- WebSocket proxy with id mapping  
- REST proxy  
- Registry/area endpoints  
- Fixes for WS events  

---

## 10. Próximos Pasos

1. Revisar logs del Supervisor.
2. Determinar el client_id correcto.
3. Reintentar login sin reescribir /auth/authorize.
4. Ajustar callback EXACTO a lo que HA espera.
5. Probar /hassio/ingress/ en lugar de /api/hassio_ingress/.

---

¿Quieres que genere **un PDF**, **un docx**, o **un archivo .zip** con todos los archivos (Caddyfile, index.html, server.js, este md)?  
Con gusto lo preparo.

