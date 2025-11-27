# Testing Local del Backend Proxy

## 🏗️ Build y Deploy

### 1. Build de la imagen Docker

```bash
# Build del add-on con backend + frontend
docker build -t nexdom-os:test -f ha-addon/Dockerfile .

# Verificar que la imagen se creó
docker images | grep nexdom-os
```

### 2. Testing con Docker

```bash
# Ejecutar el add-on (SIN bindear puerto 8123 hacia fuera)
docker run -d \
  --name nexdom-test \
  --cap-add NET_ADMIN \
  -e SUPERVISOR_TOKEN=mock-token-for-testing \
  nexdom-os:test

# Ver logs
docker logs -f nexdom-test

# Verificar que ambos servicios están corriendo
docker exec nexdom-test ps aux
```

## 🔍 Verificación de Endpoints

### 1. Health Check

```bash
# Verificar que el backend está funcionando
docker exec nexdom-test curl -f http://localhost:3000/health

# Respuesta esperada:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-27T23:18:05.000Z",
#   "supervisor_url": "http://supervisor",
#   "has_supervisor_token": true
# }
```

### 2. API REST Endpoints

```bash
# Test endpoint de estados (falla porque no hay HA real, pero muestra que funciona)
docker exec nexdom-test curl -f http://localhost:3000/api/states

# Test endpoint de áreas  
docker exec nexdom-test curl -f http://localhost:3000/config/area_registry

# Test con nginx proxy
docker exec nexdom-test curl -f http://localhost:8123/health
```

### 3. WebSocket Testing

```bash
# Test básico de WebSocket (requiere wscat)
docker exec nexdom-test npm install -g wscat

# Conectar WebSocket
docker exec nexdom-test wscat -c ws://localhost:8123/ws

# Enviar mensaje de autenticación
# {"type":"auth_required","access_token":"mock"}
```

## 📊 Monitoring y Logs

### 1. Verificar Logs del Backend

```bash
# Logs del backend Node.js
docker exec nexdom-test tail -f /app/logs/backend.log

# Logs de nginx
docker exec nexdom-test tail -f /var/log/nginx/access.log
```

### 2. Verificar Procesos

```bash
# Ver procesos corriendo
docker exec nexdom-test ps aux

# Deberías ver:
# - node /app/backend/src/server.js
# - nginx: master process nginx
```

### 3. Verificar Puertos

```bash
# Verificar que los puertos están escuchando
docker exec nexdom-test netstat -tlnp

# Puertos esperados:
# - 3000: Backend proxy Node.js
# - 8123: Nginx reverse proxy
```

## 🐛 Troubleshooting

### Backend no inicia

```bash
# Verificar variables de entorno
docker exec nexdom-test env | grep SUPERVISOR

# Verificar sintaxis del backend
docker exec nexdom-test node --check /app/backend/src/server.js

# Verificar dependencias del backend
docker exec nexdom-test npm list
```

### Nginx no inicia

```bash
# Verificar configuración nginx
docker exec nexdom-test nginx -t

# Ver logs de nginx
docker exec nexdom-test cat /var/log/nginx/error.log
```

### CORS errors

```bash
# Verificar headers CORS
docker exec nexdom-test curl -H "Origin: http://localhost" -v http://localhost:8123/api/states
```

## 📈 Performance Testing

```bash
# Test de carga básico
docker exec nexdom-test ab -n 100 -c 10 http://localhost:8123/health

# Test WebSocket con múltiples conexiones
docker exec nexdom-test npm install -g autocannon
docker exec nexdom-test autocannon ws://localhost:8123/ws -d 10 -c 5
```

## 🧹 Cleanup

```bash
# Parar y limpiar
docker stop nexdom-test
docker rm nexdom-test
docker rmi nexdom-os:test
```

## ✅ Verificación Final

Al final del testing, deberías poder:

1. ✅ Acceder a `http://localhost:8123` y ver la aplicación
2. ✅ Obtener respuesta de `http://localhost:8123/health`
3. ✅ Ver logs del backend proxy en `/app/logs/backend.log`
4. ✅ Confirmar que ambos procesos (Node.js y nginx) están corriendo

**Nota:** En producción, el add-on recibe `SUPERVISOR_TOKEN` real de Home Assistant Supervisor y se conecta a `http://supervisor/core/api` y `ws://supervisor/core/websocket`.