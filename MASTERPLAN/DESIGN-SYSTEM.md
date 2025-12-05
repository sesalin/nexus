# 🎨 NEXDOM DESIGN SYSTEM - Especificación Completa

**EXTRAÍDO DE**: nexdom_dashboard actual  
**PARA**: Preservar en la migración a @hakit/core  
**CRÍTICO**: Este es el DNA visual del dashboard

---

## 🎨 Color Palette

### Colores Primarios Nexdom

```css
/* Colores custom de marca */
--nexdom-gold: rgb(230, 195, 106);      /* #E6C36A */
--nexdom-lime: rgb(0, 255, 136);        /* #00FF88 */
--nexdom-darker: rgb(10, 10, 15);       /* #0A0A0F - Background */
```

### Colores por Tipo de Device

```typescript
const DEVICE_COLORS = {
  // Sensors & Thermostat
  sensor: {
    text: 'text-nexdom-gold',           // rgb(230, 195, 106)
    border: 'border-nexdom-gold/30',
    bg: 'bg-nexdom-gold/10',
    glow: 'shadow-[0_0_20px_rgba(230,195,106,0.2)]',
    activeBg: 'bg-nexdom-gold',
  },
  
  // Cameras
  camera: {
    text: 'text-blue-400',              // rgb(96, 165, 250)
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    activeBg: 'bg-blue-500',
  },
  
  // Actuators, Covers, Remotes
  actuator: {
    text: 'text-orange-400',            // rgb(251, 146, 60)
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
    activeBg: 'bg-orange-500',
  },
  
  // Switches, Dimmers, Buttons
  switch: {
    text: 'text-nexdom-lime',           // rgb(0, 255, 136)
    border: 'border-nexdom-lime/30',
    bg: 'bg-nexdom-lime/10',
    glow: 'shadow-[0_0_20px_rgba(0,255,136,0.2)]',
    activeBg: 'bg-nexdom-lime',
  },
  
  // Lights (generic, no RGB)
  light: {
    text: 'text-yellow-300',            // rgb(253, 224, 71)
    border: 'border-yellow-400/30',
    bg: 'bg-yellow-400/10',
    glow: 'shadow-[0_0_20px_rgba(250,204,21,0.2)]',
    activeBg: 'bg-yellow-400',
  },
  
  // Security & Locks
  security: {
    text: 'text-red-400',               // rgb(248, 113, 113)
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    activeBg: 'bg-red-500',
  },
  
  // Patio/Outdoor
  patio: {
    text: 'text-green-400',             // rgb(74, 222, 128)
    border: 'border-green-500/30',
    bg: 'bg-green-500/10',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
    activeBg: 'bg-green-500',
  },
  
  // Voice AI
  voice: {
    text: 'text-purple-400',            // rgb(192, 132, 252)
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    activeBg: 'bg-purple-500',
  },
};
```

### RGB Lights - Colores Dinámicos

```typescript
// Para luces con RGB activo
if (type === 'light' && isActive && rgbColor && rgbColor.length === 3) {
  const [r, g, b] = rgbColor;
  const rgbStr = `rgb(${r}, ${g}, ${b})`;
  const rgbAlpha = `rgba(${r}, ${g}, ${b}, 0.3)`;
  
  // Aplicar color custom
  borderColor: rgbAlpha,
  boxShadow: `0 0 20px ${rgbAlpha}`,
  iconColor: rgbStr,
  backgroundBlob: rgbStr, // Blob difuminado
}
```

---

## ✨ Efectos Glassmorphic

### Glass Panel Base

```css
.glass-panel {
  background: bg-nexdom-glass;           /* rgba(255,255,255,0.05) */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3);
}

.glass-panel-hover {
  transition: all 0.3s ease;
}

.glass-panel-hover:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
}
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'nexdom-gold': 'rgb(230, 195, 106)',
        'nexdom-lime': 'rgb(0, 255, 136)',
        'nexdom-darker': 'rgb(10, 10, 15)',
        'nexdom-glass': 'rgba(255, 255, 255, 0.05)',
        'nexdom-glass-border': 'rgba(255, 255, 255, 0.1)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon-gold': '0 0 20px rgba(230, 195, 106, 0.5)',
        'neon-lime': '0 0 20px rgba(0, 255, 136, 0.5)',
      },
      backdropBlur: {
        xl: '12px',
      },
    },
  },
};
```

---

## 💫 Neon Glow Effects

### Text Glows

```css
.text-glow-lime {
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.text-glow-gold {
  text-shadow: 0 0 10px rgba(230, 195, 106, 0.5);
}
```

### Box Shadows (Neon Glow)

```css
/* Generic glow pattern */
box-shadow: 0 0 20px rgba(COLOR, 0.2), 
            0 0 40px rgba(COLOR, 0.1);

/* Active state - más intenso */
box-shadow: 0 0 30px rgba(COLOR, 0.4),
            0 0 60px rgba(COLOR, 0.2),
            0 4px 12px rgba(0, 0, 0, 0.3);
```

### Animated Background Blob

```tsx
/* Blob difuminado que aparece detrás de cards activos */
<motion.div
  className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] 
             transition-opacity duration-700 pointer-events-none"
  style={{
    backgroundColor: customColor,
    opacity: isActive ? 0.3 : 0,
  }}
/>
```

---

## 🎬 Animaciones (Framer Motion)

### Card Animations

```typescript
// Hover effects
whileHover={{ scale: 1.02, y: -4 }}
whileTap={{ scale: 0.98 }}

// Icon rotation on hover
whileHover={{ rotate: 15, scale: 1.1 }}

// Settings button
whileHover={{ scale: 1.05, rotate: 90 }}
whileTap={{ scale: 0.9 }}
```

