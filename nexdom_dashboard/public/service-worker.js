/* 
 * Nexdom OS - Service Worker
 * Production-ready PWA service worker with push notification support
 * Version: 1.0.0
 */

const CACHE_VERSION = 'nexdom-os-v0.0.130';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_API = `${CACHE_VERSION}-api`;

// VAPID Public Key - Replace with your actual VAPID public key
const VAPID_PUBLIC_KEY = 'BD2GM11cRtxX9R1efFvu8m-H2SrcUmrqQcT5oDdBAM9a9k8AhkzF38cSbfWNtmadQ_n4SfpVwLm_OAeBMwLWnGM';

// Critical files to cache on install
const STATIC_CACHE_URLS = [
    './',
    './index.html',
    './nexdom.webmanifest'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /\/api\/states/,
    /\/api\/config/,
    /\/api\/services/
];

// Assets to cache dynamically
const DYNAMIC_CACHE_PATTERNS = [
    /\/assets\//,
    /\.js$/,
    /\.css$/,
    /\.woff2$/,
    /\.woff$/,
    /\.ttf$/
];

// Maximum cache size limits
const MAX_CACHE_SIZE = {
    static: 50,
    dynamic: 100,
    api: 50
};

/* ==================== INSTALLATION ==================== */

self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v' + CACHE_VERSION);

    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('[SW] Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Installation failed:', error);
            })
    );
});

/* ==================== ACTIVATION ==================== */

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker v' + CACHE_VERSION);

    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName.startsWith('nexdom-os-') &&
                                cacheName !== CACHE_STATIC &&
                                cacheName !== CACHE_DYNAMIC &&
                                cacheName !== CACHE_API;
                        })
                        .map((cacheName) => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            }),
            // Take control of all clients immediately
            self.clients.claim()
        ])
            .then(() => {
                console.log('[SW] Activation complete - now controlling all pages');
            })
    );
});

/* ==================== FETCH HANDLING ==================== */

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-http(s) requests
    if (!request.url.startsWith('http')) {
        return;
    }

    // Skip chrome-extension and other special schemes
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return;
    }

    // Route to appropriate handler
    if (request.url.includes('manifest.json') || request.url.includes('nexdom.webmanifest')) {
        event.respondWith(handleManifestRequest(request));
    } else if (isApiRequest(request)) {
        event.respondWith(handleApiRequest(request));
    } else if (isDynamicAsset(request)) {
        event.respondWith(handleDynamicAsset(request));
    } else {
        event.respondWith(handleNavigationRequest(request));
    }
});

// Handle manifest requests specifically to bypass HA proxy issues
async function handleManifestRequest(request) {
    // Try to fetch the manifest relative to the SW scope first
    try {
        const response = await fetch('./manifest.json');
        if (response.ok) return response;
    } catch (e) {
        console.log('[SW] Failed to fetch local manifest, trying request url');
    }

    // Fallback to network
    return fetch(request);
}

/* ==================== REQUEST CLASSIFICATION ==================== */

function isApiRequest(request) {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isDynamicAsset(request) {
    return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

/* ==================== CACHING STRATEGIES ==================== */

// Network First (for API requests)
async function handleApiRequest(request) {
    const cache = await caches.open(CACHE_API);

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok && request.method === 'GET') {
            // Clone and cache the response
            cache.put(request, networkResponse.clone());
            await trimCache(CACHE_API, MAX_CACHE_SIZE.api);
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed for API, trying cache:', request.url);

        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline response
        return new Response(
            JSON.stringify({
                error: 'offline',
                message: 'No connection available and no cached data'
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Cache First (for dynamic assets)
async function handleDynamicAsset(request) {
    const cache = await caches.open(CACHE_DYNAMIC);

    // Check cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    // Fetch from network
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok && request.method === 'GET') {
            cache.put(request, networkResponse.clone());
            await trimCache(CACHE_DYNAMIC, MAX_CACHE_SIZE.dynamic);
        }

        return networkResponse;
    } catch (error) {
        console.error('[SW] Failed to fetch asset:', request.url);
        throw error;
    }
}

// Network First with fallback (for navigation)
async function handleNavigationRequest(request) {
    const cache = await caches.open(CACHE_STATIC);

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok && request.method === 'GET') {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed for navigation, trying cache');

        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Try to return the main app shell
        const appShell = await cache.match('/');
        if (appShell) {
            return appShell;
        }

        // Last resort: offline page
        return new Response(getOfflineHTML(), {
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

/* ==================== CACHE MANAGEMENT ==================== */

async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
        console.log(`[SW] Trimming ${cacheName}: ${keys.length} -> ${maxItems}`);
        // Remove oldest items
        const itemsToDelete = keys.slice(0, keys.length - maxItems);
        await Promise.all(itemsToDelete.map(key => cache.delete(key)));
    }
}

/* ==================== PUSH NOTIFICATIONS ==================== */

self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    let notificationData = {
        title: 'Nexdom OS',
        body: 'Nueva notificación',
        icon: './pwa/favicon-192x192.png',
        badge: './pwa/maskable_icon-96x96.png'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                title: data.title || notificationData.title,
                body: data.body || data.message || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                tag: data.tag || 'nexdom-notification',
                data: data.data || {},
                actions: data.actions || [],
                requireInteraction: data.requireInteraction || false,
                vibrate: data.vibrate || [200, 100, 200],
                silent: data.silent || false
            };
        } catch (error) {
            console.error('[SW] Error parsing push data:', error);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            data: notificationData.data,
            actions: notificationData.actions,
            requireInteraction: notificationData.requireInteraction,
            vibrate: notificationData.vibrate,
            silent: notificationData.silent
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.notification.tag);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if a window is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus().then(() => {
                            // Send message to the client
                            client.postMessage({
                                type: 'NOTIFICATION_CLICKED',
                                data: event.notification.data
                            });
                        });
                    }
                }

                // No window found, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

/* ==================== BACKGROUND SYNC ==================== */

self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    console.log('[SW] Syncing data...');

    try {
        // Implement your sync logic here
        // For example: send queued commands, sync state, etc.

        // Notify clients of successful sync
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ type: 'SYNC_COMPLETE' });
        });
    } catch (error) {
        console.error('[SW] Sync failed:', error);
        throw error; // Re-throw to retry later
    }
}

