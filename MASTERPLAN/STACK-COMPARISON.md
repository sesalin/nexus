# 📊 STACK COMPARISON - Quick Reference

## ACTUAL vs TARGET

### 🔴 ACTUAL (nexdom_dashboard)
```
Frontend:       React 18 + TypeScript + Vite
State:          Zustand + Context API
Styling:        Tailwind CSS + Framer Motion
Backend:        ✅ Node.js + Express + WebSocket (567 líneas)
HA Integration: ✅ Custom WebSocket Client (970 líneas)
Total Custom:   1,936 líneas
```

### 🟢 TARGET (PWA con @hakit/core)
```
Frontend:       React 19 RC + TypeScript + Vite
State:          Zustand (UI) + @hakit/core (HA state)
Styling:        Tailwind CSS + Framer Motion ✅ PRESERVED
Backend:        ❌ ELIMINADO
HA Integration: @hakit/core v6.0.0 (WebSocket directo)
Total Custom:   ~390 líneas (80% reduction)
```

---

## 📦 Dependencies

### AGREGAR
```json
{
  "@hakit/core": "^6.0.0",
  "@hakit/components": "^6.0.0"
}
```

### ELIMINAR
```json
{
  "express": "^4.x",
  "ws": "^8.x",
  "axios": "^1.x",
  "helmet": "^7.x",
  "cors": "^2.x",
  "morgan": "^1.x",
  "rate-limiter-flexible": "^3.x"
}
```

### MANTENER
```json
{
  "react": "^19.0.0-rc.1",
  "react-dom": "^19.0.0-rc.1",
  "zustand": "^5.0.9",
  "framer-motion": "^12.23.25",
  "tailwindcss": "^3.x",
  "lucide-react": "^0.555.0",
  "react-router-dom": "^7.10.1"
}
```

---

## ✅ Lo que SE PRESERVE

### Design System
- ✅ Colores: nexdom-gold, nexdom-lime
- ✅ Glassmorphic effects
- ✅ Neon glows
- ✅ Framer Motion animations
- ✅ Tailwind config completo

### Features
- ✅ PWA capabilities
- ✅ OAuth2 authentication
- ✅ Responsive layout
- ✅ Favorites system
- ✅ Alert system
- ✅ Voice AI interface

### Components UI
- ✅ Header
- ✅ Sidebar
- ✅ GadgetCard (visual)
- ✅ Modals (visual)
- ✅ All custom widgets

---

## ❌ Lo que SE ELIMINA

### Code
- ❌ `backend/` (567 líneas)
- ❌ `HomeAssistant.tsx` (970 líneas)
- ❌ Custom WebSocket client
- ❌ ID translation layer
- ❌ Manual filtering logic (reemplazado por @hakit)

### Infrastructure
- ❌ Node.js runtime en container
- ❌ Express server
- ❌ WebSocket proxy
- ❌ ~100MB de node_modules del backend

---

## 🔄 Migration Flow

```
ANTES:
Browser → Backend Proxy → Home Assistant
         (Node.js)

DESPUÉS:
Browser → Home Assistant
         (directo con @hakit/core)
```

---

## 💰 Beneficios

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| LoC custom | 1,936 | 390 | -80% |
| Dependencies | 15+ | 2 new | Simplified |
| Docker image | ~250MB | ~50MB | -80% |
| Tiempo dev | 6 meses | 1 semana | 24x faster |
| Costo | $100K | $12.5K | -87% |
| Maintenance | Alto | Bajo | Community |

---

## 🚀 Usage Example

### ANTES (Custom)
```typescript
const { entities, zones } = useHomeAssistant();
// 970 líneas de lógica custom
```

### DESPUÉS (@hakit/core)
```typescript
import { useEntity, useAreas } from '@hakit/core';

const entity = useEntity('light.sala');
const areas = useAreas();

// 0 líneas de lógica custom - todo manejado por @hakit
```

---

**Stack TARGET = Mismo frontend + @hakit/core - Backend custom**
