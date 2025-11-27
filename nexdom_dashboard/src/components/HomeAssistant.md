# Home Assistant Integration Guide
*Guía de Integración para Nexdom OS como Add-on de HAOS*

## Índice
1. [Arquitectura Home Assistant](#arquitectura-home-assistant)
2. [APIs de Home Assistant](#apis-de-home-assistant)
3. [Cliente WebSocket](#cliente-websocket)
4. [Mapeo de Entidades](#mapeo-de-entidades)
5. [Sistema de Zonas](#sistema-de-zonas)
6. [Autenticación](#autenticación)
7. [Servicios de Control](#servicios-de-control)
8. [Configuración del Add-on](#configuración-del-addon)

---

## Arquitectura Home Assistant

### Comunicación con Home Assistant
```typescript
// Cliente principal para comunicación con HA
class HomeAssistantClient {
  private baseUrl: string;
  private token: string;
  private ws: WebSocket | null = null;
  private messageId: number = 1;
  
  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }
  
  // Obtener todas las entidades
  async getStates(): Promise<HAEntity[]> {
    const response = await fetch(`${this.baseUrl}/api/states`, {
      headers: { 
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
  
  // Obtener áreas registradas
  async getAreas(): Promise<HAArea[]> {
    const response = await fetch(`${this.baseUrl}/config/area_registry`, {
      headers: { 
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }
  
  // Conectar WebSocket para tiempo real
  async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/api/websocket`);
      
      this.ws.onopen = () => {
        console.log('[Nexdom] WebSocket conectado');
      };
      
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      };
      
      this.ws.onclose = () => {
        console.log('[Nexdom] WebSocket cerrado');
        // Reconectar después de 5 segundos
        setTimeout(() => this.connectWebSocket(), 5000);
      };
    });
  }
  
  private handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'auth_required':
        this.ws?.send(JSON.stringify({
          type: 'auth',
          access_token: this.token
        }));
        break;
        
      case 'auth_ok':
        console.log('[Nexdom] Autenticación WebSocket exitosa');
        this.subscribeToEvents();
        resolve();
        break;
        
      case 'auth_invalid':
        console.error('[Nexdom] Autenticación WebSocket fallida');
        reject(new Error('Autenticación WebSocket fallida'));
        break;
        
      case 'event':
        if (message.event.event_type === 'state_changed') {
          this.handleStateChanged(message.event.data);
        }
        break;
        
      case 'result':
        if (message.success === false) {
          console.error('[Nexdom] Error en comando WebSocket:', message.error);
        }
        break;
    }
  }
  
  private subscribeToEvents() {
    // Suscribirse a cambios de estado
    this.ws?.send(JSON.stringify({
      id: this.messageId++,
      type: 'subscribe_events',
      event_type: 'state_changed'
    }));
    
    // Suscribirse a servicios ejecutados
    this.ws?.send(JSON.stringify({
      id: this.messageId++,
      type: 'subscribe_events',
      event_type: 'service_called'
    }));
  }
}
```

---

## APIs de Home Assistant

### REST API Endpoints
```typescript
interface HAEndpoints {
  // Entidades
  GET '/api/states'                    // Todos los estados
  GET '/api/states/{entity_id}'        // Estado específico
  POST '/api/states/{entity_id}'       // Establecer estado
  
  // Servicios
  POST '/api/services/{domain}/{service}' // Llamar servicio
  
  // Configuración
  GET '/config/area_registry'          // Áreas registradas
  GET '/config/entity_registry'        // Registro de entidades
  
  // Información del sistema
  GET '/api/'                         // Información básica
  GET '/api/config'                   // Configuración
}
```

### WebSocket API
```typescript
interface WebSocketMessages {
  // Autenticación
  { type: 'auth', access_token: string }
  
  // Suscripciones
  { 
    id: number, 
    type: 'subscribe_events', 
    event_type: 'state_changed' | 'service_called' 
  }
  
  // Respuestas
  { type: 'auth_ok' | 'auth_invalid' }
  
