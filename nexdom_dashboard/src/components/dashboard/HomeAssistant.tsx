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
  private pendingRequests: Map<number, { resolve: (data: any) => void; reject: (err: any) => void }> = new Map();
  private areaRegistry: any[] = [];
  private entityRegistry: any[] = [];

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
      // Usar path relativo - el proxy backend maneja la conexión a HAOS
      // No necesitamos construir la URL completa
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}${this.basePath}/ws`;

      console.log('[Nexdom] Conectando WebSocket al proxy backend:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[Nexdom] WebSocket conectado al proxy backend');
        this.reconnectAttempts = 0;
        // No resolvemos aquí, esperamos auth_ok
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
          .then((message) => {
            this.handleWebSocketMessage(message);
            // Resolver la promesa cuando recibamos auth_ok
            if (message.type === 'auth_ok') {
              resolve();
            } else if (message.type === 'auth_invalid') {
              reject(new Error('WebSocket authentication failed'));
            }
          })
          .catch((err) => {
            console.error('[Nexdom] Error parsing WebSocket message:', err);
          });
      };

      this.ws.onclose = (event) => {
        console.log('[Nexdom] WebSocket cerrado:', event.code, event.reason);
        this.ws = null;
        this.emit('connected', false);

        // Reconectar con backoff exponencial
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
          console.log(`[Nexdom] Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts})`);

          setTimeout(() => {
            this.connectWebSocket().catch(err => {
              console.error('[Nexdom] Reconnect failed:', err);
            });
          }, delay);
        } else {
          console.error('[Nexdom] Máximo número de intentos de reconexión alcanzado');
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Nexdom] Error WebSocket:', error);
        // No rechazamos aquí porque onclose se disparará después
      };
    });
  }

  private handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'auth_required':
        // En el proxy backend, la autenticación ya está manejada
        console.log('[Nexdom] Proxy solicita autenticación (ya manejado en backend)');
        break;

      case 'auth_ok':
        console.log('[Nexdom] ✓ Autenticación WebSocket exitosa');
        this.emit('connected', true);

        // Primero suscribirse a eventos
        this.subscribeToEvents();

        // Luego pedir registros de áreas y entidades por WS
        console.log('[Nexdom] Solicitando registros de áreas y entidades...');
        this.request('config/area_registry/list')
          .then((result: any) => {
            this.areaRegistry = Array.isArray(result) ? result : [];
            console.log(`[Nexdom] ✓ ${this.areaRegistry.length} áreas cargadas`);
            this.emit('area_registry', this.areaRegistry);
          })
          .catch((err) => {
            console.error('[Nexdom] Error cargando area_registry:', err);
            this.areaRegistry = [];
          });

        this.request('config/entity_registry/list')
          .then((result: any) => {
            this.entityRegistry = Array.isArray(result) ? result : [];
            console.log(`[Nexdom] ✓ ${this.entityRegistry.length} entidades en registry`);
            this.emit('entity_registry', this.entityRegistry);
          })
          .catch((err) => {
            console.error('[Nexdom] Error cargando entity_registry:', err);
            this.entityRegistry = [];
          });
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
        if (message.success === false) {
          console.error('[Nexdom] Error en servicio:', message.error);
        }
        // Resolver solicitudes pendientes por id (para listados de registro)
        if (message.id && this.pendingRequests.has(message.id)) {
          const pending = this.pendingRequests.get(message.id)!;
          this.pendingRequests.delete(message.id);
          if (message.success) {
            pending.resolve(message.result);
          } else {
            pending.reject(message.error || 'WS request failed');
          }
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

  private request(type: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = this.messageId++;
      this.pendingRequests.set(id, { resolve, reject });

      const message: any = { id, type };
      if (params) {
        Object.assign(message, params);
      }

      this.ws.send(JSON.stringify(message));

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${type} timed out`));
        }
      }, 10000);
    });
  }

  getAreaRegistry() {
    return this.areaRegistry;
  }

  getEntityRegistry() {
    return this.entityRegistry;
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
    // Usar el path base para las peticiones API
    const basePath = window.location.pathname.replace(/\/$/, '');
    const haClient = new HomeAssistantClient(basePath || '');
    setClient(haClient);

    // Cargar datos iniciales desde REST API
    const loadInitialData = async () => {
      try {
        console.log('[Nexdom] Cargando datos iniciales desde proxy backend...');

        const states = await haClient.getStates();
        console.log(`[Nexdom] ✓ ${states.length} estados cargados desde REST`);

        setEntities(states);
        setError(null);
      } catch (error) {
        console.error('[Nexdom] Error cargando datos iniciales:', error);
        setError(error instanceof Error ? error.message : 'Error de conexión');

        // Fallback a datos mock si no hay conexión
        console.log('[Nexdom] Usando datos mock como fallback');
        setEntities(getMockEntities());
        setZones(getMockZones());
      }
    };

    loadInitialData();

    // Configurar listeners ANTES de conectar WebSocket
    haClient.on('connected', (connected: boolean) => {
      console.log('[Nexdom] Conexión WebSocket:', connected ? 'establecida' : 'perdida');
      setIsConnected(connected);
    });

    // Cuando se cargan los registros de áreas y entidades, crear zonas
    haClient.on('area_registry', (areas: any[]) => {
      console.log('[Nexdom] Evento: area_registry recibido');
      const entityRegistry = haClient.getEntityRegistry();
      // Solo crear zonas si ya tenemos los estados cargados
      if (entities.length > 0) {
        createZonesFromEntities(entities, areas, entityRegistry);
      }
    });

    haClient.on('entity_registry', (entityRegistry: any[]) => {
      console.log('[Nexdom] Evento: entity_registry recibido');
      const areas = haClient.getAreaRegistry();
      // Solo crear zonas si ya tenemos los estados cargados
      if (entities.length > 0) {
        createZonesFromEntities(entities, areas, entityRegistry);
      }
    });

    haClient.on('state_changed', (data: any) => {
      const { entity_id, new_state } = data;
      if (!new_state) return;

      // Actualizar entidades
      setEntities(prev =>
        prev.map(entity =>
          entity.entity_id === entity_id
            ? { ...entity, ...new_state, attributes: { ...entity.attributes, ...new_state.attributes } }
            : entity
        )
      );

      // Disparar evento para notificaciones PWA
      window.dispatchEvent(new CustomEvent('homeassistant:state_changed', {
        detail: data
      }));
    });

    // Conectar WebSocket DESPUÉS de configurar listeners
    haClient.connectWebSocket()
      .then(() => {
        console.log('[Nexdom] ✓ WebSocket conectado y autenticado');
      })
      .catch(error => {
        console.error('[Nexdom] ✗ Error conectando WebSocket:', error);
        setError('Error de conexión WebSocket');
        setIsConnected(false);
      });

    return () => {
      console.log('[Nexdom] Limpiando conexión...');
      haClient.disconnect();
    };
  }, []);

  const createZonesFromEntities = (states: any[], areas: any[], entityRegistry: any[]) => {
    console.log('[Nexdom] Creando zonas:', { states: states.length, areas: areas.length, registry: entityRegistry.length });

    // Construir mapa de entity_id -> area_id desde entity_registry
    const entityAreaMap = new Map<string, string>();
    entityRegistry?.forEach((entry: any) => {
      if (entry?.entity_id && entry?.area_id) {
        entityAreaMap.set(entry.entity_id, entry.area_id);
      }
    });

    // Mapa de area_id -> nombre
    const areaNameMap = new Map<string, string>();
    areas?.forEach((area: any) => {
      if (area?.area_id && area?.name) {
        areaNameMap.set(area.area_id, area.name);
      }
    });

    // Agrupar entidades por área
    const grouped: Record<string, any[]> = {};
    states.forEach((entity) => {
      const areaIdFromRegistry = entityAreaMap.get(entity.entity_id);
      const areaId = areaIdFromRegistry || entity.attributes?.area_id || 'unassigned';
      if (!grouped[areaId]) {
        grouped[areaId] = [];
      }
      grouped[areaId].push(entity);
    });

    const zonesBuilt = Object.entries(grouped).map(([id, ents]) => ({
      id,
      name: areaNameMap.get(id) || (id === 'unassigned' ? 'Sin Asignar' : `Área ${id}`),
      entities: ents,
    }));

    console.log(`[Nexdom] ✓ ${zonesBuilt.length} zonas creadas`);
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
      className={`fixed top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${error
        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
        : isConnected
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${error
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
