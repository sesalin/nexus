# Guía Rápida: Testing con Debug Page

## Problema Solucionado

El error **403 Forbidden** era causado por **duplicación del path `/api/`**:
- URL incorrecta: `/api/hassio_ingress/TOKEN/api/states` ❌
- URL correcta: `/api/states` ✓

## Cambios Realizados

1. **URLs corregidas** en `HomeAssistant.tsx`:
   - `getStates()`: Ahora usa `/api/states` directamente
   - `callService()`: Ahora usa `/api/services/{domain}/{service}` directamente  
   - `connectWebSocket()`: Ahora usa `/ws` directamente

2. **Página de Debug** creada en `src/pages/Debug.tsx`
   - Prueba conexiones REST y WebSocket
   - Muestra logs en tiempo real
   - Visualiza datos recibidos

## Cómo Usar la Página de Debug

### 1. Compilar y Desplegar

```bash
cd /home/cheko/nexdom/addon/nexdom_dashboard

# Compilar frontend
npm run build

# Rebuild Docker
docker build -t nexdom-dashboard:latest .

# Push cambios al repo
cd /home/cheko/nexdom/addon
git add .
git commit -m "fix: Corregir 403 en ingress mode + agregar debug page"
git push
```

### 2. Actualizar en Home Assistant

1. **Supervisor** → **Add-on Store** → ⋮ → **Reload**
2. Buscar **Nexdom Dashboard** → **Update**
3. **Start** el add-on

### 3. Acceder a Debug Page

Abre en tu navegador:
```
http://192.168.100.148:8123/#/debug
```

O dentro del iframe de Home Assistant, navega a: `/#/debug`

### 4. Ejecutar Tests

1. Click en **"🚀 Run All Tests"**
2. Observar los logs en la sección "Console Logs"
3. Verificar que aparezcan mensajes verdes de SUCCESS:
   ```
   ✓ Backend health: {...}
   ✓ Received X states
   ✓ Received Y areas
   ✓ Received Z entity registry entries
   ✓ WebSocket connected!
   ✓ WebSocket authenticated!
   ```

### 5. Ver Datos

Las tres columnas mostrarán:
- **States**: Estados de entidades (lights, switches, sensors, etc.)
- **Areas**: Áreas configuradas en HA
- **Entity Registry**: Asignación de entidades a áreas

## Verificar que Funciona

### ✅ Señales de Éxito:

1. **Backend Health**: Status 200, `has_hassio_token: true`
2. **States**: Array con tus dispositivos
3. **WebSocket**: `✓ Connected` en verde
4. **Logs**: Sin errores 403

### ⚠️ Si Hay Errores:

1. **403 Forbidden aún aparece**:
   - Verificar que Docker rebuild funcionó
   - Ver logs del add-on: `ha addons logs nexdom_dashboard`

2. **Empty arrays ([], [], [])**:
   - Normal si no has configurado áreas en HA
   - Al menos States debería tener datos

3. **WebSocket timeout**:
   - Verificar logs del backend
   - Puede ser problema de autenticación con Supervisor

## Verificar Logs del Backend

```bash
# Ver logs del add-on
ha addons logs nexdom_dashboard

# Buscar líneas como:
# [Server] Configuration:
# [Server] API Client initialized with base URL: http://supervisor/api
# [API] Fetching states from Home Assistant...
# [WS] Connected to supervisor WebSocket
```

## Próximo Paso

Una vez que **todos los tests pasen en verde**:
1. Volver al dashboard principal: `/#/`
2. Navegar a **Zones**: `/#/zones`
3. Verificar que aparezcan tus áreas de Home Assistant
4. Probar toggle de dispositivos

---

## Debug Rápido

Si algo no funciona, compartes el output de:

```bash
# En la Debug page, copiar todo el contenido de "Console Logs"
# Y también ejecutar en terminal:
ha addons logs nexdom_dashboard > /tmp/nexdom-logs.txt
```