### Transitions

```typescript
// Smooth transitions
transition-all duration-300
transition-all duration-500
transition-all duration-700

// Cubic bezier easing
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Layout Animations

```tsx
<motion.div layout>
  {/* Auto-animates when layout changes */}
</motion.div>

<AnimatePresence>
  {value && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      {value}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 🎴 GadgetCard Complete Anatomy

### Visual Structure

```
┌─────────────────────────────────────────────┐
│  [Icon]                        [Status Pill]│ ← Header
│                                              │
│  Nombre del Device                           │ ← Title
│  model.abc                                   │ ← Model (mono)
│                                              │
│  22°C  (si aplica)                          │ ← Value (opcional)
│                                              │
│  [━━━━━━ ON ━━━━━━] [⚙️]                    │ ← Actions
└─────────────────────────────────────────────┘

Efectos:
- Background: Glassmorphic con blur
- Border: Color del device con alpha
- Glow: Box-shadow neon según color
- Blob: Background gradient difuminado
```

### Estado OFF

```css
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.05);
box-shadow: none;
color: rgb(156, 163, 175); /* gray-400 */
```

### Estado ON

```css
background: rgba(COLOR, 0.1);
border: 1px solid rgba(COLOR, 0.3);
box-shadow: 0 0 20px rgba(COLOR, 0.2),
            0 0 40px rgba(COLOR, 0.1);
color: rgb(255, 255, 255); /* white */

/* + Blob background */
position: absolute;
background: COLOR;
blur: 80px;
opacity: 0.3;
```

---

## 🖱️ Interactive States

### Buttons

```typescript
// Primary Action (ON/OFF)
const buttonStyles = {
  active: {
    background: colors.activeBg,      // Color sólido del device
    color: 'black',
    boxShadow: `shadow-lg shadow-${colors.activeBg}/20`,
  },
  inactive: {
    background: 'rgba(255,255,255,0.05)',
    color: 'rgb(209, 213, 219)', // gray-300
    border: '1px solid rgba(255,255,255,0.1)',
  },
  hover: {
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
  },
};

// Settings Button
const settingsButton = {
  background: 'rgba(255,255,255,0.05)',
  color: 'rgb(156, 163, 175)', // gray-400
  border: '1px solid rgba(255,255,255,0.1)',
  hover: {
    color: 'white',
    background: 'rgba(255,255,255,0.1)',
    transform: 'rotate(90deg)',
  },
};
```

### Status Pills

```tsx
<motion.div
  className={`
    px-3 py-1 rounded-full text-[10px] font-bold 
    uppercase tracking-wider border
  `}
  animate={{
    backgroundColor: isActive 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(255,255,255,0.05)',
    borderColor: isActive 
      ? 'rgba(255,255,255,0.2)' 
      : 'rgba(255,255,255,0.1)',
  }}
>
  {isActive && (
    <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[COLOR]" />
  )}
  {status}
</motion.div>
```

---

## 📐 Spacing & Typography

### Padding/Margin Scale

```css
p-3   /* 12px - Icon container */
p-5   /* 20px - Card padding */
gap-2 /* 8px - Button spacing */
gap-3 /* 12px - Grid spacing */
gap-4 /* 16px - Section spacing */

mb-1  /* 4px - Small gap */
mb-4  /* 16px - Medium gap */
mb-6  /* 24px - Large gap */
```

### Typography

```css
/* Title */
font-bold text-lg leading-tight
color: white (active) / gray-300 (inactive)

/* Model */
text-xs text-gray-500 font-mono
transition: text-gray-400 on hover

/* Value (temperature, etc) */
text-2xl font-light text-white/90 tracking-tight

/* Status Pill */
text-[10px] font-bold uppercase tracking-wider

/* Button */
font-bold text-sm
```

### Font Features

```css
body {
  font-feature-settings: "ss01", "ss02", "cv01", "cv02";
}
```

---

## 🎯 Border Radius

```css
rounded-xl      /* 12px - Buttons, icons containers */
rounded-[1.5rem] /* 24px - Cards */
rounded-full    /* Pills, dots */
```

---

## 📜 Custom Scrollbar

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

::-webkit-scrollbar-thumb {
  background: rgba(230, 195, 106, 0.3); /* nexdom-gold */
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(230, 195, 106, 0.6);
}

/* Hide scrollbar class */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

---

## ✅ Checklist de Implementación

Para migrar correctamente el diseño:

- [ ] Copiar `tailwind.config.js` colors (nexdom-gold, nexdom-lime, etc.)
- [ ] Implementar `.glass-panel` utility class
- [ ] Implementar `.text-glow-lime` y `.text-glow-gold`
- [ ] Custom scrollbar con nexdom-gold
- [ ] Framer Motion con mismos valores (scale, rotate, y)
- [ ] Box-shadow patterns para neon glows
- [ ] Background blob difuminado para estado activo
- [ ] RGB dynamic colors para luces
- [ ] Status pills con dot animado
- [ ] Font features enabledStep Id: 189
- [ ] Spacing scale consistente
- [ ] Border radius consistente

---

## 📦 Dependencies Necesarias

```json
{
  "dependencies": {
    "framer-motion": "^11.0.8 o ^12.23.25",
    "lucide-react": "latest",
    "tailwindcss": "^3.x"
  }
}
```

---

**Este design system ES la identidad visual de Nexdom.**

**Preservarlo completamente en la migración es MANDATORIO.**
