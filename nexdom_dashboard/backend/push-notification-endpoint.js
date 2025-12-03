/**
 * Nexdom OS - Push Notification Server Endpoint
 * Node.js/Express template for sending push notifications
 * 
 * DEPENDENCIES:
 * npm install express web-push body-parser cors
 * 
 * SETUP:
 * 1. Generate VAPID keys: npx web-push generate-vapid-keys
 * 2. Set environment variables or update the config below
 * 3. Replace VAPID_PUBLIC_KEY in service-worker.js with your public key
 */

const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');

// ==================== CONFIGURATION ====================

// VAPID Keys - REPLACE WITH YOUR OWN KEYS
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BD2GM11cRtxX9R1efFvu8m-H2SrcUmrqQcT5oDdBAM9a9k8AhkzF38cSbfWNtmadQ_n4SfpVwLm_OAeBMwLWnGM';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'U8erPhs0Umch9tcplH-ZggwbeBh7o1ylQX4slAKjbAE';

// Contact info (required by web-push)
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@nexdom.local';

// Configure web-push
webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

// ==================== EXPRESS APP ====================

const app = express();
const PORT = process.env.PUSH_SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory subscription storage (replace with database in production)
const subscriptions = new Map();

// ==================== ROUTES ====================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'nexdom-push-server',
        timestamp: new Date().toISOString()
    });
});

/**
 * Get VAPID public key
 * Frontend needs this to subscribe users
 */
app.get('/api/push/vapid-public-key', (req, res) => {
    res.json({
        publicKey: VAPID_PUBLIC_KEY
    });
});

/**
 * Subscribe user to push notifications
 * Body: { userId: string, subscription: PushSubscription }
 */
app.post('/api/push/subscribe', (req, res) => {
    const { userId, subscription } = req.body;

    if (!userId || !subscription) {
        return res.status(400).json({
            error: 'userId and subscription are required'
        });
    }

    // Validate subscription object
    if (!subscription.endpoint || !subscription.keys ||
        !subscription.keys.auth || !subscription.keys.p256dh) {
        return res.status(400).json({
            error: 'Invalid subscription object'
        });
    }

    // Store subscription (in production, save to database)
    subscriptions.set(userId, subscription);

    console.log(`[Push] User ${userId} subscribed to push notifications`);

    res.json({
        success: true,
        message: 'Subscription saved successfully',
        userId
    });
});

/**
 * Unsubscribe user from push notifications
 * Body: { userId: string }
 */
app.post('/api/push/unsubscribe', (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({
            error: 'userId is required'
        });
    }

    const existed = subscriptions.has(userId);
    subscriptions.delete(userId);

    console.log(`[Push] User ${userId} unsubscribed from push notifications`);

    res.json({
        success: true,
        message: existed ? 'Unsubscribed successfully' : 'Not subscribed',
        userId
    });
});

/**
 * Send push notification to specific user
 * Body: { 
 *   userId: string, 
 *   title: string, 
 *   body: string,
 *   icon?: string,
 *   data?: object,
 *   actions?: array
 * }
 */
app.post('/api/push/send', async (req, res) => {
    const { userId, title, body, icon, data, actions, requireInteraction } = req.body;

    if (!userId || !title || !body) {
        return res.status(400).json({
            error: 'userId, title, and body are required'
        });
    }

    const subscription = subscriptions.get(userId);

    if (!subscription) {
        return res.status(404).json({
            error: 'User not subscribed to push notifications',
            userId
        });
    }

    const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/pwa/favicon-192x192.png',
        badge: '/pwa/maskable_icon-96x96.png',
        tag: `nexdom-${Date.now()}`,
        data: data || {},
        actions: actions || [],
        requireInteraction: requireInteraction || false,
        vibrate: [200, 100, 200]
    });

    try {
        await webpush.sendNotification(subscription, payload);

        console.log(`[Push] Notification sent to user ${userId}: ${title}`);

        res.json({
            success: true,
            message: 'Notification sent successfully',
            userId
        });
    } catch (error) {
        console.error(`[Push] Error sending notification to ${userId}:`, error);

        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
            subscriptions.delete(userId);
            console.log(`[Push] Removed invalid subscription for user ${userId}`);
        }

        res.status(500).json({
            error: 'Failed to send notification',
            details: error.message,
            userId
        });
    }
});

/**
 * Broadcast push notification to all subscribed users
 * Body: { 
 *   title: string, 
 *   body: string,
 *   icon?: string,
 *   data?: object,
 *   actions?: array
 * }
 */
