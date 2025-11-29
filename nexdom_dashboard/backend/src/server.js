const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { WebSocketServer } = require('ws');
const axios = require('axios');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const fs = require('fs');
const yaml = require('js-yaml');

// Configuración
const SUPERVISOR_URL = process.env.SUPERVISOR_URL || 'http://supervisor';
const HASSIO_TOKEN = process.env.HASSIO_TOKEN || process.env.SUPERVISOR_TOKEN;
const BACKEND_PORT = process.env.BACKEND_PORT || 3000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 8123;

if (!HASSIO_TOKEN) {
  console.error('[Error] HASSIO_TOKEN (or SUPERVISOR_TOKEN) is required but not provided');
  console.error('[Error] Available env vars:', Object.keys(process.env).filter(k => k.includes('HASSIO') || k.includes('SUPERVISOR')));
  process.exit(1);
}

console.log('[Server] Configuration:');
console.log(`  Supervisor URL: ${SUPERVISOR_URL}`);
console.log(`  Backend Port: ${BACKEND_PORT}`);
console.log(`  Frontend Port: ${FRONTEND_PORT}`);
console.log(`  Has Token: ${!!HASSIO_TOKEN}`);

// Crear aplicación Express
const app = express();
const server = require('http').createServer(app);

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitado para simplicidad
  crossOriginEmbedderPolicy: false
}));

// Configuración CORS - solo permitir el host del add-on
app.use(cors({
  origin: [
    `http://localhost:${FRONTEND_PORT}`,
    `http://localhost:${FRONTEND_PORT}/`,
    // Allow Home Assistant ingress origins
    /^https?:\/\/.*\.local\.ha\.dev$/
  ],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
app.use(morgan('combined'));

// Parse body para JSON
app.use(express.json({ limit: '10mb' }));

// Rate limiter para prevenir abuso
const rateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
  blockDuration: 60 // block for 60 seconds if over limit
});

// Middleware de rate limiting
app.use((req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => next())
    .catch(() => res.status(429).json({ error: 'Too many requests' }));
});

