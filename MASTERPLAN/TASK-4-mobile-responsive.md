# TASK 4: Mobile Responsive + PWA Optimization

**Agent**: AI-4  
**Priority**: 🟢 MEDIUM  
**Duration**: 6-8 horas  
**Dependencies**: TASK 2 complete (pages migrated)

---

## ⚠️ CRITICAL - DO NOT

**NEVER** read, search, or edit files in:
- ❌ `node_modules/` - Third-party packages (waste of time)
- ❌ `dist/` or `build/` - Build artifacts
- ❌ `.vite/` or `.cache/` - Cache directories
- ❌ `.git/` - Version control

**ONLY** work in:
- ✅ `PWA/src/` - Source code
- ✅ `PWA/public/` - Static assets
- ✅ Root config files (`package.json`, `tailwind.config.js`, `vite.config.ts`)

---

## 🎯 Objetivo

Asegurar que TODA la app sea mobile-first responsive y PWA-compliant. Desktop es secundario, mobile es primario.

---

## 🎯 Objetivo

Asegurar mobile-first responsiveness y optimizar PWA completo con manifest, service worker, notificaciones push y full-screen mode.

---

## 🚨 PWA ASSETS YA DISPONIBLES

**Carpeta**: `PWA/public/pwa/`

Contiene:
- Imágenes de iconos (varios tamaños)
- `manifest.json` (con rutas a corregir)

### ACCIÓN REQUERIDA:

#### 1. Corregir rutas en manifest.json

**Archivo**: `PWA/public/pwa/manifest.json`

Las rutas deben ser **relativas a `public/`**:

```json
{
  "icons": [
    {
      "src": "/pwa/icon-192x192.png",  // ✅ CORRECTO (relativo a public/)
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/pwa/icon-512x512.png",  // ✅ CORRECTO
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

❌ **MAL**: `"src": "pwa/icon-192x192.png"` (sin `/` inicial)  
❌ **MAL**: `"src": "./pwa/icon-192x192.png"` (no funciona en PWA)  
✅ **BIEN**: `"src": "/pwa/icon-192x192.png"`

#### 2. Full Screen Mode

Agregar a manifest.json:

```json
{
  "name": "Nexdom Dashboard",
  "short_name": "Nexdom",
  "display": "fullscreen",  // ✅ Full screen en móviles
  "orientation": "portrait-primary",
  "theme_color": "#0A0A0F",
  "background_color": "#0A0A0F",
  "start_url": "/",
  "scope": "/"
}
```

#### 3. Incluir manifest en index.html

**Archivo**: `PWA/index.html`

```html
<head>
  <link rel="manifest" href="/pwa/manifest.json">
  <meta name="theme-color" content="#0A0A0F">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
</head>
```

---

## 🔔 NOTIFICACIONES PUSH

### Implementar Permission Request

**Archivo**: `PWA/src/utils/notifications.ts`

```typescript
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

export function sendTestNotification(title: string, body: string) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/pwa/icon-192x192.png',
      badge: '/pwa/icon-96x96.png',
      vibrate: [200, 100, 200],
    });
  }
}
```

### Componente para solicitar permisos

**Archivo**: `PWA/src/components/NotificationPrompt.tsx`

```typescript
import { useState, useEffect } from 'react';
import { requestNotificationPermission } from '@/utils/notifications';

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    // Mostrar prompt solo si no se ha pedido antes
    if (Notification.permission === 'default') {
      setTimeout(() => setShow(true), 5000); // Después de 5s
    }
  }, []);
  
  const handleRequest = async () => {
    const granted = await requestNotificationPermission();
    setShow(false);
    
    if (granted) {
      // Enviar notificación de prueba
      new Notification('¡Listo!', {
        body: 'Recibirás notificaciones de tu hogar inteligente',
        icon: '/pwa/icon-192x192.png',
      });
    }
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed bottom-4 right-4 glass-panel p-4 rounded-xl max-w-sm z-50">
      <h3 className="font-bold mb-2">🔔 Notificaciones</h3>
      <p className="text-sm text-gray-300 mb-4">
        Recibe alertas importantes de tu hogar inteligente
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleRequest}
          className="flex-1 bg-nexdom-lime text-black px-4 py-2 rounded-lg font-bold"
        >
          Permitir
        </button>
        <button
          onClick={() => setShow(false)}
          className="px-4 py-2 rounded-lg bg-white/10"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