app.post('/api/push/broadcast', async (req, res) => {
    const { title, body, icon, data, actions, requireInteraction } = req.body;

    if (!title || !body) {
        return res.status(400).json({
            error: 'title and body are required'
        });
    }

    const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/pwa/favicon-192x192.png',
        badge: '/pwa/maskable_icon-96x96.png',
        tag: `nexdom-broadcast-${Date.now()}`,
        data: data || {},
        actions: actions || [],
        requireInteraction: requireInteraction || false,
        vibrate: [200, 100, 200]
    });

    const results = {
        total: subscriptions.size,
        sent: 0,
        failed: 0,
        removed: 0
    };

    const promises = [];

    for (const [userId, subscription] of subscriptions.entries()) {
        const promise = webpush.sendNotification(subscription, payload)
            .then(() => {
                results.sent++;
                console.log(`[Push] Broadcast sent to user ${userId}`);
            })
            .catch((error) => {
                results.failed++;
                console.error(`[Push] Broadcast failed for user ${userId}:`, error.message);

                // Remove invalid subscriptions
                if (error.statusCode === 410) {
                    subscriptions.delete(userId);
                    results.removed++;
                    console.log(`[Push] Removed invalid subscription for user ${userId}`);
                }
            });

        promises.push(promise);
    }

    await Promise.all(promises);

    console.log(`[Push] Broadcast complete:`, results);

    res.json({
        success: true,
        message: 'Broadcast complete',
        results
    });
});

/**
 * Get subscription stats
 */
app.get('/api/push/stats', (req, res) => {
    res.json({
        totalSubscriptions: subscriptions.size,
        subscribers: Array.from(subscriptions.keys())
    });
});

/**
 * Test notification endpoint (for development)
 */
app.post('/api/push/test', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({
            error: 'userId is required'
        });
    }

    const subscription = subscriptions.get(userId);

    if (!subscription) {
        return res.status(404).json({
            error: 'User not subscribed',
            userId
        });
    }

    const payload = JSON.stringify({
        title: 'Nexdom OS - Prueba',
        body: 'Las notificaciones push están funcionando correctamente ✓',
        icon: '/pwa/favicon-192x192.png',
        badge: '/pwa/maskable_icon-96x96.png',
        tag: 'test-notification',
        data: {
            url: '/',
            timestamp: Date.now(),
            test: true
        },
        vibrate: [200, 100, 200]
    });

    try {
        await webpush.sendNotification(subscription, payload);

        res.json({
            success: true,
            message: 'Test notification sent',
            userId
        });
    } catch (error) {
        console.error('[Push] Test notification failed:', error);

        res.status(500).json({
            error: 'Failed to send test notification',
            details: error.message
        });
    }
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
    console.error('[Push] Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('[Push] Nexdom OS Push Notification Server');
    console.log('='.repeat(50));
    console.log(`[Push] Server running on port ${PORT}`);
    console.log(`[Push] VAPID Subject: ${VAPID_SUBJECT}`);
    console.log('[Push] Endpoints:');
    console.log(`  - GET  /health`);
    console.log(`  - GET  /api/push/vapid-public-key`);
    console.log(`  - POST /api/push/subscribe`);
    console.log(`  - POST /api/push/unsubscribe`);
    console.log(`  - POST /api/push/send`);
    console.log(`  - POST /api/push/broadcast`);
    console.log(`  - POST /api/push/test`);
    console.log(`  - GET  /api/push/stats`);
    console.log('='.repeat(50));

    // Validate VAPID keys
    if (VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY') {
        console.warn('⚠️  WARNING: Using default VAPID keys!');
        console.warn('⚠️  Generate keys with: npx web-push generate-vapid-keys');
    }
});

// ==================== EXPORTS (for integration) ====================

module.exports = {
    app,
    subscriptions,

    // Helper functions for integrating into existing backend
    async sendPushNotification(userId, notification) {
        const subscription = subscriptions.get(userId);
        if (!subscription) {
            throw new Error('User not subscribed');
        }

        const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/pwa/favicon-192x192.png',
            badge: '/pwa/maskable_icon-96x96.png',
            tag: notification.tag || `nexdom-${Date.now()}`,
            data: notification.data || {},
            actions: notification.actions || [],
            requireInteraction: notification.requireInteraction || false,
            vibrate: notification.vibrate || [200, 100, 200]
        });

        return webpush.sendNotification(subscription, payload);
    },

    async broadcastPushNotification(notification) {
        const promises = [];

        for (const [userId, subscription] of subscriptions.entries()) {
            const payload = JSON.stringify({
                title: notification.title,
                body: notification.body,
                icon: notification.icon || '/pwa/favicon-192x192.png',
                badge: '/pwa/maskable_icon-96x96.png',
                tag: notification.tag || `nexdom-broadcast-${Date.now()}`,
                data: notification.data || {},
                actions: notification.actions || [],
                requireInteraction: notification.requireInteraction || false,
                vibrate: notification.vibrate || [200, 100, 200]
            });

            promises.push(
                webpush.sendNotification(subscription, payload)
                    .catch(error => {
                        if (error.statusCode === 410) {
                            subscriptions.delete(userId);
                        }
                    })
            );
        }

        return Promise.all(promises);
    }
};
