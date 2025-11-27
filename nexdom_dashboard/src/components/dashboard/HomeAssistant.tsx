import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Cliente para Home Assistant
class HomeAssistantClient {
  private baseUrl: string;
  private token: string;
  private ws: WebSocket | null = null;
  private messageId: number = 1;
  private listeners: Map<string, Function[]> = new Map();

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getStates() {
    const response = await fetch(`${this.baseUrl}/api/states`, {
      headers: { 
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  async getAreas() {
    const response = await fetch(`${this.baseUrl}/config/area_registry`, {
      headers: { 
        'Authorization': `Bearer ${this.token}`
      }
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

      this.ws.onerror = (error) => {
        console.error('[Nexdom] Error WebSocket:', error);
        reject(error);
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
        this.emit('connected', true);
        break;
        
      case 'auth_invalid':
        console.error('[Nexdom] Autenticación WebSocket fallida');
        this.emit('connected', false);
        break;
        
      case 'event':
        if (message.event.event_type === 'state_changed') {
          this.emit('state_changed', message.event.data);
        }
        break;
    }
  }

  private subscribeToEvents() {
    this.ws?.send(JSON.stringify({
      id: this.messageId++,
      type: 'subscribe_events',
      event_type: 'state_changed'
    }));
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
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

  useEffect(() => {
    const baseUrl = process.env.HA_URL || 'http://homeassistant.local:8123';
    const token = process.env.HA_TOKEN;
    
    if (!token) {
      console.warn('[Nexdom] No se encontró token de HA, usando datos mock');
      return;
    }

    const haClient = new HomeAssistantClient(baseUrl, token);
    setClient(haClient);

    // Cargar datos iniciales
    const loadData = async () => {
      try {
        const [states, areas] = await Promise.all([
          haClient.getStates(),
          haClient.getAreas()
        ]);
        
        setEntities(states);
        createZonesFromEntities(states, areas);
      } catch (error) {
        console.error('[Nexdom] Error cargando datos:', error);
      }
    };

    loadData();

    // Conectar WebSocket
    haClient.connectWebSocket().catch(console.error);

    // Escuchar eventos
    haClient.on('connected', setIsConnected);
    haClient.on('state_changed', (data: any) => {
      const { entity_id, old_state, new_state } = data;
      
      setEntities(prev => 
        prev.map(entity =>
          entity.entity_id === entity_id ? { ...entity, ...new_state } : entity
        )
      );
      
      // Actualizar zonas
      setZones(prevZones => 
        prevZones.map(zone => ({
          ...zone,
          entities: zone.entities.map((entity: any) =>
            entity.entity_id === entity_id ? { ...entity, ...new_state } : entity
          )
        }))
      );
    });

    return () => haClient.disconnect();
  }, []);

  const createZonesFromEntities = (states: any[], areas: any[]) => {
    const zonesWithEntities = areas.map(area => ({
      id: area.area_id,
      name: area.name,
      entities: states.filter(entity => entity.attributes.area_id === area.area_id)
    }));

    const unassignedEntities = states.filter(entity => !entity.attributes.area_id);
    if (unassignedEntities.length > 0) {
      zonesWithEntities.push({
        id: 'unassigned',
        name: 'Sin Asignar',
        entities: unassignedEntities
      });
    }

    setZones(zonesWithEntities);
  };

  const callService = async (domain: string, service: string, data: any) => {
    if (!client) return;
    
    try {
      const result = await client.callService(domain, service, data);
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
    callService,
    toggleEntity
  };
};

// Componente de conexión
export const HomeAssistantStatus: React.FC = () => {
  const { isConnected } = useHomeAssistant();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
        isConnected 
          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`} />
        {isConnected ? 'HA Conectado' : 'HA Desconectado'}
      </div>
    </motion.div>
  );
};

export default HomeAssistantClient;
