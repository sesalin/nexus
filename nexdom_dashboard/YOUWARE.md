**PWA Enhancement**: La aplicación ahora incluye capacidades PWA completas que permiten instalación como app nativa, notificaciones push inteligentes y funcionamiento offline con sincronización automática.

## 🔗 Backend Proxy Reciente

### Nueva Arquitectura Implementada

Se ha implementado un **backend proxy completo** dentro del contenedor del add-on que resuelve el problema de conectividad con Home Assistant:

- **Backend Node/Express**: Proxy completo dentro del contenedor
- **REST API Proxy**: Mapea `/api/*` hacia `http://supervisor/core/api/*`
- **WebSocket Proxy**: Bidireccional hacia `ws://supervisor/core/websocket`
- **Seguridad**: SUPERVISOR_TOKEN nunca expuesto al frontend
- **Reconexión**: Manejo automático de reconexiones WebSocket
- **Nginx Reverse Proxy**: Configuración completa para producción

### Endpoints Disponibles

```bash
GET /api/states                    # Estados de entidades
GET /api/states/:entityId          # Estado específico
GET /config/area_registry          # Áreas registradas
GET /config/entity_registry        # Registro de entidades
POST /api/services/:domain/:service # Llamar servicios
GET /health                        # Health check
ws://localhost:8123/ws             # WebSocket proxy
```

### Archivos Principales del Backend

- `backend/src/server.js` - Servidor proxy principal
- `backend/package.json` - Dependencias del backend
- `nginx/nginx.conf` - Configuración reverse proxy
- `ha-addon/run.sh` - Script de inicio con backend
- `ha-addon/Dockerfile` - Multi-stage build

### Frontend Actualizado

El componente `HomeAssistant.tsx` ha sido completamente actualizado para usar rutas relativas:

- **Sin tokens**: No depende de `process.env.HA_*`
- **Rutas API**: Usa `/api/states`, `/config/area_registry`, etc.
- **WebSocket local**: Conecta a `/ws` del mismo origen
- **Error handling**: Manejo robusto de errores y fallbacks

### Configuración de Seguridad

- **Token Protection**: SUPERVISOR_TOKEN nunca expuesto al frontend
- **CORS Restringido**: Solo conexiones del host local
- **Rate Limiting**: Prevención de abuso de API
- **Headers de Seguridad**: Implementados con Helmet.js
- **Logs Seguros**: Nunca exponen credenciales

### Testing y Verificación

```bash
# Verificar sintaxis backend
node --check backend/src/server.js

# Build completo
npm run build

# Testing con mock
docker run -p 8123:8123 \
  -e SUPERVISOR_TOKEN=mock-token \
  nexdom-os

# Verificar endpoints
curl http://localhost:8123/health
curl http://localhost:8123/api/states
```

**Estado Final**: ✅ El problema original está resuelto - la aplicación ahora puede conectarse realmente a Home Assistant sin exponer tokens al frontend.