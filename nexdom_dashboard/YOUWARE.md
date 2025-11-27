# Youware.md - Guía para Nexdom OS

## 🎯 Arquitectura Unificada Implementada

### Problema Crítico Resuelto

Se ha implementado una **arquitectura unificada completa** que resuelve todos los problemas de desconexión entre componentes:

#### ✅ **Dockerfile Unificado**
- **Ubicación**: `Dockerfile` (raíz del proyecto)
- **Incluye**: Frontend React + Backend Node.js + Nginx con proxy
- **Problema resuelto**: Antes había dos Dockerfiles separados y el real no se usaba

#### ✅ **Frontend Optimizado para Ingress** 
- **Router**: HashRouter (funciona con HA reverse proxy)
- **Base path**: `./` en Vite (rutas relativas)
- **Assets**: PWA manifest, service worker, iconos con rutas relativas
- **Problema resuelto**: BrowserRouter y rutas absolutas causaban 404 en ingress

#### ✅ **Backend con CORS Relajado**
- **CORS**: Permite hosts de ingress de Home Assistant
- **Endpoints**: `/api/states`, `/api/services`, `/ws` funcionando
- **Proxy**: Bidireccional a supervisor/core/api y ws://supervisor/core/websocket
- **Problema resuelto**: CORS restringido a localhost solo bloqueaba ingress

#### ✅ **Configuración Unificada**
- **Archivo**: `ha-addon/config.json` 
- **Dockerfile path**: `"dockerfile": "./Dockerfile"`
- **Environment**: Variables de puerto y supervisor configuradas
- **Problema resuelto**: Config apuntaba a imagen externa en lugar de Dockerfile local

### 🔧 Comandos de Build y Testing

```bash
# Build completo unificado
docker build -t nexdom-os:unified .

# Test con variables HA
docker run -d \
  -e SUPERVISOR_TOKEN=mock-token \
  -e SUPERVISOR_URL=http://supervisor \
  nexdom-os:unified

# Verificar endpoints funcionando
curl http://localhost:8123/health              # ✅ Backend
curl http://localhost:8123/api/states          # ✅ API REST
curl http://localhost:8123/#/dashboard         # ✅ Frontend HashRouter
```

### 📁 Archivos Principales de la Arquitectura

- **`Dockerfile`** - Imagen unificada (frontend + backend + nginx)
- **`ha-addon/config.json`** - Config del add-on apuntando al Dockerfile correcto
- **`ha-addon/run.sh`** - Script que arranca backend + nginx
- **`nginx/nginx.conf`** - Reverse proxy configurado
- **`backend/src/server.js`** - Backend proxy con CORS corregido
- **`vite.config.ts`** - Base path './' para rutas relativas
- **`src/App.tsx`** - HashRouter para ingress compatibility

### 🔗 Flujo de Comunicación

```
Browser → nginx:8123 → Node.js:3000 → supervisor/core/api
         ↓          ↓               ↓
      Frontend   Reverse Proxy    Home Assistant
```

### ⚠️ Variables de Entorno Críticas

- `SUPERVISOR_TOKEN` - Se inyecta automáticamente por HA
- `SUPERVISOR_URL` - `http://supervisor` 
- `BACKEND_PORT` - `3000` (interno)
- `FRONTEND_PORT` - `8123` (exposición HA)

### 🎨 PWA y Frontend

- **Rutas relativas**: Assets y manifest usan `./` para funcionar en subdirectorios
- **HashRouter**: Compatible con reverse proxy de HA
- **Service Worker**: Registrado con ruta relativa
- **PWA Features**: Installable, notifications, offline

### 🔒 Seguridad

- **Token Protection**: SUPERVISOR_TOKEN nunca expuesto al frontend
- **CORS**: Relajado para hosts de ingress HA pero restringido para otros
- **Rate Limiting**: Implementado en backend
- **Helmet**: Headers de seguridad en nginx

### 📚 Documentación

- **`UNIFIED_ARCHITECTURE.md`** - Guía completa de build y testing
- **`TESTING.md`** - Comandos de verificación detallados
- **`IMPLEMENTATION.md`** - Detalles técnicos de la implementación

### ✅ Estado Final

**Todos los problemas originales resueltos:**
1. ✅ Docker unificado funcional
2. ✅ Frontend funciona en ingress con HashRouter + rutas relativas  
3. ✅ Backend proxy con CORS correcto para hosts HA
4. ✅ Config apunta al Dockerfile correcto
5. ✅ `/api/*` y `/ws` endpoints funcionando
6. ✅ Rutas relativas en PWA (manifest, service worker, assets)

La aplicación ahora funciona completamente como add-on de Home Assistant con arquitectura frontend + backend proxy + nginx unificada.