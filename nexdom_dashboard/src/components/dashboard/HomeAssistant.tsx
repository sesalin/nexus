import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Cliente para Home Assistant
class HomeAssistantClient {
  private basePath: string;
  private ws: WebSocket | null = null;
  private messageId: number = 1;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private sessionToken: string | null = null;

  constructor(basePath: string) {
    // basePath debe incluir el prefijo de ingress (/api/hassio_ingress/...) para no saltarse el proxy
    this.basePath = basePath;
    // Generar un token de sesión temporal para autenticación
    this.generateSessionToken();
  }

  private generateSessionToken() {
    // Generar un token simple basado en timestamp y random
    this.sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getStates() {
    const response = await fetch(`${this.basePath}/api/states`, {
      headers: { 
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Unexpected response (states): ${text.slice(0, 120)}`);
    }
    
    return response.json();
  }

  async getAreas() {
    const response = await fetch(`${this.basePath}/api/config/area_registry`, {
      headers: { 
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Unexpected response (areas): ${text.slice(0, 120)}`);
    }
    
    return response.json();
  }

  async getEntityRegistry() {
    const response = await fetch(`${this.basePath}/api/config/entity_registry`, {
      headers: { 
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Unexpected response (areas): ${text.slice(0, 120)}`);
    }
    
    return response.json();
  }

  async callService(domain: string, service: string, data: any) {
    const response = await fetch(`${this.basePath}/api/services/${domain}/${service}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const isJson = (response.headers.get('content-type') || '').includes('application/json');
      const errorData = isJson ? await response.json().catch(() => ({ error: 'Service call failed' })) : null;
      if (!isJson) {
        const text = await response.text();
        throw new Error(`Service call failed: ${text.slice(0, 120)}`);
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const origin = window.location.origin.replace(/^http/, 'ws');
      const wsUrl = `${origin}${this.basePath}/ws`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[Nexdom] WebSocket conectado al proxy backend');
        this.reconnectAttempts = 0;
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        const parseMessage = async () => {
          const raw = event.data;
          if (raw instanceof Blob) {
            const text = await raw.text();
            return JSON.parse(text);
          }
          if (typeof raw === 'string') {
            return JSON.parse(raw);
          }
          return raw;
        };

        parseMessage()
          .then((message) => this.handleWebSocketMessage(message))
          .catch((err) => {
            console.error('[Nexdom] Error parsing WebSocket message:', err);
          });
      };
      
      this.ws.onclose = (event) => {
        console.log('[Nexdom] WebSocket cerrado:', event.code, event.reason);
        this.ws = null;
        
        // Reconectar con backoff exponencial
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
          console.log(`[Nexdom] Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts})`);
          
          setTimeout(() => {
            this.connectWebSocket().catch(console.error);
          }, delay);
        } else {
          console.error('[Nexdom] Máximo número de intentos de reconexión alcanzado');
          this.emit('connected', false);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Nexdom] Error WebSocket:', error);
        reject(error);
      };
    });
  }

  private handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'auth_required':
        // En el proxy backend, la autenticación ya está manejada
        console.log('[Nexdom] Autenticación requerida, pero proxy maneja esto automáticamente');
        break;
        
      case 'auth_ok':
        console.log('[Nexdom] Autenticación WebSocket exitosa');
        this.subscribeToEvents();
        this.emit('connected', true);
        break;
        
      case 'auth_invalid':
        console.error('[Nexdom] Autenticación WebSocket fallida');
        this.emit('connected', false);
        break;
        
      case 'event':
        if (message.event && message.event.event_type === 'state_changed') {
          this.emit('state_changed', message.event.data);
        }
        break;
        
      case 'result':
        // Confirmación de servicios ejecutados
        if (message.success === false) {
          console.error('[Nexdom] Error en servicio:', message.error);
        }
        break;
        
      case 'error':
        console.error('[Nexdom] Error WebSocket:', message.message);
        break;
        
      default:
        // Otros tipos de mensajes se reenvían a los listeners
        if (message.type && message.type !== 'auth_required') {
          this.emit(message.type, message);
        }
        break;
    }
  }