// Cliente para estados/servicios y registros
// IMPORTANTE: El Supervisor API usa /api directamente, NO /core/api
const haCoreClient = axios.create({
  baseURL: `${SUPERVISOR_URL}/api`,
  timeout: 10000,
  headers: {
    'Authorization': `Bearer ${HASSIO_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

console.log('[Server] API Client initialized with base URL:', `${SUPERVISOR_URL}/api`);

// Endpoints REST Proxy

// GET /api/states - Obtener todos los estados
app.get('/api/states', async (req, res) => {
  try {
    console.log('[API] Fetching states from Home Assistant...');
    const response = await haCoreClient.get('/states');
    console.log(`[API] Successfully fetched ${response.data.length} states`);
    res.json(response.data);
  } catch (error) {
    console.error('[Error] Getting states:', error.message);
    console.error('[Error] Response status:', error.response?.status);
    console.error('[Error] Response data:', error.response?.data);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch states',
      message: error.message,
      details: error.response?.data
    });
  }
});

// GET /api/states/:entity_id - Obtener estado específico
app.get('/api/states/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;
    const response = await haCoreClient.get(`/states/${entityId}`);
    res.json(response.data);
  } catch (error) {
    console.error(`[Error] Getting state for ${req.params.entityId}:`, error.message);
    if (error.response?.status === 404) {
      res.status(404).json({ error: 'Entity not found' });
    } else {
      res.status(500).json({
        error: 'Failed to fetch entity state',
        message: error.message
      });
    }
  }
});

// GET /api/config/area_registry - Obtener áreas
// NOTA: Este endpoint puede devolver lista vacía si no hay áreas configuradas
app.get('/api/config/area_registry', async (req, res) => {
  try {
    console.log('[API] Fetching area registry from Home Assistant...');
    const response = await haCoreClient.get('/config/area_registry/list');
    const areas = response.data || [];
    console.log(`[API] Successfully fetched ${areas.length} areas`);
    res.json(areas);
  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    console.error('[Error] Getting areas:', status, error.message);
    console.error('[Error] Response data:', data);
    // Si el endpoint no existe o HA responde 404, devolver lista vacía para no romper el frontend
    if (status === 404) {
      console.log('[API] Area registry endpoint not found, returning empty array');
      return res.json([]);
    }
    res.status(status).json({
      error: 'Failed to fetch areas',
      message: error.message,
      details: data
    });
  }
});

// GET /api/config/entity_registry - Obtener registro de entidades
// NOTA: Este endpoint puede devolver lista vacía si no hay entidades registradas
app.get('/api/config/entity_registry', async (req, res) => {
  try {
    console.log('[API] Fetching entity registry from Home Assistant...');
    const response = await haCoreClient.get('/config/entity_registry/list');
    const entities = response.data || [];
    console.log(`[API] Successfully fetched ${entities.length} entity registry entries`);
    res.json(entities);
  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    console.error('[Error] Getting entity registry:', status, error.message);
    console.error('[Error] Response data:', data);
    if (status === 404) {
      console.log('[API] Entity registry endpoint not found, returning empty array');
      return res.json([]);
    }
    res.status(status).json({
      error: 'Failed to fetch entity registry',
      message: error.message,
      details: data
    });
  }
});

// GET /api/config/filter - Get dashboard filter configuration
app.get('/api/config/filter', async (req, res) => {
  try {
    const configPath = '/config/nexdom_dashboard/dashboard_filter.yaml';
    console.log(`[API] Loading filter config from ${configPath}...`);

    // Check if file exists
    if (!fs.existsSync(configPath)) {
      console.log('[API] Filter config not found, returning default config');
      return res.json({
        allowed_domains: ['light', 'switch', 'lock', 'cover', 'climate', 'camera', 'media_player', 'fan'],
        hide_patterns: ['*_battery', '*_signal_strength', '*_linkquality', 'update.*'],
        filter_options: {
          show_main_entities_only: true,
          require_area: false,
          hide_disabled: true,
          hide_hidden: true,
          hide_unavailable: true,
        }
      });
    }

    // Read and parse YAML
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents);

    console.log('[API] Filter config loaded successfully');
    res.json(config);
  } catch (error) {
    console.error('[Error] Loading filter config:', error.message);
    res.status(500).json({
      error: 'Failed to load filter configuration',
      message: error.message
    });
  }
});

// POST /api/services/:domain/:service - Llamar servicio
app.post('/api/services/:domain/:service', async (req, res) => {
  try {
    const { domain, service } = req.params;
    const serviceData = req.body;

    const response = await haCoreClient.post(`/services/${domain}/${service}`, serviceData);
    res.json(response.data);
  } catch (error) {
    console.error(`[Error] Calling service ${req.params.domain}.${req.params.service}:`, error.message);

    if (error.response?.status === 400) {
      res.status(400).json({
        error: 'Invalid service call',
        message: error.message
      });
    } else if (error.response?.status === 422) {
      res.status(422).json({
        error: 'Service call failed',
        message: error.message
      });
    } else {
      res.status(500).json({
        error: 'Failed to call service',
        message: error.message
      });
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    supervisor_url: SUPERVISOR_URL,
    has_hassio_token: !!HASSIO_TOKEN,
    backend_port: BACKEND_PORT,
    frontend_port: FRONTEND_PORT
  });
});

// Configuración de WebSocket Proxy
const wss = new WebSocketServer({ noServer: true });
const clientConnections = new Map(); // Track client connections
// CRITICAL FIX: Map backend IDs to client IDs to avoid id_reuse and collisions
// Map<backendMsgId, { clientId, clientMsgId }>
const messageMap = new Map();
let globalMessageId = 1;

// Manejar upgrade de conexión HTTP a WebSocket
server.on('upgrade', (req, socket, head) => {
  console.log('[WS] Upgrade request received for:', req.url);
  if (req.url === '/ws' || req.url.startsWith('/ws')) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    console.log('[WS] Invalid WebSocket URL, destroying socket');
    socket.destroy();
  }
});

let supervisorWs = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
let reconnectTimer = null;

// Handle WebSocket connections from frontend clients
wss.on('connection', (clientWs, req) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  clientConnections.set(clientId, clientWs);
  console.log(`[WS] New client connected: ${clientId} (Total clients: ${clientConnections.size})`);

  // Conectar al supervisor si no está conectado
  if (!supervisorWs || supervisorWs.readyState !== 1) {
    console.log('[WS] Connecting to supervisor WebSocket...');
    connectToSupervisorWebSocket();
  } else {
    // Si ya está conectado, enviar auth_ok al cliente
    console.log('[WS] Supervisor already connected, notifying client');
    clientWs.send(JSON.stringify({ type: 'auth_ok' }));
  }

  // Manejar mensajes del cliente
  clientWs.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('[WS] Client message:', data.type, data.id ? `(id: ${data.id})` : '');

      if (supervisorWs && supervisorWs.readyState === 1) {
        // ID Translation Logic
        if (data.id) {
          const backendId = globalMessageId++;
          messageMap.set(backendId, {
            clientId: clientId,
            clientMsgId: data.id
          });

          // Replace ID with backend ID
          const proxyData = { ...data, id: backendId };
          console.log(`[WS] Proxying message client_id=${data.id} -> backend_id=${backendId}`);
          supervisorWs.send(JSON.stringify(proxyData));
        } else {
          // Messages without ID (e.g. auth, though auth is handled separately usually)
          supervisorWs.send(JSON.stringify(data));
        }
      } else {
        console.log('[WS] Supervisor not connected, sending error to client');
        clientWs.send(JSON.stringify({
          type: 'result',
          id: data.id,
          success: false,
          error: { message: 'Supervisor WebSocket not connected' }
        }));
      }
    } catch (error) {
      console.error('[WS] Error processing client message:', error.message);
      try {
        clientWs.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      } catch (sendError) {
        console.error('[WS] Error sending error message to client:', sendError.message);
      }
    }
  });

  // Manejar desconexión del cliente
  clientWs.on('close', () => {
    clientConnections.delete(clientId);
    console.log(`[WS] Client disconnected: ${clientId} (Remaining clients: ${clientConnections.size})`);

    // Cleanup pending requests from this client
    for (const [backendId, info] of messageMap.entries()) {
      if (info.clientId === clientId) {
        messageMap.delete(backendId);
      }
    }

    // Si no quedan clientes, desconectar del supervisor
    if (clientConnections.size === 0 && supervisorWs) {
      console.log('[WS] No clients remaining, closing supervisor connection');
      supervisorWs.close();
      supervisorWs = null;
      messageMap.clear();
      globalMessageId = 1;
    }
  });

  // Manejar errores del cliente
  clientWs.on('error', (error) => {
    console.error(`[WS] Client error (${clientId}):`, error.message);
  });
});

// Conectar al WebSocket del supervisor
function connectToSupervisorWebSocket() {
  // Clear any existing reconnect timer
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const wsUrl = SUPERVISOR_URL.replace('http', 'ws') + '/core/websocket';
  console.log('[WS] Connecting to supervisor at:', wsUrl);

  try {
    supervisorWs = new (require('ws'))(wsUrl);
  } catch (error) {
    console.error('[WS] Error creating WebSocket connection:', error.message);
    scheduleReconnect();
    return;
  }

  supervisorWs.on('open', () => {
    console.log('[WS] Connected to supervisor WebSocket');
    reconnectAttempts = 0;
    // La autenticación se enviará cuando recibamos 'auth_required'
  });

  supervisorWs.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const logType = data.type === 'event' ? 'event' : data.type;
      console.log(`[WS] Supervisor message: ${logType}`, data.id ? `(id: ${data.id})` : '');

      // Responder autenticación si es requerida
      if (data.type === 'auth_required') {
        console.log('[WS] Auth required, sending token...');
        supervisorWs.send(JSON.stringify({
          type: 'auth',
          access_token: HASSIO_TOKEN
        }));
      }

      // Cuando auth es exitoso, notificar a todos los clientes
      else if (data.type === 'auth_ok') {
        console.log('[WS] Auth successful, notifying all clients');
        broadcastToClients(message);
      } else if (data.type === 'auth_invalid') {
        console.error('[WS] Auth failed!');
        broadcastToClients(message);
      } else if (data.type === 'result') {
        // CRITICAL FIX: Translate ID back to client ID
        const backendId = data.id;
        const requestInfo = messageMap.get(backendId);

        if (requestInfo) {
          const { clientId, clientMsgId } = requestInfo;
          const clientWs = clientConnections.get(clientId);

          if (clientWs && clientWs.readyState === 1) {
            // Replace ID with original client ID
            const clientData = { ...data, id: clientMsgId };
            // console.log(`[WS] Forwarding result backend_id=${backendId} -> client_id=${clientMsgId} to ${clientId}`);
            clientWs.send(JSON.stringify(clientData));

            // Cleanup
            messageMap.delete(backendId);
          } else {
            console.log(`[WS] Client ${clientId} not found or disconnected for result (id: ${backendId})`);
            messageMap.delete(backendId);
          }
        } else {
          // Si no encontramos el ID, podría ser un mensaje viejo o broadcast
          // console.log(`[WS] No mapping found for result (id: ${backendId}), ignoring`);
        }
      } else {
        // Eventos y otros mensajes: broadcast a todos
        // Los eventos no tienen ID de request, así que se pasan tal cual
        broadcastToClients(message);
      }
    } catch (error) {
      console.error('[WS] Error processing supervisor message:', error.message);
    }
  });

  supervisorWs.on('close', (code, reason) => {
    console.log(`[WS] Supervisor disconnected: code=${code} reason=${reason || 'none'}`);
    supervisorWs = null;

    // Intentar reconectar si hay clientes conectados
    if (clientConnections.size > 0) {
      scheduleReconnect();
    }
  });

  supervisorWs.on('error', (error) => {
    console.error('[WS] Supervisor connection error:', error.message);
    // El evento 'close' se disparará después del error
  });
}

// Broadcast message to all connected clients
function broadcastToClients(message) {
  // CRITICAL FIX: Convert Buffer to string FIRST
  // Node.js WebSocket sends Buffer objects, but browser clients need strings
  let messageStr;
  if (typeof message === 'string') {
    messageStr = message;
  } else if (Buffer.isBuffer(message)) {
    messageStr = message.toString();
  } else {
    messageStr = JSON.stringify(message);
  }

  let successCount = 0;
  let failCount = 0;

  // Parse to get message type for logging
  let messageType = 'unknown';
  try {
    const parsed = JSON.parse(messageStr);
    messageType = parsed.type || 'unknown';
  } catch (e) {
    // ignore
  }

  console.log(`[WS] Broadcasting ${messageType} to ${clientConnections.size} clients`);

  clientConnections.forEach((clientWs, clientId) => {
    try {
      if (clientWs.readyState === 1) { // OPEN
        clientWs.send(messageStr);
        successCount++;
        // console.log(`[WS]   -> Sent to ${clientId}`);
      } else {
        failCount++;
        console.log(`[WS]   -> Client ${clientId} not ready (state: ${clientWs.readyState})`);
      }
    } catch (error) {
      console.error(`[WS] Error sending to client ${clientId}:`, error.message);
      failCount++;
    }
  });

  console.log(`[WS] Broadcast complete: ${successCount} success, ${failCount} failed`);
}

// Schedule reconnect with exponential backoff
function scheduleReconnect() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('[WS] Max reconnect attempts reached, giving up');
    // Notify clients
    broadcastToClients(JSON.stringify({
      type: 'auth_invalid',
      message: 'Connection to Home Assistant failed after multiple attempts'
    }));
    return;
  }

  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
  console.log(`[WS] Scheduling reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`);

  reconnectTimer = setTimeout(() => {
    connectToSupervisorWebSocket();
  }, delay);
}

// Manejar cierre del servidor
process.on('SIGTERM', () => {
  console.log('[Server] Received SIGTERM, shutting down gracefully');
  if (supervisorWs) {
    supervisorWs.close();
  }
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] Received SIGINT, shutting down gracefully');
  if (supervisorWs) {
    supervisorWs.close();
  }
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

// Iniciar servidor
server.listen(BACKEND_PORT, () => {
  console.log(`[Server] Backend proxy listening on port ${BACKEND_PORT}`);
  console.log(`[Server] Supervisor URL: ${SUPERVISOR_URL}`);
  console.log(`[Server] WebSocket proxy: ws://localhost:${BACKEND_PORT}/ws`);
});
