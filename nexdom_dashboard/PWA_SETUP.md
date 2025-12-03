# Nexdom OS - PWA Setup Guide

Complete guide for the production-ready Progressive Web App configuration.

## 📋 Overview

Nexdom OS is now configured as a professional PWA with:

- ✅ Full offline support
- ✅ Desktop and mobile installation
- ✅ Push notification support with VAPID
- ✅ Modern caching strategies
- ✅ Background sync capabilities
- ✅ Service worker lifecycle management

## 📁 Files Created/Modified

### Core PWA Files

| File | Status | Description |
|------|--------|-------------|
| `public/manifest.json` | ✅ Updated | Complete PWA manifest with all metadata |
| `public/service-worker.js` | ✅ New | Production service worker with push support |
| `public/sw-registration.js` | ✅ New | Service worker registration & management |
| `index.html` | ✅ Updated | PWA integration and theme updates |
| `backend/push-notification-endpoint.js` | ✅ New | Optional server template for push notifications |

### PWA Assets (Already in place)

All icons and screenshots are located in `public/pwa/`:

- **Icons**: 16×16, 32×32, 192×192, 384×384, 512×512, 1024×1024
- **Maskable Icons**: 48×48, 72×72, 96×96, 128×128, 192×192, 384×384, 512×512
- **Apple Touch Icon**: 180×180
- **Screenshots**: Desktop (wide) and Mobile (narrow)

## 🚀 Quick Start

### 1. Build and Test

```bash
# Build the application
cd /home/cheko/nexdom/addon/nexdom_dashboard
npm run build

# Preview the built app
npm run preview
```

### 2. Verify PWA Configuration

Open Chrome DevTools → Application tab:

- **Manifest**: Check all fields are correct
- **Service Workers**: Verify registration
- **Icons**: All sizes display correctly
- **Screenshots**: Both form factors present

### 3. Test Installation

**Desktop (Chrome):**
1. Open the app
2. Look for install icon in address bar
3. Click and verify screenshots show
4. Install and verify standalone mode

**Mobile:**
1. Open in mobile browser
2. Use "Add to Home Screen"
3. Verify icon and splash screen

## 🔔 Push Notifications Setup

### Frontend Integration

The PWA is ready for push notifications. To use them:

#### 1. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

#### 2. Update Service Worker

Edit `public/service-worker.js` line 10:

```javascript
const VAPID_PUBLIC_KEY = 'YOUR_ACTUAL_VAPID_PUBLIC_KEY_HERE';
```

#### 3. Use in Your React App

```javascript
import { 
  requestNotificationPermission, 
  subscribeUserToPush,
  sendTestNotification 
} from '/sw-registration.js';

// Request permission
const granted = await requestNotificationPermission();

if (granted) {
  // Subscribe to push (use your VAPID public key)
  const subscription = await subscribeUserToPush('YOUR_VAPID_PUBLIC_KEY');
  
  // Send subscription to your backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'current-user-id',
      subscription
    })
  });
}

// Test notification
await sendTestNotification();
```

### Backend Integration (Optional)

#### 1. Install Dependencies

```bash
cd backend
npm install express web-push body-parser cors
```

#### 2. Configure Server

Edit `backend/push-notification-endpoint.js`:

```javascript
const VAPID_PUBLIC_KEY = 'your-public-key';
const VAPID_PRIVATE_KEY = 'your-private-key';
const VAPID_SUBJECT = 'mailto:your-email@domain.com';
```

#### 3. Start Push Server

```bash
node backend/push-notification-endpoint.js
```

#### 4. Send Notifications

```bash
# Send to specific user
curl -X POST http://localhost:3001/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "title": "Nexdom Alert",
    "body": "Motion detected in living room"
  }'

# Broadcast to all users
curl -X POST http://localhost:3001/api/push/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Update",
    "body": "Nexdom OS has been updated"
  }'
```

## 🧪 Testing in Development

### Console Testing

When running on localhost, PWA functions are available via `window.PWA`:

```javascript
// Check PWA status
window.PWA.isStandalone()
window.PWA.isPushNotificationSupported()

// Request notification permission
await window.PWA.requestNotificationPermission()

// Subscribe to push (replace with your key)
await window.PWA.subscribeUserToPush('YOUR_VAPID_PUBLIC_KEY')

// Send test notification
await window.PWA.sendTestNotification()

// Trigger install prompt
window.PWA.installApp()
```