/* ==================== MESSAGE HANDLING ==================== */

self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    console.log('[SW] Message received:', type);

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'GET_VERSION':
            event.ports[0]?.postMessage({ version: CACHE_VERSION });
            break;

        case 'CLEAR_CACHE':
            clearAllCaches()
                .then(() => event.ports[0]?.postMessage({ success: true }))
                .catch((error) => event.ports[0]?.postMessage({ success: false, error: error.message }));
            break;

        case 'CACHE_URLS':
            if (data?.urls && Array.isArray(data.urls)) {
                cacheUrls(data.urls)
                    .then(() => event.ports[0]?.postMessage({ success: true }))
                    .catch((error) => event.ports[0]?.postMessage({ success: false, error: error.message }));
            }
            break;
    }
});

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames
            .filter(name => name.startsWith('nexdom-os-'))
            .map(name => caches.delete(name))
    );
}

async function cacheUrls(urls) {
    const cache = await caches.open(CACHE_DYNAMIC);
    return cache.addAll(urls);
}

/* ==================== UTILITY FUNCTIONS ==================== */

function getOfflineHTML() {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nexdom OS - Sin Conexión</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          text-align: center;
          max-width: 500px;
        }
        .icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        h1 {
          font-size: 32px;
          margin-bottom: 10px;
          color: #1FC70E;
        }
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #999;
          margin-bottom: 30px;
        }
        button {
          background: #1FC70E;
          color: white;
          border: none;
          padding: 12px 30px;
          font-size: 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        button:hover {
          background: #17a00c;
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(31, 199, 14, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>Sin Conexión</h1>
        <p>No se puede conectar a Nexdom OS. Verifica tu conexión a internet e intenta nuevamente.</p>
        <button onclick="window.location.reload()">Reintentar</button>
      </div>
    </body>
    </html>
  `;
}

/* ==================== EXPORTED FUNCTIONS ==================== */

// These functions can be called from the main application via postMessage

/**
 * Request notification permission from the user
 * Called from sw-registration.js
 */
async function requestNotificationPermission() {
    if (!('Notification' in self)) {
        throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

/**
 * Subscribe user to push notifications
 * Called from sw-registration.js
 */
async function subscribeUserToPush() {
    if (!('PushManager' in self)) {
        throw new Error('Push notifications not supported');
    }

    const registration = await self.registration;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        // Subscribe to push
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
    }

    return subscription;
}

/**
 * Send a test notification
 * For development/testing purposes
 */
async function sendTestNotification() {
    const registration = await self.registration;

    return registration.showNotification('Nexdom OS - Prueba', {
        body: 'Las notificaciones están funcionando correctamente ✓',
        icon: './pwa/favicon-192x192.png',
        badge: './pwa/maskable_icon-96x96.png',
        tag: 'test-notification',
        vibrate: [200, 100, 200],
        data: {
            url: '/',
            timestamp: Date.now()
        }
    });
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

console.log('[SW] Service Worker loaded - Nexdom OS v' + CACHE_VERSION);
