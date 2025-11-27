# Nexdom OS - Smart Home Dashboard para Home Assistant

Un dashboard de casa inteligente de próxima generación diseñado específicamente para Home Assistant Operating System (HAOS).

## 🚀 Funcionalidades PWA Recientes

### 📱 Aplicación Progresiva Web (PWA)
- **Instalación móvil**: La app se puede instalar como aplicación nativa en dispositivos móviles
- **Notificaciones push**: Alertas en tiempo real de eventos de dispositivos y alertas de seguridad
- **Funcionamiento offline**: Cache inteligente que permite usar la app sin conexión a internet
- **Sincronización automática**: Acciones pendientes se ejecutan al restaurar conexión

### 🔔 Sistema de Notificaciones Avanzado
- **Eventos de dispositivos**: Notificaciones automáticas cuando luces, switches, sensores cambian estado
- **Alertas de seguridad**: Notificaciones críticas para eventos de seguridad
- **Configuración granular**: Personalización individual por tipo de dispositivo
- **Integración HA**: Detección automática de eventos de Home Assistant

### 📶 Capacidades Offline
- **Service Worker**: Cache inteligente con estrategias optimizadas por tipo de contenido
- **Fallbacks inteligentes**: Respuestas apropiadas cuando no hay conexión
- **Indicadores visuales**: Estado de conectividad visible en tiempo real
- **Background Sync**: Sincronización automática de acciones pendientes

## Resumen Ejecutivo

Nexdom OS transforma tu experiencia de casa inteligente al proporcionar una interfaz moderna y responsiva que se integra seamlessly con Home Assistant. Como add-on oficial de HAOS, aprovecha las APIs nativas para comunicación eficiente, actualización en tiempo real y gestión completa de dispositivos.

## Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend Integration**: Home Assistant REST API + WebSocket
- **Containerization**: Docker optimizado para HAOS
- **Deployment**: Add-on oficial de Home Assistant
- **PWA**: Service Worker, Manifest, Notificaciones Push

### Integración Home Assistant
- **REST API**: Estados de entidades, servicios, configuración
- **WebSocket**: Actualizaciones en tiempo real, eventos de estado
- **Autenticación**: Token Bearer automático de HAOS
- **Zonas**: Agrupación inteligente por áreas de Home Assistant

## Características Principales

### Dashboard en Tiempo Real
- Actualizaciones instantáneas mediante WebSocket
- Estado de dispositivos visible inmediatamente
- Conexión automática con Home Assistant

### Gestión por Zonas
- Organización natural por áreas de tu hogar
- Expansión suave de tarjetas de zona
- Vista consolidada de dispositivos por habitación

### Interfaz Futurista
- Diseño glassmorphism con efectos neón
- Animaciones fluidas con Framer Motion
- Iconografía unificada y consistente

### Optimización Móvil
- Navegación lateral responsive con gestos táctiles
- Interfaz adaptada para pantallas táctiles
- Performance optimizado para dispositivos móviles

## Estructura del Proyecto

```
ha-addon/                    # Configuración del add-on Home Assistant
├── config.json             # Metadata y configuración del add-on
├── run.sh                  # Script de inicialización
├── Dockerfile              # Imagen Docker optimizada
└── README.md               # Documentación del add-on

src/                        # Frontend React
├── components/
│   ├── dashboard/          # Componentes del dashboard
│   │   ├── HomeAssistant.tsx    # Cliente HA + WebSocket
│   │   ├── Icon.tsx             # Sistema de iconos unificado
│   │   ├── ModuleNav.tsx        # Navegación lateral
│   │   ├── zones/              # Gestión por zonas
│   │   ├── templates/          # Plantillas reutilizables
│   │   └── account/            # Gestión de cuenta
│   ├── HomeAssistant.md   # Guía de integración HA
│   └── README.md          # Documentación técnica para IA
├── pwa/                   # Funcionalidades PWA
│   ├── PWAUtils.tsx       # Utilidades principales PWA
│   ├── PWAInstallPrompt.tsx # Componente instalación
│   ├── NotificationSettings.tsx # Configuración notificaciones
│   └── HomeAssistantNotifications.tsx # Integración HA
├── pages/                 # Páginas principales de la aplicación
├── store/                # Estado global (Zustand)
└── types/                # Definiciones TypeScript
```

## Integración con Home Assistant

### APIs Utilizadas

