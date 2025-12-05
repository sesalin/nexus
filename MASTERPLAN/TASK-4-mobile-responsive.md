# TASK 4: Mobile Responsive + PWA Optimization

**Agent**: AI-4  
**Priority**: 🟢 MEDIUM  
**Duration**: 6-8 horas  
**Dependencies**: TASK 2 & TASK 3 complete

---

## 🎯 Objetivo

Asegurar que TODA la app sea mobile-first responsive y PWA-compliant. Desktop es secundario, mobile es primario.

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
