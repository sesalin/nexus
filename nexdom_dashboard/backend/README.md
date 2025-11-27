# Nexdom Backend Proxy

Backend proxy que conecta con Home Assistant Supervisor API para el add-on de Nexdom OS.

## Descripción

Este backend actúa como un proxy seguro entre el frontend React y la API de Home Assistant Supervisor. Maneja la autenticación con SUPERVISOR_TOKEN y expone endpoints REST y WebSocket al frontend sin exponer credenciales.

## Características

- **REST Proxy**: Mapea endpoints `/api/*` hacia `http://supervisor/core/api/*`
- **WebSocket Proxy**: Proxy bidireccional para WebSocket hacia `ws://supervisor/core/websocket`
- **Seguridad**: CORS restringido, rate limiting, headers de seguridad
- **Reconexión**: Manejo automático de reconexiones WebSocket
- **Health Checks**: Endpoint `/health` para monitoreo

## Configuración

### Variables de Entorno

```bash
SUPERVISOR_URL=http://supervisor    # URL del Supervisor HAOS
SUPERVISOR_TOKEN=your_token         # Token de autenticación (requerido)
BACKEND_PORT=3000                   # Puerto del backend (default: 3000)
FRONTEND_PORT=8123                  # Puerto del frontend (default: 8123)
```

### Endpoints REST

- `GET /api/states` - Obtener todos los estados de entidades
- `GET /api/states/:entityId` - Obtener estado de entidad específica  
- `GET /config/area_registry` - Obtener áreas registradas
- `GET /config/entity_registry` - Obtener registro de entidades
- `POST /api/services/:domain/:service` - Llamar servicio de HA
- `GET /health` - Health check

### WebSocket

- `ws://localhost:3000/ws` - Proxy WebSocket hacia HA Supervisor

## Instalación y Uso

### Desarrollo

```bash
npm install
npm run dev
```

### Producción

```bash
npm install
npm start
```

## Docker

El backend se integra en el container principal del add-on. No necesita despliegue independiente.

## Seguridad

- No expone SUPERVISOR_TOKEN al frontend
- CORS restringido solo al host del add-on
- Rate limiting implementado
- Headers de seguridad con Helmet.js
- Validación de origen en WebSocket

## Logs

Los logs incluyen información de operaciones pero nunca exponen tokens o credenciales sensibles.

## Mantenimiento

### Monitoreo

- Health check en `/health`
- Logs estructurados para debugging
- Métricas de reconexiones WebSocket

### Troubleshooting

1. **Error 500 en endpoints**: Verificar SUPERVISOR_TOKEN y conectividad
2. **WebSocket no conecta**: Verificar SUPERVISOR_URL y puerto
3. **CORS errors**: Verificar configuración de FRONTEND_PORT

## Contribuir

Mantener compatibilidad con Node.js 18+ y seguir las mejores prácticas de seguridad.