  // Eventos
  { 
    id: number,
    type: 'event',
    event: {
      event_type: string,
      data: any
    }
  }
}
```

---

## Mapeo de Entidades

### Tipos de Entidades a Gadgets
```typescript
// Mapeo de dominios HA a tipos de gadget
const HAToGadgetType: Record<string, GadgetProps['type']> = {
  'light': 'light',
  'switch': 'switch',
  'sensor': 'sensor',
  'binary_sensor': 'sensor',
  'climate': 'thermostat',
  'camera': 'camera',
  'lock': 'lock',
  'cover': 'cover',
  'media_player': 'remote',
  'fan': 'switch',
  'vacuum': 'remote',
  'alarm_control_panel': 'security'
};

// Mapeo de estados a categorías
const HAStateToCategory = (entity: HAEntity): string => {
  const domain = entity.entity_id.split('.')[0];
  
  switch (domain) {
    case 'light':
    case 'switch':
    case 'fan':
      return 'Lighting';
    case 'climate':
      return 'Climate';
    case 'sensor':
    case 'binary_sensor':
      return 'Sensors';
    case 'camera':
      return 'Security';
    case 'lock':
      return 'Security';
    case 'cover':
      return 'Comfort';
    case 'media_player':
      return 'Media';
    default:
      return 'Other';
  }
};

// Conversión completa
const mapHAEntityToGadget = (entity: HAEntity, area?: HAArea): GadgetProps => {
  const domain = entity.entity_id.split('.')[0];
  const gadgetType = HAToGadgetType[domain] || 'sensor';
  
  return {
    id: entity.entity_id,
    name: entity.attributes.friendly_name || entity.entity_id,
    model: entity.attributes.model || 'Home Assistant Device',
    type: gadgetType,
    iconPath: getIconPathForDomain(domain),
    status: entity.state,
    isActive: entity.state !== 'off' && entity.state !== 'unavailable',
    value: formatEntityValue(entity),
    category: area?.name || HAStateToCategory(entity),
    haEntityId: entity.entity_id,
    onPrimaryAction: () => handlePrimaryAction(entity),
    onSecondaryAction: () => openEntitySettings(entity)
  };
};

// Formateo de valores según el tipo
const formatEntityValue = (entity: HAEntity): string => {
  const { state, attributes } = entity;
  
  if (attributes.unit_of_measurement) {
    return `${state} ${attributes.unit_of_measurement}`;
  }
  
  // Casos especiales por dominio
  switch (entity.entity_id.split('.')[0]) {
    case 'light':
      if (attributes.brightness) {
        return `${Math.round((attributes.brightness / 255) * 100)}%`;
      }
      break;
    case 'climate':
      return `${state}°C`;
    case 'sensor':
      return state;
  }
  
  return state;
};
```

---

## Sistema de Zonas

### Obtención de Áreas y Entidades
```typescript
interface HomeAssistantZone {
  id: string;
  name: string;
  area_id?: string;
  entities: HAEntity[];
}

const getZonesFromHomeAssistant = async (): Promise<HomeAssistantZone[]> => {
  const [areas, states] = await Promise.all([
    homeAssistantClient.getAreas(),
    homeAssistantClient.getStates()
  ]);
  
  // Mapear entidades a áreas
  const zones: HomeAssistantZone[] = areas.map(area => ({
    id: area.area_id,
    name: area.name,
    entities: states.filter(entity => entity.attributes.area_id === area.area_id)
  }));
  
  // Agregar zona para entidades sin área
  const unassignedEntities = states.filter(entity => !entity.attributes.area_id);
  if (unassignedEntities.length > 0) {
    zones.push({
      id: 'unassigned',
      name: 'Sin Asignar',
      entities: unassignedEntities
    });
  }
  
  return zones;
};

// Actualización en tiempo real
const useHomeAssistantZones = () => {
  const [zones, setZones] = useState<HomeAssistantZone[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const client = new HomeAssistantClient(
      process.env.HA_URL || 'http://homeassistant.local:8123',
      process.env.HA_TOKEN || ''
    );
    
    // Cargar datos iniciales
    loadZones();
    
    // Conectar WebSocket
    client.connectWebSocket()
      .then(() => setIsConnected(true))
      .catch(error => console.error('Error conectando WebSocket:', error));
    
    // Manejar cambios de estado
    const handleStateChanged = (data: any) => {
      const { entity_id, old_state, new_state } = data;
      
      setZones(prevZones => 
        prevZones.map(zone => ({
          ...zone,
          entities: zone.entities.map(entity =>
            entity.entity_id === entity_id
              ? { ...entity, ...new_state }
              : entity
          )
        }))
      );
    };
    
    return () => client.disconnect();
  }, []);
  
  return { zones, isConnected };
};
```

---

## Autenticación

### Configuración Automática
```typescript
// Variables de entorno proporcionadas por HAOS
interface HAOSEnvironment {
  HA_URL: string;                    // http://homeassistant.local:8123
  HA_TOKEN: string;                  // Token de acceso largo
  NEXDOM_WS_URL?: string;           // ws://homeassistant.local:8123/api/websocket
  NEXDOM_HTTP_URL?: string;         // http://homeassistant.local:8123
}