```

### Agregar al Dashboard

**Archivo**: `PWA/src/App.tsx` o `Dashboard.tsx`

```typescript
import { NotificationPrompt } from '@/components/NotificationPrompt';

function App() {
  return (
    <>
      {/* App content */}
      <NotificationPrompt />
    </>
  );
}
```

---

## 📱 PWA INSTALL PROMPT

**Archivo**: `PWA/src/components/PWAInstallButton.tsx`

```typescript
import { useState, useEffect } from 'react';

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('Install outcome:', outcome);
    setDeferredPrompt(null);
    setShowButton(false);
  };
  
  if (!showButton) return null;
  
  return (
    <button
      onClick={handleInstall}
      className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 hover:bg-nexdom-lime/20 transition-all"
    >
      <span>📱</span>
      <span className="text-sm font-bold">Instalar App</span>
    </button>
  );
}
```

---

## 🧪 TESTING NOTIFICATIONS

### Script de prueba

**Archivo**: `PWA/src/pages/Debug.tsx`

Agregar sección de testing:

```typescript
import { sendTestNotification } from '@/utils/notifications';

function Debug() {
  const testNotification = () => {
    sendTestNotification(
      '🚨 Alerta de Prueba',
      'Esta es una notificación de prueba desde Nexdom Dashboard'
    );
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Notification Testing</h2>
      
      <div className="glass-panel p-4 rounded-xl mb-4">
        <p className="mb-4">Permission status: <strong>{Notification.permission}</strong></p>
        
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const granted = await requestNotificationPermission();
              alert(granted ? 'Granted!' : 'Denied');
            }}
            className="bg-nexdom-lime text-black px-4 py-2 rounded-lg"
          >
            Request Permission
          </button>
          
          <button
            onClick={testNotification}
            className="bg-nexdom-gold text-black px-4 py-2 rounded-lg"
            disabled={Notification.permission !== 'granted'}
          >
            Send Test Notification
          </button>
        </div>
      </div>
      
      <div className="glass-panel p-4 rounded-xl">
        <h3 className="font-bold mb-2">📝 Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Request Permission"</li>
          <li>Allow notifications in browser prompt</li>
          <li>Click "Send Test Notification"</li>
          <li>Verify notification appears</li>
          <li>Check notification icon, body, vibration</li>
        </ol>
      </div>
    </div>
  );
}
```

---

## 📋 Checklist

### Mobile Responsive
- [ ] Todas las páginas responsive 320px - 428px
- [ ] Touch targets ≥ 44x44px
- [ ] Font sizes ≥ 16px (evita zoom iOS)
- [ ] No horizontal scroll
- [ ] Gestures funcionan (swipe, pinch)

### PWA
- [ ] manifest.json correcto
- [ ] Service worker activo
- [ ] Installable (beforeinstallprompt event)
- [ ] Icons 192px y 512px
- [ ] Offline fallback

### Performance
- [ ] Lighthouse score \u003e 90 (mobile)
- [ ] First Contentful Paint \u003c 2s
- [ ] Time to Interactive \u003c 3s
- [ ] No layout shifts (CLS \u003c 0.1)

---

## 📱 Screen Sizes a Probar

### Mobile
- iPhone SE: 375x667 (320px portrait por zoom)
- iPhone 12/13: 390x844
- iPhone 14 Pro Max: 430x932
- Samsung Galaxy S21: 360x800
- Pixel 7: 412x915

### Tablet
- iPad Mini: 768x1024
- iPad Pro 11": 834x1194
- iPad Pro 12.9": 1024x1366

### Desktop
- Laptop: 1366x768
- Desktop HD: 1920x1080
- Desktop QHD: 2560x1440

---

## 🎨 Responsive Breakpoints

### Tailwind Config (already setup)
```javascript
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Small mobile landscape
      'md': '768px',   // Tablet portrait
      'lg': '1024px',  // Tablet landscape / small desktop
      'xl': '1280px',  // Desktop
      '2xl': '1536px', // Large desktop
    }
  }
}
```

### Usage Pattern
```tsx
<div className="
  p-4              {/* Mobile: 16px padding */}
  md:p-6           {/* Tablet: 24px */}
  lg:p-8           {/* Desktop: 32px */}
  max-w-full       {/* Mobile: full width */}
  md:max-w-3xl     {/* Tablet: 768px */}
  lg:max-w-7xl     {/* Desktop: 1280px */}
  mx-auto          {/* Center */}
">
  {/* Content */}
</div>
```

---

## 🔧 Critical Fixes

### 1. Touch Targets

**Problema**: Botones muy pequeños en móvil.

**Fix**:
```tsx
// ❌ Mal
<button className="p-1">...</button>

