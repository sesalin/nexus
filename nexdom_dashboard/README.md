# Nexdom OS - Home Assistant Add-on

Un dashboard de casa inteligente de próxima generación diseñado específicamente para Home Assistant Operating System (HAOS).

## Descripción

Nexdom OS se integra seamlessly con tu instalación de Home Assistant, proporcionando una interfaz moderna y responsiva para controlar y monitorizar todos tus dispositivos inteligentes. Diseñado como un add-on oficial de HAOS, aprovecha las APIs nativas de Home Assistant para una comunicación eficiente y segura.

## Características Principales

- **Dashboard en Tiempo Real**: Actualizaciones instantáneas mediante WebSocket
- **Gestión por Zonas**: Organización inteligente por áreas de tu hogar
- **Interfaz Futurista**: Diseño glassmorphism con efectos neón
- **Optimización Móvil**: Experiencia táctil nativa con gestos
- **Integración Nativa**: Conectividad directa con la API de Home Assistant
- **Auto-configuración**: Variables de entorno automáticas de HAOS

## Arquitectura

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Routing**: React Router DOM
- **Estado**: Zustand + Context API
- **Iconos**: Lucide React + SVGs personalizados

### Integración Home Assistant
- **REST API**: Estados de entidades, servicios, configuración
- **WebSocket**: Actualizaciones en tiempo real
- **Autenticación**: Token Bearer automático
- **Zonas**: Áreas de Home Assistant como agrupaciones

### Despliegue
- **Container**: Docker optimizado para HAOS
- **Add-on**: Configuración oficial de Home Assistant
- **Puertos**: 8123 (configurable)
- **Health Checks**: Monitoreo automático

## Instalación

### Método 1: Home Assistant Add-on Store
1. Ir a **Supervisor** → **Add-on Store**
2. Buscar "Nexdom OS"
3. Instalar y configurar
4. Iniciar el add-on

### Método 2: Repositorio Personalizado
```bash
# Agregar repositorio en Supervisor
https://github.com/nexdom/nexdom-os-addon
```

## Configuración

### Variables de Entorno (Automáticas)
```bash
# Proporcionadas por HAOS
HA_URL=http://homeassistant.local:8123
HA_TOKEN=<token_generado_automaticamente>
NEXDOM_WS_URL=ws://homeassistant.local:8123/api/websocket
```

### Configuración del Add-on
```json
{
  "theme": "dark",
  "animations": true,
  "zone_view": "grid"
}
```

## Estructura del Proyecto

```
nexdom-os/
├── ha-addon/              # Configuración del add-on
│   ├── config.json        # Configuración del add-on
│   ├── run.sh            # Script de inicio
│   ├── Dockerfile        # Imagen Docker
│   └── README.md         # Documentación del add-on
├── src/                  # Código fuente frontend
│   ├── components/       # Componentes React
│   │   ├── dashboard/    # Componentes del dashboard
│   │   │   ├── HomeAssistant.tsx  # Cliente HA
│   │   │   ├── Icon.tsx           # Sistema de iconos
│   │   │   ├── ModuleNav.tsx      # Navegación
│   │   │   ├── zones/            # Componentes de zonas
│   │   │   ├── templates/        # Plantillas
│   │   │   └── account/          # Gestión de cuenta
│   │   ├── HomeAssistant.md      # Guía de integración HA
│   │   └── README.md             # Documentación técnica
│   ├── pages/            # Páginas de la aplicación
│   ├── store/           # Estado global (Zustand)
│   └── types/           # Definiciones TypeScript
└── docs/               # Documentación general
```

## Integración con Home Assistant

### APIs Utilizadas
```typescript
// REST API Endpoints
GET /api/states                    // Estados de entidades
GET /api/config/area_registry      // Áreas registradas  
POST /api/services/{domain}/{service} // Ejecutar servicios

// WebSocket Events
subscribe_events: 'state_changed'  // Cambios de estado
subscribe_events: 'service_called' // Servicios ejecutados
```

### Mapeo de Entidades
```typescript
// Dominios HA → Tipos de Gadget
'light'      → 'light'      // Luces
'switch'     → 'switch'     // Interruptores
'sensor'     → 'sensor'     // Sensores
'climate'    → 'thermostat' // Climatización
'camera'     → 'camera'     // Cámaras
'lock'       → 'lock'       // Cerraduras
'cover'      → 'cover'      // Persianas
'media_player' → 'remote'   // Reproductores
```

