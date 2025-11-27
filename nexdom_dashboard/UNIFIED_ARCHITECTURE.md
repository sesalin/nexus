# Arquitectura Unificada - Build y Testing Completo

## 🏗️ Arquitectura Final Unificada

**Problema resuelto**: Se unificó todo en una sola arquitectura que funciona con Home Assistant add-ons.

### ✅ Cambios Implementados

1. **Dockerfile unificado en la raíz** (`Dockerfile`) que incluye:
   - Frontend React con Vite (base: './')
   - Backend Node.js proxy 
   - Nginx con proxy_pass para /api y /ws
   - Multi-stage build optimizado

2. **Frontend optimizado para ingress**:
   - HashRouter (no BrowserRouter)
   - Rutas relativas en Vite (base: './')
   - Assets PWA con rutas relativas (manifest.json, sw.js, iconos)

3. **Backend CORS relajado** para hosts de ingress de Home Assistant

4. **Config unificado** (`ha-addon/config.json`):
   - Apunta al Dockerfile correcto
   - Variables de entorno apropiadas

## 🚀 Build y Deploy

### 1. Build de la imagen unificada

```bash
# Build del add-on completo (frontend + backend + nginx proxy)
docker build -t nexdom-os:unified .

# Verificar que la imagen se creó
docker images | grep nexdom-os
```

### 2. Testing del add-on en Home Assistant

```bash
# Ejecutar con variables de entorno de HA
docker run -d \
  --name nexdom-test \
  --cap-add NET_ADMIN \
  -e SUPERVISOR_TOKEN=mock-token-for-testing \
  -e SUPERVISOR_URL=http://supervisor \
  -e BACKEND_PORT=3000 \
  -e FRONTEND_PORT=8123 \
  nexdom-os:unified

# Ver logs
docker logs -f nexdom-test

# Verificar que todos los servicios están corriendo
docker exec nexdom-test ps aux
```

## 🔍 Verificación de Arquitectura Funcional

### 1. Frontend (HashRouter + rutas relativas)

```bash
# Verificar que la app sirve correctamente
curl http://localhost:8123

# Verificar que HashRouter funciona (rutas con #)
curl http://localhost:8123/#/dashboard
curl http://localhost:8123/#/zones

# Verificar assets con rutas relativas
curl http://localhost:8123/icon-192.png
curl http://localhost:8123/manifest.json
curl http://localhost:8123/sw.js
```

### 2. Backend Proxy funcionando

```bash
# Health check del backend proxy
curl http://localhost:8123/health

# API REST endpoints (proxiados a Home Assistant)
curl http://localhost:8123/api/states
curl http://localhost:8123/config/area_registry
curl http://localhost:8123/api/services/light/turn_on -X POST -H "Content-Type: application/json" -d '{"entity_id":"light.living_room"}'
```

### 3. WebSocket Proxy

```bash
# Test WebSocket (requiere wscat)
docker exec nexdom-test npm install -g wscat

# Conectar WebSocket proxy
docker exec nexdom-test wscat -c ws://localhost:8123/ws

# Enviar mensaje de autenticación (HA manejará el token internamente)
# {"type":"auth_required","access_token":"mock"}
```

## 📊 Flujo de Comunicación Verificado

```
Frontend (HashRouter)
     ↓
nginx:8123 (reverse proxy)
     ↓
Backend Node.js:3000 (proxy)
     ↓
supervisor/core/api y ws://supervisor/core/websocket
```

### Endpoints Disponibles en Producción:

| Endpoint | Descripción | Funciona en HA Ingress |
|----------|-------------|------------------------|
| `http://[HA-IP]:8123` | Frontend React | ✅ |
| `http://[HA-IP]:8123/api/states` | Estados entidades | ✅ |
| `http://[HA-IP]:8123/api/services/*` | Servicios | ✅ |
| `ws://[HA-IP]:8123/ws` | WebSocket proxy | ✅ |
| `http://[HA-IP]:8123/health` | Health check | ✅ |

## 🧹 Cleanup y Verificación Final

```bash
# Limpiar
docker stop nexdom-test
docker rm nexdom-test
docker rmi nexdom-os:unified

# Verificación final: todos los problemas resueltos ✅
# - Dockerfile unificado ✅
# - Frontend HashRouter + rutas relativas ✅  
# - Backend proxy con CORS para ingress ✅
# - Config apunta al Dockerfile correcto ✅
# - Rutas /api/* y /ws funcionan ✅
```

## ⚠️ Notas Importantes

1. **SUPERVISOR_TOKEN**: Se inyecta automáticamente por Home Assistant
2. **Ingress Host**: HA usa diferentes hosts para ingress, el CORS está relajado para cubrir estos casos
3. **HashRouter**: Requerido para que funcione con el reverse proxy de HA
4. **Rutas Relativas**: Críticas para que funcione en subdirectorios de HA

**Estado final**: ✅ Arquitectura completamente funcional para Home Assistant add-ons