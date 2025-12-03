/**
 * Service Worker Registration for Nexdom OS
 * Handles SW lifecycle, push notifications, and PWA updates
 */

// Configuration
const SW_PATH = '/service-worker.js';
let swRegistration = null;

/**
 * Register the service worker
 */
export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('[PWA] Service Workers are not supported in this browser');
        return null;
    }

    try {
        // Wait for page load
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Register the service worker
        swRegistration = await navigator.serviceWorker.register(SW_PATH, {
            scope: '/'
        });

        console.log('[PWA] Service Worker registered:', swRegistration.scope);

        // Handle updates
        swRegistration.addEventListener('updatefound', () => {
            const newWorker = swRegistration.installing;

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New Service Worker available');

                    // Dispatch custom event for the app to handle
                    window.dispatchEvent(new CustomEvent('sw-update-available', {
                        detail: { registration: swRegistration }
                    }));
                }
            });
        });

        // Check for updates periodically (every hour)
        setInterval(() => {
            swRegistration.update();
        }, 60 * 60 * 1000);

        return swRegistration;
    } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
        return null;
    }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker() {
    if (!swRegistration) {
        return false;
    }

    try {
        const success = await swRegistration.unregister();
        console.log('[PWA] Service Worker unregistered:', success);
        swRegistration = null;
        return success;
    } catch (error) {
        console.error('[PWA] Service Worker unregister failed:', error);
        return false;
    }
}

/**
 * Skip waiting and activate new service worker immediately
 */
export function skipWaiting() {
    if (swRegistration && swRegistration.waiting) {
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
}

/**
 * Get current service worker version
 */
export async function getServiceWorkerVersion() {
    if (!navigator.serviceWorker.controller) {
        return null;
    }

    return new Promise((resolve) => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
            resolve(event.data.version);
        };

        navigator.serviceWorker.controller.postMessage(
            { type: 'GET_VERSION' },
            [messageChannel.port2]
        );
    });
}

/**
 * Clear all caches
 */
export async function clearCache() {
    if (!navigator.serviceWorker.controller) {
        return false;
    }

    return new Promise((resolve) => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
            resolve(event.data.success);
        };

        navigator.serviceWorker.controller.postMessage(
            { type: 'CLEAR_CACHE' },
            [messageChannel.port2]
        );
    });
}

/* ==================== PUSH NOTIFICATIONS ==================== */

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported() {
    return 'Notification' in window &&
        'PushManager' in window &&
        'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission() {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        throw new Error('Notifications are not supported in this browser');
    }

    if (Notification.permission === 'granted') {
        console.log('[PWA] Notification permission already granted');
        return true;
    }

    if (Notification.permission === 'denied') {
        console.warn('[PWA] Notification permission denied');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';

        console.log('[PWA] Notification permission:', permission);

        if (granted) {
            window.dispatchEvent(new CustomEvent('notification-permission-granted'));
        }

        return granted;
    } catch (error) {
        console.error('[PWA] Error requesting notification permission:', error);
        return false;
    }
}

/**
 * Subscribe user to push notifications
 * @param {string} vapidPublicKey - Your VAPID public key
 * @returns {Promise<PushSubscription>}
 */
export async function subscribeUserToPush(vapidPublicKey) {
    if (!isPushNotificationSupported()) {
        throw new Error('Push notifications are not supported');
    }

    // Ensure we have a service worker registration
    if (!swRegistration) {
        swRegistration = await navigator.serviceWorker.ready;
    }

    try {
        // Check if already subscribed
        let subscription = await swRegistration.pushManager.getSubscription();

        if (subscription) {
            console.log('[PWA] Already subscribed to push notifications');
            return subscription;
        }

        // Request permission first
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
            throw new Error('Notification permission denied');
        }

        // Subscribe to push
        subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        console.log('[PWA] Subscribed to push notifications');

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('push-subscription-created', {
            detail: { subscription }
        }));

        return subscription;
    } catch (error) {
        console.error('[PWA] Failed to subscribe to push:', error);
        throw error;
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
    if (!swRegistration) {
        return false;
    }

    try {
        const subscription = await swRegistration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            console.log('[PWA] Unsubscribed from push notifications');

            window.dispatchEvent(new CustomEvent('push-subscription-removed'));
            return true;
        }

        return false;
    } catch (error) {
        console.error('[PWA] Failed to unsubscribe from push:', error);
        return false;
    }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription() {
    if (!swRegistration) {
        swRegistration = await navigator.serviceWorker.ready;
    }

    return swRegistration.pushManager.getSubscription();
}

/**
 * Send a test notification (for development)
 */
export async function sendTestNotification() {
    if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
    }

    if (Notification.permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
            throw new Error('Notification permission not granted');
        }
    }

    // Create a test notification
    const notification = new Notification('Nexdom OS - Prueba', {
        body: 'Las notificaciones están funcionando correctamente ✓',
        icon: '/pwa/favicon-192x192.png',
        badge: '/pwa/maskable_icon-96x96.png',
        tag: 'test-notification',
        vibrate: [200, 100, 200],
        data: {
            url: '/',
            timestamp: Date.now()
        }
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
    };

    return notification;
}

/* ==================== UTILITY FUNCTIONS ==================== */

/**
 * Convert VAPID key from base64 to Uint8Array
 */
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

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
}

/**
 * Check if app is installable
 */
export function isInstallable() {
    return 'beforeinstallprompt' in window;
}

/* ==================== AUTO-INITIALIZATION ==================== */

// Auto-register service worker when module is imported
if (typeof window !== 'undefined') {
    // Register on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            registerServiceWorker();
        });
    } else {
        registerServiceWorker();
    }

    // Listen for SW messages
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data;

            console.log('[PWA] Message from SW:', type);

            switch (type) {
                case 'NOTIFICATION_CLICKED':
                    window.dispatchEvent(new CustomEvent('notification-clicked', {
                        detail: data
                    }));
                    break;

                case 'SYNC_COMPLETE':
                    window.dispatchEvent(new CustomEvent('sync-complete'));
                    break;

                case 'PWA_INSTALL_PROMPT':
                    window.dispatchEvent(new CustomEvent('pwa-install-prompt'));
                    break;

                case 'PWA_INSTALLED':
                    window.dispatchEvent(new CustomEvent('pwa-installed'));
                    break;
            }
        });
    }

    // Log PWA status
    console.log('[PWA] Status:', {
        serviceWorkerSupported: 'serviceWorker' in navigator,
        pushSupported: isPushNotificationSupported(),
        notificationPermission: getNotificationPermission(),
        isStandalone: isStandalone(),
        isInstallable: isInstallable()
    });
}

export default {
    registerServiceWorker,
    unregisterServiceWorker,
    skipWaiting,
    getServiceWorkerVersion,
    clearCache,
    isPushNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    subscribeUserToPush,
    unsubscribeFromPush,
    getPushSubscription,
    sendTestNotification,
    isStandalone,
    isInstallable
};
