import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Cliente para Home Assistant
class HomeAssistantClient {
  private basePath: string;
  private ws: WebSocket | null = null;
  // CRITICAL FIX: Usar timestamp para evitar id_reuse en reconexiones
  // Home Assistant requiere que los IDs siempre incrementen, incluso después de reconectar
  private messageId: number = Date.now();
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts: number = 0;
  private lastStableConnection: number = 0;
  private sessionToken: string | null = null;
  private pendingRequests: Map<number, { resolve: (data: any) => void; reject: (err: any) => void }> = new Map();
  private areaRegistry: any[] = [];
  private entityRegistry: any[] = [];
  private deviceRegistry: any[] = [];

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
    // IMPORTANTE: Cuando se ejecuta como ingress add-on, basePath ya incluye todo el routing
    // NO debemos agregar /api/ de nuevo - el backend ya está en /api/states
    // El basePath en ingress es algo como: /api/hassio_ingress/TOKEN
    // Y el nginx del add-on ya redirige eso al backend en puerto 3000
    // Entonces solo necesitamos hacer fetch a '/api/states' directamente
    const url = `/api/states`;

    console.log('[HomeAssistant] Fetching states from:', url);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`[HomeAssistant] States request failed: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[HomeAssistant] Unexpected response type:', contentType);
      throw new Error(`Unexpected response (states): ${text.slice(0, 120)}`);
    }

    return response.json();
  }

  getDeviceRegistry() {
    return this.deviceRegistry;
  }

  // Apply entity filters based on configuration
  public applyEntityFilters(entities: any[], config: any): any[] {
    if (!config) return entities;

    let filtered = [...entities];
    // console.log(`[Nexdom] Filtering ${filtered.length} entities with config`);

    // Helper: Match pattern with wildcards
    const matchesPattern = (str: string, pattern: string): boolean => {
      const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      return new RegExp(`^${regexPattern}$`, 'i').test(str);
    };

    // Step 1: Filter by allowed domains
    if (config.allowed_domains && config.allowed_domains.length > 0) {
      filtered = filtered.filter(entity => {
        const domain = entity.entity_id.split('.')[0];
        return config.allowed_domains.includes(domain);
      });
      // console.log(`[Nexdom] After domain filter: ${filtered.length} entities`);
    }

    // Step 2: Apply hide patterns
    if (config.hide_patterns && config.hide_patterns.length > 0) {
      filtered = filtered.filter(entity => {
        return !config.hide_patterns.some((pattern: string) =>
          matchesPattern(entity.entity_id, pattern)
        );
      });
      // console.log(`[Nexdom] After hide patterns: ${filtered.length} entities`);
    }

    // Step 3: Apply filter options
    if (config.filter_options) {
      const opts = config.filter_options;

      // Require area
      if (opts.require_area) {
        filtered = filtered.filter(entity => entity.attributes?.area_id);
        // console.log(`[Nexdom] After area requirement: ${filtered.length} entities`);
      }

      // Hide unavailable
      if (opts.hide_unavailable) {
        filtered = filtered.filter(entity =>
          entity.state !== 'unavailable' && entity.state !== 'unknown'
        );
        // console.log(`[Nexdom] After unavailable filter: ${filtered.length} entities`);
      }

      // Hide disabled
      if (opts.hide_disabled) {
        filtered = filtered.filter(entity => !entity.attributes?.disabled);
      }

      // Hide hidden
      if (opts.hide_hidden) {
        filtered = filtered.filter(entity => !entity.attributes?.hidden);
      }
    }

    // Step 4: Force show patterns
    if (config.force_show_patterns && config.force_show_patterns.length > 0) {
      const forceShow = entities.filter(entity =>
        config.force_show_patterns.some((pattern: string) =>
          matchesPattern(entity.entity_id, pattern)
        )
      );
      forceShow.forEach(entity => {
        if (!filtered.find(e => e.entity_id === entity.entity_id)) {
          filtered.push(entity);
        }
      });
    }

    // Step 5: Force hide
    if (config.force_hide && config.force_hide.length > 0) {
      filtered = filtered.filter(entity =>
        !config.force_hide.includes(entity.entity_id)
      );
    }

    // console.log(`[Nexdom] Final filtered count: ${filtered.length} entities`);
    return filtered;
  }

  async callService(domain: string, service: string, data: any = {}): Promise<any> {
    console.log(`[Nexdom] Calling service via WebSocket: ${domain}.${service}`, data);

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[Nexdom] WebSocket not connected, cannot call service');
      throw new Error('WebSocket not connected');
    }

    // Usar el comando 'call_service' del WebSocket API
    // https://developers.home-assistant.io/docs/api/websocket/#calling-a-service
    return this.request('call_service', {
      domain,
      service,
      service_data: data
    }).then(result => {
      console.log(`[Nexdom] Service ${domain}.${service} executed successfully`);
      return result;
    }).catch(error => {
      console.error(`[Nexdom] Service ${domain}.${service} failed:`, error);
      throw error;
    });
  }

  async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Connect to the add-on's proxy WebSocket (NOT directly to Home Assistant)
      // The proxy backend handles the Home Assistant WebSocket connection
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}${window.location.pathname}ws`;

