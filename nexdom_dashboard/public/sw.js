/* Service Worker para Nexdom OS */
const CACHE_NAME = 'nexdom-os-v1.0.0';
const OFFLINE_CACHE_NAME = 'nexdom-offline-v1.0.0';

// Archivos a cachear para funcionamiento offline
const CACHE_FILES = [
  '/',
  '/zones',
  '/gadgets',
  '/energy',
  '/security',
  '/scenes',
  '/routines',
  '/voice',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/assets/logo-white.svg',
  '/assets/images/kitchen.jpg',
  '/assets/images/living.jpg',
  '/assets/images/bedroom.jpg',
  '/assets/images/office.jpg'
];

// URLs de APIs críticas que necesitan cache especial
const API_CACHE_PATTERNS = [
  /\/api\/states/,
  /\/api\/config\/area_registry/
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cachear archivos estáticos
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(CACHE_FILES);
      }),
      // Configurar cache de APIs
      caches.open(OFFLINE_CACHE_NAME)
    ]).then(() => {
      console.log('[SW] Archivos cacheados para funcionamiento offline');
      return self.skipWaiting();
    })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches obsoletos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE_NAME) {
              console.log('[SW] Eliminando cache obsoleto:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Tomar control inmediatamente
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service Worker activado');
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests HTTPS o del mismo origen
  if (request.url.startsWith('https://') || request.url.startsWith(self.location.origin)) {
    // Estrategias diferentes según el tipo de request
    if (isApiRequest(request)) {
      event.respondWith(handleApiRequest(request));
    } else if (isStaticAsset(request)) {
      event.respondWith(handleStaticAsset(request));
    } else {
      event.respondWith(handlePageRequest(request));
    }
  }
});

// Funciones auxiliares para identificar tipos de requests
function isApiRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isStaticAsset(request) {
  return request.url.includes('/assets/') || 
         request.url.includes('.js') || 
         request.url.includes('.css') ||
         request.url.includes('.svg') ||
         request.url.includes('.png') ||
         request.url.includes('.jpg');
}

// Estrategias de cache

// Para requests de API (Network First con fallback)
async function handleApiRequest(request) {
  const cache = await caches.open(OFFLINE_CACHE_NAME);
  
  try {
    // Intentar network primero
    const response = await fetch(request);
    
    if (response.ok) {
      // Cachear respuesta exitosa
      cache.put(request, response.clone());
      return response;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Error de red para API, intentando cache...');
    
    // Fallback a cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no hay cache, devolver respuesta offline genérica
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'Sin conexión. Los datos no están disponibles.'
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Para assets estáticos (Cache First)
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Buscar en cache primero
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Si no está en cache, intentar network
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Error cargando asset estático:', request.url);
    throw error;
  }
}

// Para páginas (Network First con fallback)
async function handlePageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Intentar network primero
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Error de red para página, intentando cache...');
    
    // Fallback a cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback final a la página principal
    const indexResponse = await cache.match('/');
    if (indexResponse) {
      return indexResponse;
    }
    
    // Respuesta de emergencia
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nexdom OS - Sin Conexión</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background: #0a0a0a; 
              color: white; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              text-align: center;
            }
            .offline-container {
              max-width: 400px;
              padding: 2rem;
            }
            .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1>Nexdom OS</h1>
            <p>Sin conexión a Internet</p>
            <p>Algunas funcionalidades no estarán disponibles hasta que se restablezca la conexión.</p>
            <button onclick="window.location.reload()">Reintentar</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Manejo de mensajes desde el cliente
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

// Función para limpiar caches
async function clearCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map(name => caches.delete(name)));
}

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Intentar sincronizar datos pendientes
    console.log('[SW] Ejecutando sincronización en segundo plano...');
    
    // Aquí iría la lógica para sincronizar datos pendientes
    // Por ejemplo: comandos que no se pudieron ejecutar offline
    
  } catch (error) {
    console.error('[SW] Error en sincronización:', error);
  }
}

// Notificaciones Push
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification recibida');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click en notificación:', event.notification.tag);
  
  event.notification.close();
  
  const data = event.notification.data;
  let urlToOpen = '/';
  
  if (data && data.url) {
    urlToOpen = data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocar esa
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({ 
              type: 'NOTIFICATION_CLICK', 
              data: event.notification.data 
            });
            return;
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Manejo de instalación del PWA
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('[SW] Prompt de instalación disponible');
  
  event.preventDefault();
  
  // Guardar el evento para usarlo más tarde
  self.deferredPrompt = event;
  
  // Notificar a la app principal que el prompt está disponible
  self.clients.matchAll().then((clients) => {
    clients.forEach(client => {
      client.postMessage({ type: 'PWA_INSTALL_PROMPT' });
    });
  });
});

// Notificar cuando la app se instala
self.addEventListener('appinstalled', (event) => {
  console.log('[SW] PWA instalada correctamente');
  
  self.deferredPrompt = null;
  
  self.clients.matchAll().then((clients) => {
    clients.forEach(client => {
      client.postMessage({ type: 'PWA_INSTALLED' });
    });
  });
});