// Validación de token
const validateHomeAssistantConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${process.env.HA_URL}/api/`, {
      headers: {
        'Authorization': `Bearer ${process.env.HA_TOKEN}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error validando conexión HA:', error);
    return false;
  }
};

// Interceptor para requests autenticados
const createAuthenticatedFetch = (baseURL: string, token: string) => {
  return async (url: string, options: RequestInit = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
    
    return fetch(fullUrl, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  };
};
```

---

## Servicios de Control

### Acciones por Tipo de Entidad
```typescript
const handlePrimaryAction = async (entity: HAEntity) => {
  const domain = entity.entity_id.split('.')[0];
  
  switch (domain) {
    case 'light':
    case 'switch':
    case 'fan':
      // Toggle on/off
      await homeAssistantClient.callService(domain, 'toggle', {
        entity_id: entity.entity_id
      });
      break;
      
    case 'lock':
      // Lock/unlock
      const action = entity.state === 'locked' ? 'unlock' : 'lock';
      await homeAssistantClient.callService('lock', action, {
        entity_id: entity.entity_id
      });
      break;
      
    case 'cover':
      // Open/close/stop
      const coverAction = entity.state === 'open' ? 'close' : 'open';
      await homeAssistantClient.callService('cover', coverAction, {
        entity_id: entity.entity_id
      });
      break;
      
    case 'media_player':
      // Play/pause
      await homeAssistantClient.callService('media_player', 'media_play_pause', {
        entity_id: entity.entity_id
      });
      break;
      
    default:
      console.warn(`Acción no soportada para ${domain}:`, entity.entity_id);
  }
};

// Servicios avanzados
const handleAdvancedAction = async (entity: HAEntity, action: string) => {
  const domain = entity.entity_id.split('.')[0];
  
  switch (domain) {
    case 'light':
      if (action === 'set_brightness') {
        // Slider de brillo
        const brightness = prompt('Brillo (0-255):', '128');
        if (brightness !== null) {
          await homeAssistantClient.callService('light', 'turn_on', {
            entity_id: entity.entity_id,
            brightness: parseInt(brightness)
          });
        }
      }
      break;
      
    case 'climate':
      if (action === 'set_temperature') {
        // Control de temperatura
        const temperature = prompt('Temperatura (°C):', '22');
        if (temperature !== null) {
          await homeAssistantClient.callService('climate', 'set_temperature', {
            entity_id: entity.entity_id,
            temperature: parseInt(temperature)
          });
        }
      }
      break;
      
    case 'media_player':
      if (action === 'volume') {
        // Control de volumen
        const volume = prompt('Volumen (0-100):', '50');
        if (volume !== null) {
          await homeAssistantClient.callService('media_player', 'volume_set', {
            entity_id: entity.entity_id,
            volume_level: parseInt(volume) / 100
          });
        }
      }
      break;
  }
};
```

---

## Configuración del Add-on

### Archivo de Configuración
```json
{
  "name": "Nexdom OS",
  "version": "1.0.0",
  "slug": "nexdom-os",
  "description": "Next-generation smart home dashboard for Home Assistant",
  "url": "https://github.com/nexdom/nexdom-os",
  "arch": ["aarch64", "amd64", "armhf", "armv7", "i386"],
  "init": false,
  "speaker": {
    "audio": true
  },
  "video": {
    "x11": true
  },
  "ports": {
    "8123/tcp": 8123
  },
  "discovery": ["webhook"],
  "homeassistant_api": true,
  "hassio_api": "rest",
  "options": {
    "webui": "http://[HOST]:[PORT:8123]",
    "theme": "dark",
    "animations": true,
    "zone_view": "grid"
  },
  "schema": {
    "webui": "str?",
    "theme": ["dark", "light", "auto"]?",
    "animations": "bool?",
    "zone_view": ["grid", "list"]?"
  },
  "image": "ghcr.io/nexdom/nexdom-os:latest"
}
```

### Script de Inicio
```bash
#!/bin/ash
set -e

echo "[Nexdom OS] Iniciando dashboard..."

# Verificar variables de entorno de HAOS
if [ -z "$HA_URL" ] || [ -z "$HA_TOKEN" ]; then
    echo "[Error] Variables HA_URL y HA_TOKEN requeridas"
    exit 1
fi

# Probar conexión con Home Assistant
echo "[Nexdom OS] Verificando conexión con Home Assistant..."
max_retries=30
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    if curl -f -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/" >/dev/null 2>&1; then
        echo "[Nexdom OS] Conexión con Home Assistant exitosa"
        break
    fi
    
    retry_count=$((retry_count + 1))
    echo "[Nexdom OS] Reintentando conexión... ($retry_count/$max_retries)"
    sleep 2
done

if [ $retry_count -eq $max_retries ]; then
    echo "[Error] No se pudo conectar con Home Assistant"
    exit 1
fi

# Variables de entorno para la aplicación
export NEXDOM_HA_URL="$HA_URL"
export NEXDOM_HA_TOKEN="$HA_TOKEN"
export NEXDOM_WS_URL="${HA_URL/http/ws}/api/websocket"
export NEXDOM_THEME="${NEXDOM_THEME:-dark}"
export NEXDOM_ANIMATIONS="${NEXDOM_ANIMATIONS:-true}"
export NEXDOM_ZONE_VIEW="${NEXDOM_ZONE_VIEW:-grid}"

echo "[Nexdom OS] Configuración:"
echo "  HA URL: $NEXDOM_HA_URL"
echo "  WebSocket URL: $NEXDOM_WS_URL"
echo "  Tema: $NEXDOM_THEME"
echo "  Animaciones: $NEXDOM_ANIMATIONS"
echo "  Vista de zonas: $NEXDOM_ZONE_VIEW"

# Iniciar servidor
echo "[Nexdom OS] Iniciando servidor web..."
exec "$@"
```

---

## Optimizaciones para HAOS

### Variables de Entorno Automáticas
```typescript
// Detectar automáticamente si estamos en HAOS
const isInHAOS = () => {
  return !!process.env.HA_URL && !!process.env.HA_TOKEN;
};

// Configuración adaptativa
const getConfiguration = () => {
  if (isInHAOS()) {
    return {
      backend: 'home_assistant',
      wsUrl: `${process.env.HA_URL?.replace('http', 'ws')}/api/websocket`,
      apiUrl: process.env.HA_URL,
      token: process.env.HA_TOKEN,
      theme: process.env.NEXDOM_THEME || 'dark',
      animations: process.env.NEXDOM_ANIMATIONS === 'true',
      zoneView: process.env.NEXDOM_ZONE_VIEW || 'grid'
    };
  } else {
    // Configuración para desarrollo local
    return {
      backend: 'mock',
      wsUrl: 'ws://localhost:3001',
      apiUrl: 'http://localhost:3001',
      theme: 'dark',
      animations: true,
      zoneView: 'grid'
    };
  }
};
```

### Health Checks Optimizados
```typescript
// Endpoint de health check que verifica conexión con HA
app.get('/health', async (req, res) => {
  try {
    if (isInHAOS()) {
      // Verificar conexión con Home Assistant
      const response = await fetch(`${process.env.HA_URL}/api/`, {
        headers: { 'Authorization': `Bearer ${process.env.HA_TOKEN}` }
      });
      
      if (!response.ok) {
        return res.status(503).json({
          status: 'unhealthy',
          message: 'Cannot connect to Home Assistant',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    res.json({
      status: 'healthy',
      message: 'Nexdom OS is running',
      timestamp: new Date().toISOString(),
      backend: isInHAOS() ? 'home_assistant' : 'mock'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

---

**Nota Importante**: Esta integración aprovecha completamente el ecosistema de Home Assistant, utilizando sus APIs nativas para una comunicación eficiente y segura. El add-on se integra seamlessly con la interfaz de usuario de Home Assistant y hereda su sistema de autenticación.