      console.log('[Nexdom] Conectando WebSocket al proxy del add-on:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[Nexdom] WebSocket conectado al proxy del add-on');
        this.lastStableConnection = Date.now();
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
              // Reset reconnect attempts on successful authentication
              this.reconnectAttempts = 0;
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

        // Clean up pending requests
        this.pendingRequests.forEach((pending) => {
          pending.reject(new Error('WebSocket closed'));
        });
        this.pendingRequests.clear();

        // Reset reconnect attempts if connection was stable for 60s
        const timeSinceLastStable = Date.now() - this.lastStableConnection;
        if (timeSinceLastStable > 60000) {
          this.reconnectAttempts = 0;
        }

        // Infinite reconnection with exponential backoff (capped at 60s)
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 60000);
        console.log(`[Nexdom] Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts})`);

        setTimeout(() => {
          this.connectWebSocket().catch(err => {
            console.error('[Nexdom] Reconnect failed:', err);
          });
        }, delay);
      };

      this.ws.onerror = (error) => {
        console.error('[Nexdom] Error WebSocket:', error);
        // No rechazamos aquí porque onclose se disparará después
      };
    });
  }

  private handleWebSocketMessage(message: any) {
    // console.log('[Nexdom] WS message received:', message.type);

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

        // IMPORTANTE: Pedir states primero, luego registros
        console.log('[Nexdom] Solicitando states...');
        this.request('get_states')
          .then((states: any) => {
            console.log(`[Nexdom] ✓ ${states.length} states recibidos`);
            this.emit('states_loaded', states);
          })
          .catch((err) => {
            console.error('[Nexdom] Error cargando states:', err);
          });

        // Luego solicitar registros de áreas y entidades
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

        // NUEVO: Cargar device_registry para mapear entidades a áreas vía dispositivos
        this.request('config/device_registry/list')
          .then((result: any) => {
            this.deviceRegistry = Array.isArray(result) ? result : (result as any)?.devices || [];
            console.log(`[Nexdom] ✓ ${this.deviceRegistry.length} dispositivos en registry`);
            this.emit('device_registry', this.deviceRegistry);
          })
          .catch((err) => console.error('[Nexdom] Error cargando device_registry:', err));
        break;

      case 'auth_invalid':
        console.error('[Nexdom] Autenticación WebSocket fallida');
        this.emit('connected', false);
        break;

      case 'event':
        console.log('[Nexdom] Event received:', message.event?.event_type);
        if (message.event && message.event.event_type === 'state_changed') {
          console.log('[Nexdom] State changed event:', message.event.data?.entity_id, '→', message.event.data?.new_state?.state);
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

  request(type: string, params?: any): Promise<any> {
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

  off(event: string, callback: Function) {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    this.listeners.set(event, listeners.filter(cb => cb !== callback));
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

// Context Definition
interface HomeAssistantContextType {
  client: HomeAssistantClient | null;
  isConnected: boolean;
  entities: any[];
  states: any[]; // Alias for entities
  zones: any[];
  error: string | null;
  callService: (domain: string, service: string, data: any) => Promise<any>;
  toggleEntity: (entityId: string) => Promise<void>;
  favorites: string[];
  toggleFavorite: (entityId: string) => void;
}

const HomeAssistantContext = React.createContext<HomeAssistantContextType | null>(null);

// Provider Component
export const HomeAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<HomeAssistantClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [areaRegistry, setAreaRegistry] = useState<any[]>([]);
  const [entityRegistry, setEntityRegistry] = useState<any[]>([]);
  const [deviceRegistry, setDeviceRegistry] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterConfig, setFilterConfig] = useState<any>(null);

  // Favorites State
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexdom_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('[Nexdom] Error loading favorites:', e);
      return [];
    }
  });

  // Save favorites when changed
  useEffect(() => {
    try {
      localStorage.setItem('nexdom_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('[Nexdom] Error saving favorites:', e);
    }
  }, [favorites]);

  const toggleFavorite = (entityId: string) => {
    setFavorites(prev => {
      if (prev.includes(entityId)) {
        return prev.filter(id => id !== entityId);
      } else {
        return [...prev, entityId];
      }
    });
  };

  useEffect(() => {
    // Usar el path base para las peticiones API
    const basePath = window.location.pathname.replace(/\/$/, '');
    const haClient = new HomeAssistantClient(basePath || '');
    setClient(haClient);

    let loadedStates: any[] = [];
    let loadedAreas: any[] = [];
    let loadedEntityRegistry: any[] = [];
    let loadedDeviceRegistry: any[] = [];

    // Load filter configuration
    fetch('api/config/filter')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(config => {
        console.log('[Nexdom] Filter config loaded:', config);
        setFilterConfig(config);
      })
      .catch(err => {
        console.error('[Nexdom] Error loading filter config:', err);
        // Use default config if loading fails
        setFilterConfig({
          allowed_domains: ['light', 'switch', 'lock', 'cover', 'climate', 'camera', 'media_player', 'fan'],
          filter_options: { show_main_entities_only: true, hide_unavailable: true }
        });
      });

    // Función para crear zonas cuando tengamos todos los datos
    const tryCreateZones = () => {
      if (loadedStates.length > 0 && loadedAreas.length > 0) {
        createZonesFromEntities(loadedStates, loadedAreas, loadedEntityRegistry, loadedDeviceRegistry);
      }
    };

    // Configurar listeners ANTES de conectar WebSocket
    const onConnected = (connected: boolean) => {
      console.log('[Nexdom] Conexión WebSocket:', connected ? 'establecida' : 'perdida');
      setIsConnected(connected);
    };

    const onStatesLoaded = (states: any[]) => {
      console.log('[Nexdom] States cargados, actualizando UI');
      loadedStates = states;
      setEntities(states);
      setError(null);
      tryCreateZones();
    };

    const onAreaRegistry = (areas: any[]) => {
      console.log('[Nexdom] Evento: area_registry recibido');
      loadedAreas = areas;
      setAreaRegistry(areas);
      tryCreateZones();
    };

    const onEntityRegistry = (entityReg: any[]) => {
      console.log('[Nexdom] Evento: entity_registry recibido');
      loadedEntityRegistry = entityReg;
      setEntityRegistry(entityReg);
      tryCreateZones();
    };

    const onDeviceRegistry = (deviceReg: any[]) => {
      console.log('[Nexdom] Evento: device_registry recibido');
      loadedDeviceRegistry = deviceReg;
      setDeviceRegistry(deviceReg);
      tryCreateZones();
    };

    const onStateChanged = (data: any) => {
      const { entity_id, new_state } = data;
      if (!new_state) return;

      // Actualizar entidades
      setEntities(prev => {
        console.log(`[Nexdom] Updating state for ${entity_id}: ${new_state.state}`);
        return prev.map(entity =>
          entity.entity_id === entity_id
            ? { ...entity, ...new_state, attributes: { ...entity.attributes, ...new_state.attributes } }
            : entity
        );
      });

      // Disparar evento para notificaciones PWA
      window.dispatchEvent(new CustomEvent('homeassistant:state_changed', {
        detail: data
      }));
    };

    haClient.on('connected', onConnected);
    haClient.on('states_loaded', onStatesLoaded);
    haClient.on('area_registry', onAreaRegistry);
    haClient.on('entity_registry', onEntityRegistry);
    haClient.on('device_registry', onDeviceRegistry);
    haClient.on('state_changed', onStateChanged);

    // Conectar WebSocket - los requests se harán automáticamente después de auth_ok
    console.log('[Nexdom] Iniciando conexión WebSocket...');
    haClient.connectWebSocket()
      .then(() => {
        console.log('[Nexdom] ✓ WebSocket conectado');
      })
      .catch(error => {
        console.error('[Nexdom] ✗ Error conectando WebSocket:', error);
        setError('Error de conexión WebSocket');
        setIsConnected(false);
        // Fallback a mock
        setEntities(getMockEntities());
        setZones(getMockZones());
      });

    return () => {
      console.log('[Nexdom] Limpiando conexión y listeners...');
      haClient.off('connected', onConnected);
      haClient.off('states_loaded', onStatesLoaded);
      haClient.off('area_registry', onAreaRegistry);
      haClient.off('entity_registry', onEntityRegistry);
      haClient.off('device_registry', onDeviceRegistry);
      haClient.off('state_changed', onStateChanged);
      haClient.disconnect();
    };
  }, []);

  // CRITICAL FIX: Re-calcular zonas cuando las entidades cambian (state_changed)
  useEffect(() => {
    if (entities.length > 0 && areaRegistry.length > 0) {
      createZonesFromEntities(entities, areaRegistry, entityRegistry, deviceRegistry);
    }
  }, [entities, areaRegistry, entityRegistry, filterConfig, client, deviceRegistry]);

  // Group entities by device and identify primary/secondary entities
  const groupEntitiesByDevice = (
    entities: any[],
    entityRegistry: any[],
    deviceRegistry: any[]
  ): Map<string, { primary: any; secondary: any[] }> => {
    // Auxiliary entity patterns to exclude from primary selection
    const auxiliaryPatterns = [
      '*_battery*',
      '*_signal*',
      '*_linkquality*',
      '*_rssi*',
      '*_update*',
      '*_last_seen*',
      '*_device_temperature*',
    ];

    const matchesAuxPattern = (entityId: string): boolean => {
      return auxiliaryPatterns.some(pattern => {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
        return regex.test(entityId);
      });
    };

    // Priority order for primary entity selection
    const primaryDomains = ['light', 'switch', 'lock', 'cover', 'climate', 'fan', 'media_player'];

    // Build entity_id -> device_id map
    const entityDeviceMap = new Map<string, string>();
    entityRegistry.forEach((entry: any) => {
      if (entry.entity_id && entry.device_id) {
        entityDeviceMap.set(entry.entity_id, entry.device_id);
      }
    });

    // Group entities by device_id
    const deviceGroups = new Map<string, any[]>();
    const entitiesWithoutDevice: any[] = [];

    entities.forEach(entity => {
      const deviceId = entityDeviceMap.get(entity.entity_id);
      if (deviceId) {
        if (!deviceGroups.has(deviceId)) {
          deviceGroups.set(deviceId, []);
        }
        deviceGroups.get(deviceId)!.push(entity);
      } else {
        entitiesWithoutDevice.push(entity);
      }
    });

    // For each device, identify primary and secondary entities
    const result = new Map<string, { primary: any; secondary: any[] }>();

    deviceGroups.forEach((deviceEntities, deviceId) => {
      // Filter out auxiliary entities from primary selection
      const nonAuxiliary = deviceEntities.filter(e => !matchesAuxPattern(e.entity_id));

      // Find primary entity (highest priority domain)
      let primary = null;
      for (const domain of primaryDomains) {
        primary = nonAuxiliary.find(e => e.entity_id.startsWith(domain + '.'));
        if (primary) break;
      }

      // If no primary found in priority domains, use first non-auxiliary entity
      if (!primary && nonAuxiliary.length > 0) {
        primary = nonAuxiliary[0];
      }

      // If still no primary, use first entity (even if auxiliary)
      if (!primary) {
        primary = deviceEntities[0];
      }

      // All other entities are secondary
      const secondary = deviceEntities.filter(e => e.entity_id !== primary.entity_id);

      result.set(deviceId, { primary, secondary });
    });

    // Add entities without device as individual "devices" (no secondary entities)
    entitiesWithoutDevice.forEach(entity => {
      result.set(`no_device_${entity.entity_id}`, { primary: entity, secondary: [] });
    });

    return result;
  };

  // Crear zonas desde entidades
  const createZonesFromEntities = (states: any[], areas: any[], entityRegistry: any[], deviceRegistry: any[] = []) => {
    // CRITICAL: Apply entity filters BEFORE processing
    const filteredStates = client?.applyEntityFilters(states, filterConfig) || states;

    if (!areas || areas.length === 0) {
      console.warn('[Nexdom] No hay áreas disponibles');
      setZones([]);
      return;
    }

    // CRITICAL: Group entities by device AFTER filtering
    const deviceGroups = groupEntitiesByDevice(filteredStates, entityRegistry, deviceRegistry);

    // Extract only primary entities for zone assignment
    const primaryEntities: any[] = [];
    deviceGroups.forEach((group, deviceId) => {
      // Add device_id and secondary_entities to primary entity for later use
      group.primary._device_id = deviceId;
      group.primary._secondary_entities = group.secondary;
      primaryEntities.push(group.primary);
    });

    // 1. Mapa Device ID -> Area ID
    const deviceAreaMap = new Map<string, string>();
    deviceRegistry.forEach((device: any) => {
      if (device.id && device.area_id) {
        deviceAreaMap.set(device.id, device.area_id);
      }
    });

    // 2. Mapa Entity ID -> Device ID y Entity ID -> Area ID (directo)
    const entityDeviceMap = new Map<string, string>();
    const entityDirectAreaMap = new Map<string, string>();

    entityRegistry.forEach((entry: any) => {
      if (entry.entity_id) {
        if (entry.device_id) entityDeviceMap.set(entry.entity_id, entry.device_id);
        if (entry.area_id) entityDirectAreaMap.set(entry.entity_id, entry.area_id);
      }
    });

    // 3. Función helper para obtener el área de una entidad
    const getEntityAreaId = (entityId: string, attributes: any): string | null => {
      // Prioridad 1: Asignación directa en entity_registry
      if (entityDirectAreaMap.has(entityId)) return entityDirectAreaMap.get(entityId)!;

      // Prioridad 2: Asignación en atributos del estado (raro pero posible)
      if (attributes?.area_id) return attributes.area_id;

      // Prioridad 3: A través del dispositivo
      const deviceId = entityDeviceMap.get(entityId);
      if (deviceId && deviceAreaMap.has(deviceId)) {
        return deviceAreaMap.get(deviceId)!;
      }

      return null;
    };

    // 4. Crear zonas usando SOLO entidades primarias
    const zonesBuilt = areas.map((area: any) => {
      const areaId = area.area_id;
      const areaName = area.name || `Área ${areaId}`;

      const areaEntities = primaryEntities.filter((entity) => {
        const assignedAreaId = getEntityAreaId(entity.entity_id, entity.attributes);
        return assignedAreaId === areaId;
      });

      return {
        id: areaId,
        name: areaName,
        entities: areaEntities,
      };
    });

    // 5. Zona Sin Asignar (solo entidades primarias)
    const unassignedEntities = primaryEntities.filter((entity) => {
      const assignedAreaId = getEntityAreaId(entity.entity_id, entity.attributes);
      return !assignedAreaId;
    });

    if (unassignedEntities.length > 0) {
      zonesBuilt.push({
        id: 'unassigned',
        name: 'Sin Asignar',
        entities: unassignedEntities,
      });
    }

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
    let service = '';
    let serviceData: any = { entity_id: entityId };

    switch (domain) {
      case 'lock':
        service = entity.state === 'locked' ? 'unlock' : 'lock';
        break;
      case 'cover':
        service = ['open', 'opening'].includes(entity.state) ? 'close_cover' : 'open_cover';
        break;
      case 'button':
      case 'input_button':
        service = 'press';
        break;
      case 'scene':
        service = 'turn_on';
        break;
      case 'script':
        service = 'turn_on';
        break;
      case 'media_player':
        service = entity.state === 'playing' ? 'media_pause' : 'media_play';
        break;
      default:
        service = entity.state === 'off' ? 'turn_on' : 'turn_off';
    }

    await callService(domain, service, serviceData);
  };

  const value = {
    client,
    isConnected,
    entities,
    states: entities,
    zones,
    error,
    callService,
    toggleEntity,
    favorites,
    toggleFavorite
  };

  return (
    <HomeAssistantContext.Provider value={value}>
      {children}
    </HomeAssistantContext.Provider>
  );
};

// Hook para usar Home Assistant (ahora usa Context)
export const useHomeAssistant = () => {
  const context = React.useContext(HomeAssistantContext);
  if (!context) {
    throw new Error('useHomeAssistant must be used within a HomeAssistantProvider');
  }
  return context;
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
