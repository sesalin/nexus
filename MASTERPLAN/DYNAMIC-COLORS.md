# 🎨 DYNAMIC COLOR THEMING - Especificación

**PARA**: Agentes AI-2, AI-3, AI-4  
**CRÍTICO**: El dashboard DEBE tener colores dinámicos

---

## 🌈 Concepto: UI que Refleja el Estado

**Problema**: Dashboards estáticos son aburridos.

**Solución**: Las tarjetas y iconos cambian de color según el estado del dispositivo.

### Ejemplos

#### Luces RGB
```
Luz RGB apagada → Tarjeta gris oscuro
Luz RGB en Rojo → Tarjeta con glow rojo + ícono rojo
Luz RGB en Azul → Tarjeta con glow azul + ícono azul
Luz RGB en Verde → Tarjeta con glow verde + ícono verde
```

#### Clima
```
AC en modo frío (16°C) → Tarjeta azul/cyan (frío)
Calefacción (28°C) → Tarjeta rojo/naranja (calor)
```

#### Switches
```
Switch OFF → Tarjeta gris
Switch ON → Tarjeta con glow naranja/amarillo (energía)
```

---

## 💡 Extracción de Colores por Domain

### 1. LIGHTS - RGB Color

```typescript
function getLightColor(entity: HassEntity) {
  if (!entity || entity.state === 'off') {
    return null; // Sin color (estado off)
  }
  
  // RGB color
  if (entity.attributes.rgb_color) {
    const [r, g, b] = entity.attributes.rgb_color;
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // HS color (Hue/Saturation)
  if (entity.attributes.hs_color) {
    const [h, s] = entity.attributes.hs_color;
    return `hsl(${h}, ${s}%, 50%)`;
  }
  
  // Color temperature (Kelvin to RGB approximation)
  if (entity.attributes.color_temp) {
    const kelvin = entity.attributes.color_temp;
    // Simplificado: 2000K = warm (naranja), 6500K = cool (azul)
    if (kelvin < 3500) {
      return '#ffa94d'; // Warm orange
    } else if (kelvin > 5000) {
      return '#4dabf7'; // Cool blue
    }
    return '#ffe066'; // Neutral yellow
  }
  
  // Fallback: luz blanca/amarilla genérica
  return '#ffd43b';
}
```

### 2. CLIMATE - Temperature-based

```typescript
function getClimateColor(entity: HassEntity) {
  const temp = entity.attributes.temperature || 22;
  const mode = entity.state;
  
  if (mode === 'off') return null;
  
  // Color según temperatura
  if (temp < 20) {
    return '#339af0'; // Azul frío
  } else if (temp > 25) {
    return '#ff6b6b'; // Rojo calor
  }
  return '#51cf66'; // Verde neutral
}
```

### 3. SWITCHES - Generic Energy

```typescript
function getSwitchColor(entity: HassEntity) {
  if (entity.state === 'off') return null;
  
  // Naranja/amarillo para indicar "energía activa"
  return '#ffa94d';
}
```

### 4. LOCKS - Security

```typescript
function getLockColor(entity: HassEntity) {
  if (entity.state === 'locked') {
    return '#51cf66'; // Verde = Seguro
  } else if (entity.state === 'unlocked') {
    return '#ff6b6b'; // Rojo = Inseguro
  }
  return '#868e96'; // Gris = Desconocido
}
```

### 5. COVERS - Position-based

```typescript
function getCoverColor(entity: HassEntity) {
  const position = entity.attributes.current_position || 0;
  
  if (position === 0) {
    return '#339af0'; // Azul = Cerrado
  } else if (position === 100) {
    return '#ffe066'; // Amarillo = Abierto
  }
  return '#4dabf7'; // Azul claro = Parcial
}
```

---

## 🎨 Aplicar Colores a Tarjetas (GadgetCard)

### Versión Completa con Colores Dinámicos

```typescript
import { useEntity } from '@hakit/core';
import type { EntityName } from '@hakit/core';
import { motion } from 'framer-motion';

interface GadgetCardProps {
  entityId: EntityName;
  onSettingsClick?: () => void;
}

export function GadgetCard({ entityId, onSettingsClick }: GadgetCardProps) {
  const entity = useEntity(entityId);
  const domain = entityId.split('.')[0];
  const isOn = entity.state !== 'off' && entity.state !== 'unavailable';
  
  // Obtener color dinámico
  const dynamicColor = getDynamicColor(entity, domain);
  
  return (
    <motion.div
      layout
      className="relative p-4 rounded-2xl backdrop-blur-lg border transition-all duration-300"
      style={{
        background: dynamicColor 
          ? `linear-gradient(135deg, ${dynamicColor}15, ${dynamicColor}05)`
          : 'rgba(255, 255, 255, 0.05)',
        borderColor: dynamicColor 
          ? `${dynamicColor}50`
          : 'rgba(255, 255, 255, 0.1)',
        boxShadow: dynamicColor 
          ? `0 0 20px ${dynamicColor}40, 0 0 40px ${dynamicColor}20`
          : 'none',
      }}
    >
      {/* Icono con color dinámico */}
      <div className="mb-3" style={{ color: dynamicColor || '#9ca3af' }}>
        <EntityIcon domain={domain} state={entity.state} size={32} />
        <h4 className="text-sm font-semibold mt-2 text-white">
          {entity.attributes.friendly_name}
        </h4>
        <p className="text-xs text-gray-400">{entity.state}</p>
      </div>
      
      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => entity.service.toggle()}
          className="flex-1 p-2 rounded-lg flex items-center justify-center gap-2"
          style={{
            background: isOn && dynamicColor 
              ? `${dynamicColor}40`
              : 'rgba(255, 255, 255, 0.1)',
            color: isOn ? '#ffffff' : '#9ca3af',
          }}
        >
          {isOn ? 'On' : 'Off'}
        </button>
        
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg bg-white/10"
          >
            ⚙️
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Helper: Obtener color según domain y estado
function getDynamicColor(entity: any, domain: string): string | null {
  if (entity.state === 'off' || entity.state === 'unavailable') {
    return null;
  }
  
  switch (domain) {
    case 'light':
      return getLightColor(entity);
    case 'climate':
      return getClimateColor(entity);
    case 'switch':
      return getSwitchColor(entity);
    case 'lock':
      return getLockColor(entity);
    case 'cover':
      return getCoverColor(entity);
    default:
      return '#8b5cf6'; // Purple genérico
  }
}
```