### Service Worker Testing

```javascript
// Get SW version
const version = await window.PWA.getServiceWorkerVersion();
console.log('Service Worker version:', version);

// Clear all caches (for testing)
await window.PWA.clearCache();
```

## 📱 PWA Features

### Offline Support

The service worker caches:
- Static assets (HTML, CSS, JS)
- API responses (with network-first strategy)
- Icons and images

If offline, users see a custom offline page with retry option.

### Background Sync

The SW supports background sync for pending operations when connection is restored.

### Push Notifications

Full push notification support with:
- Permission request on first install
- VAPID authentication
- Notification click handling
- Custom notification actions
- Badge and vibration support

### App Shortcuts

Quick actions from the app icon (defined in manifest):
- Dashboard shortcut
- Easy to add more in `manifest.json`

## 🎨 Branding

### Theme Color

- **Primary**: `#1FC70E` (Nexdom green)
- **Background**: `#000000` (true black)

### Name & Description

- **Name**: Nexdom OS
- **Short Name**: Nexdom OS
- **Description**: Home automation platform that puts local control and privacy first.

## 🔧 Customization

### Adding More Shortcuts

Edit `public/manifest.json`:

```json
{
  "shortcuts": [
    {
      "name": "Devices",
      "short_name": "Devices",
      "description": "View all devices",
      "url": "/devices?source=shortcut",
      "icons": [{ "src": "./pwa/maskable_icon-96x96.png", "sizes": "96x96" }]
    }
  ]
}
```

### Custom Notification Actions

```javascript
const notification = {
  title: 'Door Bell',
  body: 'Someone is at the door',
  actions: [
    { action: 'view', title: 'View Camera' },
    { action: 'dismiss', title: 'Dismiss' }
  ],
  data: { 
    url: '/cameras/front-door',
    cameraId: 'front_door' 
  }
};
```

### Cache Customization

Edit `public/service-worker.js`:

```javascript
// Adjust cache sizes
const MAX_CACHE_SIZE = {
  static: 50,   // Static files
  dynamic: 100, // Dynamic assets
  api: 50       // API responses
};

// Add more API patterns to cache
const API_CACHE_PATTERNS = [
  /\/api\/states/,
  /\/api\/config/,
  /\/api\/your-endpoint/  // Add your patterns
];
```

## 📊 Lighthouse Audit

Expected scores:
- ✅ **PWA**: 100/100
- ✅ **Installable**: Yes
- ✅ **Works offline**: Yes
- ✅ **Fast load times**: Yes
- ✅ **Splash screen**: Configured
- ✅ **Theme color**: Set

## 🔒 Security Notes

1. **VAPID Keys**: Keep private key secret, never commit to git
2. **HTTPS Required**: PWA and push notifications require HTTPS in production
3. **Subscription Security**: Validate subscriptions server-side
4. **Permission Handling**: Request notification permission contextually, not on first load

## 🐛 Troubleshooting

### Service Worker Not Updating

```javascript
// Force update in console
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update();
  reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
});
```

### Manifest Not Loading

Check:
- File is at `/manifest.json`
- Correct MIME type: `application/manifest+json`
- No JSON syntax errors
- All icon paths are correct

### Push Notifications Not Working

Check:
- HTTPS is enabled (required)
- Notification permission granted
- VAPID keys are correct
- Service worker is active
- Browser supports push (not Safari < 16.4)

### Clear Everything and Restart

```javascript
// In console
await window.PWA.clearCache();
await navigator.serviceWorker.getRegistrations()
  .then(regs => Promise.all(regs.map(reg => reg.unregister())));
location.reload();
```

## 📚 Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [VAPID Spec](https://datatracker.ietf.org/doc/html/rfc8292)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## ✅ Checklist

- [x] Manifest configured with all required fields
- [x] Service worker implemented with caching strategies
- [x] Push notification support added
- [x] Icons in all required sizes
- [x] Screenshots for wide and narrow form factors
- [x] Theme color set to Nexdom green
- [x] Offline fallback page
- [x] Registration script with helpers
- [x] Backend template provided
- [x] Development testing utilities
- [ ] Generate actual VAPID keys (user action required)
- [ ] Test on production HTTPS (user action required)
- [ ] Deploy and verify installation (user action required)

---

**Nexdom OS PWA** - Professional, installable, notification-ready ✨