// ✅ Bien
<button className="p-3 min-w-[44px] min-h-[44px]">...</button>
```

### 2. Font Sizes

**Problema**: iOS hace zoom cuando input \u003c 16px.

**Fix**:
```css
/* index.css */
input, select, textarea {
  font-size: 16px; /* Nunca menos! */
}
```

### 3. Viewport Meta

**Verificar en index.html**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
```

**NO** usar `maximum-scale=1` (bloquea zoom de accesibilidad).

### 4. Safe Area (iOS Notch)

```css
.container {
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

### 5. Orientation Locks

**No bloquear orientación**. Permitir portrait y landscape.

---

## 📦 PWA Manifest

### Archivo: `PWA/public/manifest.json`

```json
{
  "name": "Nexdom Dashboard",
  "short_name": "Nexdom",
  "description": "Smart Home Dashboard for Home Assistant",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#8B5CF6",
  "orientation": "any",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["productivity", "utilities"],
  "screenshots": [
    {
      "src": "/screenshot-mobile.png",
      "sizes": "390x844",
      "type": "image/png"
    },
    {
      "src": "/screenshot-desktop.png",
      "sizes": "1920x1080",
      "type": "image/png"
    }
  ]
}
```

### Icons

**Generar iconos**:
```bash
# Tool: https://realfavicongenerator.net/
# O manual con ImageMagick:
convert logo.png -resize 192x192 icon-192.png
convert logo.png -resize 512x512 icon-512.png
```

---

## ⚙️ Service Worker

### Archivo: `PWA/public/sw.js`

```javascript
const CACHE_NAME = 'nexdom-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### Registrar en `main.tsx`

```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('SW registered:', reg

))
      .catch((err) => console.error('SW error:', err));
  });
}
```

---

## 🧪 Testing

### Lighthouse Audit

```bash
# CLI
npm install -g lighthouse
lighthouse http://localhost:5173 --view --preset=desktop
lighthouse http://localhost:5173 --view --preset=mobile

# O Chrome DevTools > Lighthouse tab
```

**Target Scores**:
- Performance: \u003e 90
- Accessibility: \u003e 95
- Best Practices: \u003e 95
- SEO: \u003e 90
- PWA: ✓ (all checks)

### PWA Install Test

**Desktop**:
1. Abrir app en Chrome
2. Ver ícono "Install" en address bar
3. Click → Install
4. Verificar app se abre standalone

**Mobile**:
1. Abrir en Chrome Android / Safari iOS
2. Menu → "Add to Home Screen"
3. Verificar icono en home screen
4. Abrir → debe ser fullscreen (sin browser chrome)

### Device Testing

**Herramientas**:
- BrowserStack (si tienes acceso)
- Sauce Labs
- Local: Chrome DevTools Device Mode
- Real devices: Tu teléfono!

**Test Matrix**:
| Device | OS | Browser | Status |
|--------|----|---------| -------|
| iPhone 14 | iOS 17 | Safari | ⏳ |
| Pixel 7 | Android 13 | Chrome | ⏳ |
| iPad Pro | iPadOS 17 | Safari | ⏳ |
| Desktop | Win/Mac | Chrome | ⏳ |

---

## ✅ Acceptance Criteria

### Mobile
- [ ] Funciona en iPhone SE (más pequeño)
- [ ] Touch targets ≥ 44px
- [ ] No zoom automático en inputs
- [ ] Smooth scroll
- [ ] Swipe gestures (si aplica)

### PWA
- [ ] Install prompt aparece
- [ ] App installable en mobile
- [ ] App installable en desktop
- [ ] Offline mode funciona (assets cached)
- [ ] Icons display correctamente

### Performance
- [ ] Lighthouse mobile \u003e 90
- [ ] FCP \u003c 2s
- [ ] TTI \u003c 3s
- [ ] No layout shifts visibles

---

## 📦 Deliverables

- ✅ Todas las páginas responsive
- ✅ PWA manifest correcto
- ✅ Service worker funcionando
- ✅ Icons 192px y 512px
- ✅ Lighthouse report (screenshot)
- ✅ Video de install en mobile

---

## 📸 Screenshots Required

1. Mobile portrait (390px)
2. Mobile landscape (844px)
3. Tablet (768px)
4. Desktop (1920px)
5. PWA install prompt
6. Installed app (standalone mode)

---

**MAKE IT RESPONSIVE! 📱**
