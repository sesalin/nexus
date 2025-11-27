# Home Assistant Add-on: Nexdom OS

## Descripción

Nexdom OS es un dashboard de casa inteligente de próxima generación diseñado específicamente para Home Assistant Operating System (HAOS). Proporciona una interfaz moderna y responsiva para controlar y monitorizar todos los dispositivos conectados a tu instalación de Home Assistant.

## Características

- **Dashboard en Tiempo Real**: Actualizaciones automáticas mediante WebSocket
- **Gestión por Zonas**: Organiza dispositivos por áreas de tu hogar
- **Interfaz Moderna**: Diseño glassmorphism con efectos neón
- **Optimización Móvil**: Interfaz responsive con gestos táctiles
- **Integración Nativa**: Conexión directa con la API de Home Assistant
- **Temas Personalizables**: Sistema de temas dinámico

## Integración con Home Assistant

### API REST
- **URL Base**: `http://homeassistant.local:8123/api/`
- **Autenticación**: Token Bearer (generado automáticamente por HAOS)
- **Endpoints Principales**:
  - `/states` - Estados de entidades
  - `/services` - Servicios disponibles
  - `/config` - Configuración del sistema

### WebSocket
- **URL**: `ws://homeassistant.local:8123/api/websocket`
- **Autenticación**: Token en mensaje inicial
- **Eventos en Tiempo Real**:
  - `state_changed` - Cambios de estado de entidades
  - `service_called` - Servicios ejecutados
  - `config_changed` - Cambios de configuración

## Arquitectura del Add-on

```
ha-addon/
├── config.json          # Configuración del add-on
├── run.sh              # Script de inicio
├── Dockerfile          # Imagen Docker
├── /frontend/          # Código fuente de Nexdom OS
│   ├── src/
│   ├── public/
│   └── package.json
└── /docs/             # Documentación
```

## Configuración

### Variables de Entorno
```bash
# Automáticas (configuradas por HAOS)
HA_URL=http://homeassistant.local:8123
HA_TOKEN=<auto-generado>

# Opcionales
NEXDOM_THEME=dark|light|auto
NEXDOM_ZONE_VIEW=grid|list
NEXDOM_ANIMATIONS=true|false
```

### Configuración JSON
```json
{
  "webui": "http://[HOST]:[PORT:8123]",
  "theme": "dark"
}
```

## Mapeo de Entidades a Tarjetas

### Tipos de Entidades Home Assistant
```typescript
interface HAEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name: string;
    unit_of_measurement?: string;
    device_class?: string;
    icon?: string;
    // ... más atributos
  };
  last_changed: string;
  last_updated: string;
}

interface NexdomGadget {
  id: string;
  haEntityId: string;
  name: string;
  type: 'light' | 'switch' | 'sensor' | 'camera' | 'lock' | 'climate';
  status: string;
  isActive: boolean;
  value?: string;
  category: string; // Basada en área de Home Assistant
}
```

### Agrupación por Áreas
```typescript
// Obtener áreas de Home Assistant
const areas = await fetch(`${HA_URL}/api/config/area_registry`);

// Mapear entidades a áreas
const entitiesByArea = entities.filter(e => 
  e.attributes.area_id === area.area_id
);

// Crear gadget por área
const zoneGadgets = entitiesByArea.map(entity => ({
  id: entity.entity_id,
  name: entity.attributes.friendly_name,
  type: mapHAStateToGadgetType(entity),
  status: entity.state,
  isActive: entity.state !== 'off' && entity.state !== 'unavailable',
  value: entity.attributes.unit_of_measurement 
    ? `${entity.state} ${entity.attributes.unit_of_measurement}`
    : entity.state,
  category: area.name
}));
```

## API de Integración