#### REST API Endpoints
```typescript
// Estados de entidades
GET /api/states                    // Todos los estados
GET /api/states/{entity_id}        // Estado específico

// Servicios
POST /api/services/{domain}/{service} // Ejecutar servicios

// Configuración
GET /config/area_registry          // Áreas registradas
GET /config/entity_registry        // Registro de entidades
```

#### WebSocket Events
```typescript
// Autenticación inicial
{ type: 'auth', access_token: string }

// Suscripciones
{ 
  id: number, 
  type: 'subscribe_events', 
  event_type: 'state_changed' | 'service_called' 
}

// Eventos en tiempo real
{ 
  id: number,
  type: 'event',
  event: {
    event_type: 'state_changed',
    data: { entity_id, old_state, new_state }
  }
}
```

### Mapeo de Entidades

#### Conversión HA → Gadgets
```typescript
// Dominios de Home Assistant a tipos de gadget
const HAToGadgetType = {
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
  'vacuum': 'remote'
};

// Agrupación por categorías
const getCategoryFromDomain = (entityId: string): string => {
  const domain = entityId.split('.')[0];
  const categoryMap = {
    'light': 'Lighting',
    'switch': 'Lighting', 
    'fan': 'Lighting',
    'climate': 'Climate',
    'sensor': 'Sensors',
    'binary_sensor': 'Sensors',
    'camera': 'Security',
    'lock': 'Security',
    'cover': 'Comfort',
    'media_player': 'Media',
    'vacuum': 'Other'
  };
  return categoryMap[domain] || 'Other';
};
```

### Sistema de Zonas

#### Agrupación Automática
```typescript
interface HomeAssistantZone {
  id: string;           // area_id de HA
  name: string;         // Nombre del área
  entities: HAEntity[]; // Entidades del área
}

// Generación de zonas desde HA
const generateZonesFromHA = async (): Promise<HomeAssistantZone[]> => {
  const [areas, states] = await Promise.all([
    haClient.getAreas(),
    haClient.getStates()
  ]);
  
  return areas.map(area => ({
    id: area.area_id,
    name: area.name,
    entities: states.filter(e => e.attributes.area_id === area.area_id)
  }));
};
```

## Configuración del Add-on

### Archivo de Configuración
```json
{
  "name": "Nexdom OS",
  "version": "1.0.0", 
  "slug": "nexdom-os",
  "description": "Next-generation smart home dashboard for Home Assistant",
  "arch": ["aarch64", "amd64", "armhf", "armv7", "i386"],
  "init": false,
  "speaker": { "audio": true },
  "video": { "x11": true },
  "ports": { "8123/tcp": 8123 },
  "homeassistant_api": true,
  "hassio_api": "rest",
  "options": {
    "theme": "dark",
    "animations": true,
    "zone_view": "grid"
  },
  "schema": {
    "theme": ["dark", "light", "auto"]?",
    "animations": "bool?", 
    "zone_view": ["grid", "list"]?"
  }
}
```

### Script de Inicio
```bash
#!/bin/ash
set -e

echo "[Nexdom OS] Iniciando dashboard..."

# Verificar variables de entorno HAOS
if [ -z "$HA_URL" ] || [ -z "$HA_TOKEN" ]; then
    echo "[Error] Variables HA_URL y HA_TOKEN requeridas"
    exit 1
fi

# Probar conectividad con Home Assistant
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

# Variables para la aplicación
export NEXDOM_HA_URL="$HA_URL"
export NEXDOM_HA_TOKEN="$HA_TOKEN" 
export NEXDOM_WS_URL="${HA_URL/http/ws}/api/websocket"
export NEXDOM_THEME="${NEXDOM_THEME:-dark}"

# Iniciar servidor
exec "$@"
```

## Cliente Home Assistant

