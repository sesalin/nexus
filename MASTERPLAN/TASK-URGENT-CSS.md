# 🚨 URGENT: FIX CSS STYLING

**Agent**: AI-STYLING  
**Priority**: 🔴 CRITICAL  
**Duration**: 2-3 horas  
**Dependencies**: TASK-2, TASK-3 complete

---

## ⚠️ CRITICAL - DO NOT

**NEVER** read, search, or edit files in:
- ❌ `node_modules/`
- ❌ `dist/` or `build/`
- ❌ `.vite/` or `.cache/`

**ONLY** work in:
- ✅ `PWA/src/index.css`
- ✅ `PWA/tailwind.config.js`
- ✅ `PWA/src/` CSS/styling files

---

## 🎯 PROBLEMA

La aplicación NO tiene styling. Falta:

![Current state - No styling](file:///home/cheko/.gemini/antigravity/brain/96e30e44-4819-4443-a271-94afe681ee88/uploaded_image_0_1764935544199.png)
![Header without styling](file:///home/cheko/.gemini/antigravity/brain/96e30e44-4819-4443-a271-94afe681ee88/uploaded_image_1_1764935544199.png)

### Missing:
- ❌ Glassmorphic effects (backdrop-blur)
- ❌ Neon glows (box-shadow)
- ❌ Nexdom colors (gold, lime)
- ❌ Sidebar styling
- ❌ Header styling
- ❌ Background colors
- ❌ Typography

---

## 📋 DEBE IMPLEMENTAR

### 1. Tailwind Config

**Archivo**: `PWA/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexdom: {
          dark: '#0A0A0F',
          darker: '#050508',
          panel: '#13131F',
          lime: '#00FF88',
          gold: '#E6C36A',
          glass: 'rgba(255, 255, 255, 0.05)',
          'glass-border': 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-lime': '0 0 10px rgba(0, 255, 136, 0.5), 0 0 20px rgba(0, 255, 136, 0.3)',
        'neon-gold': '0 0 10px rgba(230, 195, 106, 0.5), 0 0 20px rgba(230, 195, 106, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
```

### 2. Global CSS

**Archivo**: `PWA/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-nexdom-darker text-white overflow-y-auto;
    font-feature-settings: "ss01", "ss02", "cv01", "cv02";
  }
}

@layer utilities {
  .glass-panel {
    @apply bg-nexdom-glass backdrop-blur-xl border border-nexdom-glass-border shadow-glass;
  }
  
  .glass-panel-hover {
    @apply hover:bg-white/10 hover:border-white/20 transition-all duration-300;
  }

  .text-glow-lime {
    text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
  }

  .text-glow-gold {
    text-shadow: 0 0 10px rgba(230, 195, 106, 0.5);
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

::-webkit-scrollbar-thumb {
  background: rgba(230, 195, 106, 0.3);
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(230, 195, 106, 0.6);
  border: 2px solid transparent;
  background-clip: content-box;
}
```

### 3. Header Styling

El header debe tener:
- `glass-panel` background
- Logo con glow effect
- Search bar glassmorphic
- Buttons con hover effects

```tsx
<header className="glass-panel px-8 py-6">
  {/* Logo con glow */}
  <div className="flex items-center gap-3">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 bg-nexdom-lime/20 rounded-full blur-md animate-pulse" />
      <img src={logo} className="relative w-full h-full" />
    </div>
    <h1 className="text-xl font-bold">
      NEXDOM<span className="text-nexdom-lime">OS</span>
    </h1>
  </div>
  
  {/* Search bar */}
  <div className="glass-panel px-4 py-2 rounded-full">
    <input className="bg-transparent" placeholder="Ask Nexdom..." />
  </div>
</header>
```

### 4. Sidebar Styling

El sidebar debe tener:
- `glass-panel` background
- Iconos con colores on hover
- Active state con neon glow

```tsx
<aside className="glass-panel w-20 h-full border-r border-white/10">
  <nav className="flex flex-col gap-2 p-4">
    {items.map(item => (
      <Link
        className={`
          flex flex-col items-center gap-2 p-3 rounded-xl
          transition-all duration-300
          ${isActive 
            ? 'bg-nexdom-lime/20 text-nexdom-lime border border-nexdom-lime/30 shadow-neon-lime' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }
        `}
      >
        <Icon />
        <span className="text-xs">{item.label}</span>
      </Link>
    ))}
  </nav>
</aside>
```

### 5. Page Content Styling

Todas las páginas deben usar:
- Padding adecuado
- Glass panels para sections
- Neon glows en elementos activos

```tsx
<div className="p-6">
  <h1 className="text-3xl font-bold mb-6 text-glow-gold">Zonas</h1>
  
  <section className="glass-panel p-6 rounded-2xl mb-6">
    {/* Content */}
  </section>
</div>
```

---

## 📚 REFERENCIA

**LEER**: `/home/cheko/nexdom/addon/MASTERPLAN/DESIGN-SYSTEM.md`

Este documento tiene:
- Color palette exacto
- Box-shadow patterns
- Glassmorphic effects
- Typography
- Spacing

---

## ✅ ACCEPTANCE CRITERIA

- [ ] `tailwind.config.js` con colores nexdom
- [ ] `index.css` con glass-panel utilities
- [ ] Body background: `bg-nexdom-darker`
- [ ] Header con glassmorphic effect
- [ ] Sidebar con glassmorphic effect
- [ ] Logo con neon glow (lime)
- [ ] Active nav items con neon glow
- [ ] Custom scrollbar (nexdom-gold)
- [ ] Backdrop blur visible
- [ ] No errores en console
- [ ] Build pasa (npm run build)

---

## 🧪 TESTING

```bash
npm run dev
```

Verificar:
1. Background oscuro (nexdom-darker)
2. Header con blur effect
3. Sidebar con blur effect
4. Logo con glow verde
5. Hover effects en navigation
6. Scrollbar custom (dorado)

---

## 📦 DELIVERABLES

- `PWA/tailwind.config.js` actualizado
- `PWA/src/index.css` completo
- Screenshot ANTES/DESPUÉS

---

**ESTE ES EL FIX MÁS URGENTE. SIN STYLING, LA APP NO ES USABLE.** 🚨