### Cliente Home Assistant
```typescript
class HomeAssistantClient {
  private baseUrl: string;
  private token: string;
  private ws: WebSocket | null = null;
  
  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }
  
  // REST API
  async getStates(): Promise<HAEntity[]> {
    const response = await fetch(`${this.baseUrl}/api/states`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }
  
  async callService(domain: string, service: string, data: any) {
    const response = await fetch(`${this.baseUrl}/api/services/${domain}/${service}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
  
  // WebSocket para tiempo real
  connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.baseUrl.replace('http', 'ws') + '/api/websocket');
      
      this.ws.onopen = () => {
        // Autenticar
        this.ws?.send(JSON.stringify({
          type: 'auth',
          access_token: this.token
        }));
      };
      
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      };
    });
  }
  
  private handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'auth_ok':
        // Suscribirse a cambios
        this.ws?.send(JSON.stringify({
          id: 1,
          type: 'subscribe_events',
          event_type: 'state_changed'
        }));
        break;
        
      case 'event':
        // Actualizar estado en tiempo real
        if (message.event.data.new_state) {
          this.updateEntityState(message.event.data);
        }
        break;
    }
  }
}
```

## Implementación de Zonas

### Obtención de Áreas
```typescript
const getHomeAssistantAreas = async () => {
  const response = await fetch(`${HA_URL}/config/area_registry`, {
    headers: { 'Authorization': `Bearer ${HA_TOKEN}` }
  });
  
  const areas = await response.json();
  return areas.map(area => ({
    id: area.area_id,
    name: area.name,
    icon: area.icon || 'mdi:home',
    entities: [] // Se llenarán con entidades del área
  }));
};
```

### Actualización en Tiempo Real
```typescript
// Escuchar cambios de estado y actualizar zonas
useEffect(() => {
  const wsClient = new HomeAssistantClient(HA_URL, HA_TOKEN);
  
  wsClient.connectWebSocket().then(() => {
    wsClient.onStateChanged((entityId, oldState, newState) => {
      // Actualizar estado en la zona correspondiente
      setZones(prevZones => 
        prevZones.map(zone => ({
          ...zone,
          gadgets: zone.gadgets.map(gadget => 
            gadget.haEntityId === entityId 
              ? { ...gadget, status: newState.state, isActive: newState.state !== 'off' }
              : gadget
          )
        }))
      );
    });
  });
  
  return () => wsClient.disconnect();
}, []);
```

## Comandos de Control

### Servicios de Home Assistant
```typescript
// Toggle de luz
await homeAssistant.callService('light', 'toggle', {
  entity_id: 'light.living_room'
});

// Setter de temperatura
await homeAssistant.callService('climate', 'set_temperature', {
  entity_id: 'climate.hallway',
  temperature: 22
});

// Lock/Unlock
await homeAssistant.callService('lock', 'lock', {
  entity_id: 'lock.front_door'
});
```

## Configuración del Build

### package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "serve": "serve -s dist -l 8123"
  }
}
```

### Dockerfile optimizado
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8123
CMD ["nginx", "-g", "daemon off;"]
```

## Seguridad

### Autenticación
- Token Bearer automático de HAOS
- No se almacenan credenciales en el frontend
- Validación de token en cada request

### CORS
- Acceso limitado al dominio de Home Assistant
- Headers de autenticación preservados

## Instalación y Despliegue

### Desde el Store de Add-ons
1. Instalar el add-on desde el Home Assistant Add-on Store
2. Configurar las opciones deseadas
3. Iniciar el add-on
4. Acceder desde la UI de Home Assistant

### Manual
```bash
# Construir la imagen
docker build -t nexdom-os .

# Ejecutar con variables de entorno
docker run -d \
  --name nexdom-os \
  -p 8123:8123 \
  -e HA_URL=http://homeassistant.local:8123 \
  -e HA_TOKEN=<your_token> \
  nexdom-os
```

## Monitoreo

### Logs del Add-on
```bash
# Ver logs en tiempo real
ha add-on logs nexdom-os

# Logs específicos
ha add-on logs nexdom-os --stdout
```

### Health Checks
- Endpoint: `http://localhost:8123/`
- Frecuencia: Cada 30 segundos
- Timeout: 3 segundos

## Roadmap

### Próximas Características
1. **Integración con HACS**: Instalación automática desde HACS
2. **Temas Personalizados**: Editor de temas integrado
3. **Notificaciones**: Sistema de notificaciones nativas de HA
4. **Panel de Administración**: Configuración avanzada desde HA
5. **Soporte Multi-instancia**: Múltiples instalaciones de HA

### Optimizaciones
1. **Lazy Loading**: Carga bajo demanda de componentes
2. **Service Worker**: Funcionalidad offline
3. **PWA**: Instalación como aplicación web
4. **Compresión**: Assets optimizados para redes lentas

---

**Nota**: Este add-on está diseñado para integrarse completamente con el ecosistema de Home Assistant, aprovechando sus APIs nativas y sistema de autenticación para una experiencia seamless.