### Clase Principal
```typescript
class HomeAssistantClient {
  private baseUrl: string;
  private token: string;
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();

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
  async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/api/websocket`);
      
      this.ws.onopen = () => { /* Connected */ };
      this.ws.onmessage = (event) => this.handleWebSocketMessage(JSON.parse(event.data));
      this.ws.onclose = () => {
        // Reconectar automáticamente después de 5 segundos
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
        this.subscribeToEvents();
        this.emit('connected', true);
        break;
        
      case 'event':
        if (message.event.event_type === 'state_changed') {
          this.emit('state_changed', message.event.data);
        }
        break;
    }
  }
}
```

## Servicios de Control

### Acciones por Tipo de Dispositivo
```typescript
const handlePrimaryAction = async (entity: HAEntity) => {
  const domain = entity.entity_id.split('.')[0];
  
  switch (domain) {
    case 'light':
    case 'switch':
    case 'fan':
      // Toggle on/off
      await haClient.callService(domain, 'toggle', {
        entity_id: entity.entity_id
      });
      break;
      
    case 'lock':
      // Lock/unlock
      const action = entity.state === 'locked' ? 'unlock' : 'lock';
      await haClient.callService('lock', action, {
        entity_id: entity.entity_id
      });
      break;
      
    case 'climate':
      // Ajustar temperatura
      const temperature = prompt('Temperatura (°C):', '22');
      if (temperature !== null) {
        await haClient.callService('climate', 'set_temperature', {
          entity_id: entity.entity_id,
          temperature: parseInt(temperature)
        });
      }
      break;
  }
};
```

## Optimizaciones para HAOS

### Variables de Entorno Automáticas
```typescript
// Detectar automáticamente entorno HAOS
const isInHAOS = () => !!process.env.HA_URL && !!process.env.HA_TOKEN;

// Configuración adaptativa
const getConfiguration = () => {
  if (isInHAOS()) {
    return {
      backend: 'home_assistant',
      wsUrl: `${process.env.HA_URL?.replace('http', 'ws')}/api/websocket`,
      apiUrl: process.env.HA_URL,
      token: process.env.HA_TOKEN,
      theme: process.env.NEXDOM_THEME || 'dark'
    };
  } else {
    // Fallback para desarrollo
    return {
      backend: 'mock',
      theme: 'dark'
    };
  }
};
```

### Health Checks
```typescript
// Endpoint de health check
app.get('/health', async (req, res) => {
  try {
    if (isInHAOS()) {
      const response = await fetch(`${process.env.HA_URL}/api/`, {
        headers: { 'Authorization': `Bearer ${process.env.HA_TOKEN}` }
      });
      
      if (!response.ok) {
        return res.status(503).json({
          status: 'unhealthy',
          message: 'Cannot connect to Home Assistant'
        });
      }
    }
    
    res.json({
      status: 'healthy',
      message: 'Nexdom OS is running',
      backend: isInHAOS() ? 'home_assistant' : 'mock'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy', 
      message: error.message
    });
  }
});
```

## Desarrollo y Build

### Scripts de npm
```json
{
  "scripts": {
    "dev": "vite",                    // Desarrollo con datos mock
    "build": "vite build",            // Build para producción
    "preview": "vite preview",        // Preview del build
    "serve": "serve -s dist -l 8123"  // Servidor de producción
  }
}
```

### Dockerfile Optimizado
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm run build

FROM nginx:alpine  
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8123
CMD ["nginx", "-g", "daemon off;"]
```

## Monitoreo y Mantenimiento

### Logs del Add-on
```bash
# Ver logs en tiempo real
ha add-on logs nexdom-os

# Logs específicos
ha add-on logs nexdom-os --stdout
```

### Health Monitoring
- **Endpoint**: `http://localhost:8123/health`
- **Frecuencia**: Cada 30 segundos
- **Timeout**: 3 segundos
- **Criterios**: Conectividad HA, servicios web, memoria

## Roadmap y Evolución

### Próximas Características
1. **Integración HACS**: Instalación directa desde HACS Store
2. **Editor de Temas**: Personalización visual avanzada
3. **Notificaciones Nativas**: Sistema de alertas de HA
4. **Panel de Administración**: Configuración desde interfaz HA
5. **Multi-instancia**: Soporte para múltiples Home Assistant

### Optimizaciones Técnicas
1. **PWA Features**: ✅ Funcionalidad offline e instalación completa
2. **Service Worker**: ✅ Cache inteligente de recursos
3. **Lazy Loading**: ✅ Carga progresiva de componentes
4. **Performance Monitoring**: Métricas en tiempo real

---

**Propósito**: Nexdom OS está diseñado para ser el dashboard definitivo para Home Assistant, combinando la potencia y flexibilidad de HA con una interfaz moderna, elegante y altamente optimizada para la gestión de casa inteligente.

**PWA Enhancement**: La aplicación ahora incluye capacidades PWA completas que permiten instalación como app nativa, notificaciones push inteligentes y funcionamiento offline con sincronización automática.