---

## ✨ Efectos Glassmorphic + Glow

### CSS para Glassmorphism con Color Dinámico

```css
/* En tu index.css o componente */
.dynamic-card {
  /* Glassmorphism base */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  /* El color se inyecta vía style inline */
  background: var(--card-gradient);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-glow);
  
  /* Smooth transitions */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dynamic-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-glow-hover);
}
```

### Inline Styles (Método Recomendado)

```typescript
// En el componente
const cardStyles = {
  background: dynamicColor 
    ? `linear-gradient(135deg, ${dynamicColor}20, ${dynamicColor}05)`
    : 'rgba(255, 255, 255, 0.05)',
  
  borderColor: dynamicColor 
    ? `${dynamicColor}60`
    : 'rgba(255, 255, 255, 0.1)',
  
  boxShadow: dynamicColor 
    ? `
      0 0 20px ${dynamicColor}40,
      0 0 40px ${dynamicColor}20,
      0 4px 12px rgba(0, 0, 0, 0.3)
    `
    : '0 4px 12px rgba(0, 0, 0, 0.3)',
};

<div style={cardStyles}>
  {/* Card content */}
</div>
```

---

## 🎨 Color Palette Reference

### Colores por Tipo de Device

```typescript
const COLOR_PALETTE = {
  // Lights
  light_rgb: 'dynamic', // Extraído del entity
  light_white: '#ffd43b',
  light_warm: '#ffa94d',
  light_cool: '#4dabf7',
  
  // Climate
  climate_cold: '#339af0',
  climate_neutral: '#51cf66',
  climate_hot: '#ff6b6b',
  
  // Switches
  switch_on: '#ffa94d',
  
  // Locks
  lock_locked: '#51cf66',
  lock_unlocked: '#ff6b6b',
  
  // Covers
  cover_open: '#ffe066',
  cover_closed: '#339af0',
  
  // Generic
  generic_on: '#8b5cf6',
  generic_off: 'transparent',
};
```

---

## 🧪 Testing de Colores

### Test Matrix

| Device Type | State | Expected Color | Glow Effect |
|-------------|-------|----------------|-------------|
| Light RGB (255,0,0) | On | `rgb(255,0,0)` | Red glow |
| Light RGB (0,255,0) | On | `rgb(0,255,0)` | Green glow |
| Light RGB (0,0,255) | On | `rgb(0,0,255)` | Blue glow |
| Light White | On | `#ffd43b` | Yellow glow |
| Climate 16°C | Cool | `#339af0` | Blue glow |
| Climate 28°C | Heat | `#ff6b6b` | Red glow |
| Switch | On | `#ffa94d` | Orange glow |
| Lock | Locked | `#51cf66` | Green glow |
| Lock | Unlocked | `#ff6b6b` | Red glow |
| Any | Off | `null` | No glow |

---

## 📱 Mobile Considerations

En mobile, los glows deben ser:
- Más sutiles (opacity reducida)
- Sin blur excesivo (performance)

```typescript
const isMobile = window.innerWidth < 768;

const glowIntensity = isMobile ? '20' : '40'; // Hex opacity
const blurAmount = isMobile ? '8px' : '12px';
```

---

## ✅ Checklist de Implementación

- [ ] `getDynamicColor()` implementado para cada domain
- [ ] GadgetCard usa colores dinámicos en background
- [ ] GadgetCard usa colores dinámicos en border
- [ ] GadgetCard usa colores dinámicos en glow (box-shadow)
- [ ] Iconos cambian de color según estado
- [ ] Botones "On" usan el color dinámico
- [ ] Transiciones smooth entre estados
- [ ] Performance OK en mobile (sin lag)
- [ ] Colores accesibles (contrast ratio ≥ 4.5:1)

---

## 🎬 Ejemplos Visuales

### Tarjeta con Luz Roja Encendida

```tsx
// Estado: light.sala con rgb_color: [255, 0, 0]
<div
  className="card"
  style={{
    background: 'linear-gradient(135deg, rgba(255,0,0,0.2), rgba(255,0,0,0.05))',
    border: '1px solid rgba(255,0,0,0.6)',
    boxShadow: '0 0 20px rgba(255,0,0,0.4), 0 0 40px rgba(255,0,0,0.2)',
  }}
>
  <LightbulbIcon style={{ color: 'rgb(255,0,0)' }} />
  <h4>Luz Sala</h4>
  <button style={{ background: 'rgba(255,0,0,0.4)' }}>On</button>
</div>
```

### Tarjeta con Luz Apagada

```tsx
// Estado: light.sala OFF
<div
  className="card"
  style={{
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: 'none',
  }}
>
  <LightbulbIcon style={{ color: '#9ca3af' }} />
  <h4>Luz Sala</h4>
  <button style={{ background: 'rgba(255,255,255,0.1)' }}>Off</button>
</div>
```

---

**ESTE EFECTO ES LO QUE HACE TU DASHBOARD ÚNICO Y PREMIUM.**

**Implementar en TODAS las tarjetas (GadgetCard, ZoneCard, etc.).**
