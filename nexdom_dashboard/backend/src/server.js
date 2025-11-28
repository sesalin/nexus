const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { WebSocketServer } = require('ws');
const axios = require('axios');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Configuración
const SUPERVISOR_URL = process.env.SUPERVISOR_URL || 'http://supervisor';
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const BACKEND_PORT = process.env.BACKEND_PORT || 3000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 8123;

if (!SUPERVISOR_TOKEN) {
  console.error('[Error] SUPERVISOR_TOKEN is required but not provided');
  process.exit(1);
}

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

// Configurar axios para Home Assistant
const haClient = axios.create({
  baseURL: `${SUPERVISOR_URL}/core/api`,
  timeout: 10000,
  headers: {
    'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Endpoints REST Proxy

// GET /api/states - Obtener todos los estados
app.get('/api/states', async (req, res) => {
  try {
    const response = await haClient.get('/states');
    res.json(response.data);
  } catch (error) {
    console.error('[Error] Getting states:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch states',
      message: error.message 
    });
  }
});

// GET /api/states/:entity_id - Obtener estado específico
app.get('/api/states/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;
    const response = await haClient.get(`/states/${entityId}`);
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
app.get('/api/config/area_registry', async (req, res) => {
  try {
    const response = await haClient.get('/config/area_registry');
    res.json(response.data);
  } catch (error) {
    console.error('[Error] Getting areas:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch areas',
      message: error.message 
    });
  }
});

// GET /config/entity_registry - Obtener registro de entidades
app.get('/config/entity_registry', async (req, res) => {
  try {
    const response = await haClient.get('/config/entity_registry');
    res.json(response.data);
  } catch (error) {
    console.error('[Error] Getting entity registry:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch entity registry',
      message: error.message 
    });
  }
});

// POST /api/services/:domain/:service - Llamar servicio
app.post('/api/services/:domain/:service', async (req, res) => {
  try {
    const { domain, service } = req.params;
    const serviceData = req.body;
    
    const response = await haClient.post(`/services/${domain}/${service}`, serviceData);
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
    has_supervisor_token: !!SUPERVISOR_TOKEN
  });
});

// Configuración de WebSocket Proxy
const wss = new WebSocketServer({ noServer: true });

// Manejar upgrade de conexión HTTP a WebSocket
server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      handleWebSocketConnection(ws);
    });
  } else {
    socket.destroy();
  }
});

let supervisorWs = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// Manejar conexión WebSocket con Home Assistant
function handleWebSocketConnection(clientWs) {
  console.log('[WS] New client connected');
  
  // Conectar al supervisor WebSocket
  connectToSupervisorWebSocket(clientWs);
  
  // Manejar mensajes del cliente
  clientWs.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('[WS] Client message:', data.type);
      
      if (supervisorWs && supervisorWs.readyState === 1) {
        // Reenviar mensaje al supervisor
        supervisorWs.send(JSON.stringify(data));
      } else {
        console.log('[WS] Supervisor not connected, queuing message');
        clientWs.send(JSON.stringify({
          type: 'result',
          id: data.id,
          success: false,
          error: 'Supervisor WebSocket not connected'
        }));
      }
    } catch (error) {
      console.error('[WS] Error processing client message:', error.message);
      clientWs.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  // Manejar desconexión del cliente
  clientWs.on('close', () => {
    console.log('[WS] Client disconnected');
  });
  
  // Manejar errores del cliente
  clientWs.on('error', (error) => {
    console.error('[WS] Client error:', error.message);
  });
}

// Conectar al WebSocket del supervisor
function connectToSupervisorWebSocket(clientWs) {
  const wsUrl = SUPERVISOR_URL.replace('http', 'ws') + '/core/websocket';
  
  supervisorWs = new (require('ws'))(wsUrl);
  
  supervisorWs.on('open', () => {
    console.log('[WS] Connected to supervisor');
    reconnectAttempts = 0;
    // Autenticación inmediata con el token del supervisor
    supervisorWs.send(JSON.stringify({
      type: 'auth',
      access_token: SUPERVISOR_TOKEN
    }));
  });
  
  supervisorWs.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('[WS] Supervisor message:', data.type);
      
      // Responder autenticación si es requerida
      if (data.type === 'auth_required') {
        supervisorWs.send(JSON.stringify({
          type: 'auth',
          access_token: SUPERVISOR_TOKEN
        }));
      }
      
      // Reenviar mensaje al cliente
      if (clientWs && clientWs.readyState === 1) {
        clientWs.send(message);
      }
    } catch (error) {
      console.error('[WS] Error processing supervisor message:', error.message);
    }
  });
  
  supervisorWs.on('close', (code, reason) => {
    console.log(`[WS] Supervisor disconnected: ${code} ${reason}`);
    supervisorWs = null;
    
    // Intentar reconectar
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`[WS] Reconnecting to supervisor (attempt ${reconnectAttempts})`);
      setTimeout(() => {
        connectToSupervisorWebSocket(clientWs);
      }, 5000);
    } else {
      console.log('[WS] Max reconnect attempts reached');
      clientWs.send(JSON.stringify({
        type: 'auth_invalid',
        message: 'Connection to supervisor failed'
      }));
    }
  });
  
  supervisorWs.on('error', (error) => {
    console.error('[WS] Supervisor connection error:', error.message);
    
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      setTimeout(() => {
        connectToSupervisorWebSocket(clientWs);
      }, 5000);
    }
  });
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