### Agrupación por Zonas
```typescript
// Las entidades se agrupan automáticamente por:
// 1. Áreas de Home Assistant (área_id)
// 2. Dominios de entidades (Lighting, Climate, Security, etc.)
// 3. Estado (Activo, Inactivo, Alerta)
```

## Desarrollo

### Prerequisitos
```bash
# Instalar dependencias
npm install

# Desarrollo local con datos mock
npm run dev

# Build para producción
npm run build

# Servidor local
npm run serve
```

### Variables de Entorno de Desarrollo
```bash
# Para desarrollo sin HA
VITE_BACKEND=mock
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
```

## Flujos de Usuario

### Navegación por Zonas
1. **Selección de Zona**: Click en tarjeta de zona
2. **Expansión**: Animación suave mostrando gadgets
3. **Control**: Click en gadget para toggle/modal
4. **Tiempo Real**: Actualización automática via WebSocket

### Control de Dispositivos
1. **Acceso**: Dashboard principal o sección de gadgets
2. **Toggle**: Click en botón "Power" para activar/desactivar
3. **Configuración**: Click en botón "Settings" para opciones avanzadas
4. **Estado**: Cambio inmediato con feedback visual

### Configuración de Cuenta
1. **Acceso**: Click en avatar (esquina superior derecha)
2. **Opciones**: Perfil, Seguridad, Cerrar Sesión
3. **Modales**: Overlays con contenido específico
4. **Persistencia**: Configuración guardada en localStorage

## Optimizaciones

### Performance
- **Code Splitting**: Carga lazy de rutas y componentes
- **Asset Optimization**: Compresión de imágenes y SVGs
- **WebSocket Efficiency**: Reconexión automática y throttling
- **Memory Management**: Cleanup de event listeners

### Mobile Experience
- **Touch Gestures**: Swipe para navegación lateral
- **Responsive Design**: Breakpoints optimizados
- **Viewport Handling**: Safe areas para móviles
- **Performance**: 60fps animations

### Home Assistant Integration
- **Auto Discovery**: Detección automática de entidades nuevas
- **Real-time Updates**: WebSocket para cambios instantáneos
- **Error Recovery**: Reconexión automática en caso de fallo
- **Resource Management**: Cleanup automático de conexiones

## Troubleshooting

### Problemas Comunes

**No se conecta a Home Assistant**
```bash
# Verificar variables de entorno
echo $HA_URL
echo $HA_TOKEN

# Probar conectividad manual
curl -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/"
```

**WebSocket desconecta frecuentemente**
```javascript
// El cliente se reconecta automáticamente cada 5 segundos
// Verificar conectividad de red y firewall

// Logs del add-on
ha add-on logs nexdom-os
```

**Dispositivos no aparecen**
```javascript
// Verificar que las entidades tengan área asignada
// En Home Assistant: Configuración → Áreas, plantas y habitaciones
```

### Logs y Debugging
```bash
# Ver logs del add-on
ha add-on logs nexdom-os

# Logs en tiempo real  
ha add-on logs nexdom-os --stdout

# Debug del navegador
# Abrir Developer Tools → Console
# Buscar mensajes [Nexdom]
```

## Roadmap

### Próximas Características
1. **Integración HACS**: Instalación directa desde HACS
2. **Temas Personalizados**: Editor de temas visual
3. **Notificaciones**: Sistema nativo de Home Assistant
4. **Panel Admin**: Configuración avanzada desde HA
5. **Multi-instancia**: Soporte para múltiples HAs

### Optimizaciones Técnicas
1. **PWA**: Funcionalidad offline y instalación
2. **Service Worker**: Cache inteligente
3. **Lazy Loading**: Carga progresiva de contenido
4. **Performance Monitoring**: Métricas en tiempo real

## Soporte

### Issues y Bug Reports
- **GitHub**: https://github.com/nexdom/nexdom-os/issues
- **Discussions**: https://github.com/nexdom/nexdom-os/discussions
- **Discord**: Servidor de la comunidad

### Documentación
- **API Reference**: `/docs/api/`
- **Component Guide**: `src/components/README.md`
- **HA Integration**: `src/components/HomeAssistant.md`

---

**Nota**: Nexdom OS está diseñado para ser el dashboard definitivo para Home Assistant, combinando la potencia de HA con una interfaz moderna y elegante.