  private subscribeToEvents() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        id: this.messageId++,
        type: 'subscribe_events',
        event_type: 'state_changed'
      }));
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[Nexdom] Error in callback for event ${event}:`, error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Hook para usar Home Assistant
export const useHomeAssistant = () => {
  const [client, setClient] = useState<HomeAssistantClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Usar el path completo de ingress para que las peticiones lleguen al backend dentro del add-on
    const ingressPath = window.location.pathname.replace(/\/$/, '');
    const haClient = new HomeAssistantClient(ingressPath || '');
    setClient(haClient);

    // Cargar datos iniciales
    const loadData = async () => {
      try {
        console.log('[Nexdom] Cargando datos desde proxy backend...');
        
        const [states, areasResult, entityRegistryResult] = await Promise.all([
          haClient.getStates(),
          haClient.getAreas().catch((err) => {
            console.error('[Nexdom] Error cargando áreas:', err);
            return [];
          }),
          haClient.getEntityRegistry().catch((err) => {
            console.error('[Nexdom] Error cargando entity registry:', err);
            return [];
          }),
        ]);

        const areas = Array.isArray(areasResult) ? areasResult : [];
        const entityRegistry = Array.isArray(entityRegistryResult) ? entityRegistryResult : [];
        
        console.log(`[Nexdom] Estados cargados: ${states.length}, Áreas: ${areas.length}, Entidades registry: ${entityRegistry.length}`);
        setEntities(states);
        createZonesFromEntities(states, areas, entityRegistry);
        setError(null);
      } catch (error) {
        console.error('[Nexdom] Error cargando datos:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
        
        // Fallback a datos mock si no hay conexión
        setEntities(getMockEntities());
        setZones(getMockZones());
      }
    };

    loadData();

    // Conectar WebSocket
    haClient.connectWebSocket().catch(error => {
      console.error('[Nexdom] Error conectando WebSocket:', error);
      setError('Error de conexión WebSocket');
    });

    // Escuchar eventos
    haClient.on('connected', setIsConnected);
    haClient.on('state_changed', (data: any) => {
      const { entity_id, old_state, new_state } = data;
      
      // Actualizar entidades
      setEntities(prev => 
        prev.map(entity =>
          entity.entity_id === entity_id ? { ...entity, ...new_state, attributes: { ...entity.attributes, ...new_state.attributes } } : entity
        )
      );
      
      // Actualizar zonas
      setZones(prevZones => 
        prevZones.map(zone => ({
          ...zone,
          entities: zone.entities.map((entity: any) =>
            entity.entity_id === entity_id ? { ...entity, ...new_state, attributes: { ...entity.attributes, ...new_state.attributes } } : entity
          )
        }))
      );
      
      // Disparar evento para notificaciones PWA
      window.dispatchEvent(new CustomEvent('homeassistant:state_changed', {
        detail: { entity_id, old_state, new_state }
      }));
    });

    return () => haClient.disconnect();
  }, []);

  const createZonesFromEntities = (states: any[], areas: any[], entityRegistry: any[]) => {
    // Construir mapa de entity_id -> area_id desde entity_registry
    const entityAreaMap = new Map<string, string>();
    entityRegistry.forEach((entry: any) => {
      if (entry.entity_id && entry.area_id) {
        entityAreaMap.set(entry.entity_id, entry.area_id);
      }
    });

    // Mapa de area_id -> nombre
    const areaNameMap = new Map<string, string>();
    areas?.forEach((area: any) => {
      if (area.area_id) {
        areaNameMap.set(area.area_id, area.name);
      }
    });

    const grouped: Record<string, any[]> = {};
    states.forEach((entity) => {
      const areaIdFromRegistry = entityAreaMap.get(entity.entity_id);
      const areaId = areaIdFromRegistry || entity.attributes?.area_id || 'unassigned';
      grouped[areaId] = grouped[areaId] || [];
      grouped[areaId].push(entity);
    });

    const zonesBuilt = Object.entries(grouped).map(([id, ents]) => ({
      id,
      name: areaNameMap.get(id) || (id === 'unassigned' ? 'Sin Asignar' : `Área ${id}`),
      entities: ents,
    }));

    setZones(zonesBuilt);
  };

  const callService = async (domain: string, service: string, data: any) => {
    if (!client) return;
    
    try {
      const result = await client.callService(domain, service, data);
      console.log(`[Nexdom] Servicio ${domain}.${service} ejecutado exitosamente`);
      return result;
    } catch (error) {
      console.error('[Nexdom] Error llamando servicio:', error);
      throw error;
    }
  };

  const toggleEntity = async (entityId: string) => {
    const entity = entities.find(e => e.entity_id === entityId);
    if (!entity) return;

    const domain = entity.entity_id.split('.')[0];
    const action = entity.state === 'off' ? 'turn_on' : 'turn_off';
    
    await callService(domain, action, { entity_id: entityId });
  };

  return {
    client,
    isConnected,
    entities,
    zones,
    error,
    callService,
    toggleEntity
  };
};

// Datos mock para fallback
const getMockEntities = () => [
  {
    entity_id: 'light.living_room',
    state: 'off',
    attributes: {
      friendly_name: 'Luz Sala de Estar',
      area_id: 'living_room',
      brightness: 0
    }
  },
  {
    entity_id: 'switch.office_light',
    state: 'on',
    attributes: {
      friendly_name: 'Luz Oficina',
      area_id: 'office'
    }
  },
  {
    entity_id: 'climate.bedroom',
    state: 'heat',
    attributes: {
      friendly_name: 'Climatización Dormitorio',
      area_id: 'bedroom',
      temperature: 22
    }
  }
];

const getMockZones = () => [
  {
    id: 'living_room',
    name: 'Sala de Estar',
    entities: [getMockEntities()[0]]
  },
  {
    id: 'office',
    name: 'Oficina',
    entities: [getMockEntities()[1]]
  },
  {
    id: 'bedroom',
    name: 'Dormitorio',
    entities: [getMockEntities()[2]]
  }
];

// Componente de conexión
export const HomeAssistantStatus: React.FC = () => {
  const { isConnected, error } = useHomeAssistant();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
        error 
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : isConnected 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          error 
            ? 'bg-red-400' 
            : isConnected ? 'bg-green-400' : 'bg-yellow-400'
        }`} />
        {error ? 'Proxy Error' : isConnected ? 'HA Conectado' : 'Conectando...'}
      </div>
      {error && (
        <div className="mt-1 text-xs text-red-300" title={error}>
          Backend: {error.substring(0, 20)}...
        </div>
      )}
    </motion.div>
  );
};

export default HomeAssistantClient;
