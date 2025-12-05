# 📐 LAYOUT & NAVIGATION - Especificación

**EXTRAÍDO DE**: Screenshots del dashboard actual  
**PARA**: Implementar en TASK-2, TASK-3, TASK-4

---

## 📱 Responsive Layout Structure

### Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────┐
│ [Header - Always Visible]                                │
├────┬─────────────────────────────────────────────────────┤
│    │ [Alerts - Top Banners with X to close]              │
│ S  ├─────────────────────────────────────────────────────┤
│ I  │                                                      │
│ D  │  Main Content Area                                  │
│ E  │  (Dashboard, Zones, Gadgets, etc.)                  │
│ B  │                                                      │
│ A  │                                                      │
│ R  │                                                      │
│    │                                                      │
└────┴─────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌──────────────────────────────────┐
│ [Header - Always Visible]        │
├──────────────────────────────────┤
│ [Alerts - Top Banners]           │
├──────────────────────────────────┤
│                                  │
│  Main Content (Full Width)       │
│  Sidebar HIDDEN by default       │
│                                  │
│  Tap "N" logo or Swipe →        │
│  to show sidebar overlay         │
│                                  │
└──────────────────────────────────┘

Con sidebar abierto:
┌──────────────────────────────────┐
│┌────┐ [Header]                   │
││ S  │                             │
││ I  │  Content dimmed             │
││ D  │  (overlay)                  │
││ E  │                             │
││ B  │  Tap outside to close       │
││ A  │                             │
││ R  │                             │
│└────┘                             │
└──────────────────────────────────┘
```

---

## 🔔 Alert System

### Top Banners (Home Page)

![Alert Banners](file:///home/cheko/.gemini/antigravity/brain/96e30e44-4819-4443-a271-94afe681ee88/uploaded_image_1764926733332.png)

**Ubicación**: Justo debajo del header, arriba de todo el contenido

**Características**:
- Glassmorphic cards
- Color según tipo (gold = warning, blue = info, red = critical)
- Icono a la izquierda
- Mensaje principal + detalle
- Botón X para cerrar (dismiss)
- Se apilan verticalmente
- Animación: Slide down al aparecer, fade out al cerrar

**Código Base**:
```tsx
<div className="alerts-container px-6 pt-4 space-y-3">
  {alerts.map(alert => (
    <motion.div
      key={alert.id}
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`
        flex items-center justify-between p-4 rounded-xl
        glass-panel border
        ${alert.type === 'warning' ? 'border-nexdom-gold/30 bg-nexdom-gold/10' : ''}
        ${alert.type === 'info' ? 'border-blue-500/30 bg-blue-500/10' : ''}
        ${alert.type === 'critical' ? 'border-red-500/30 bg-red-500/10' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        <AlertIcon type={alert.type} />
        <div>
          <h4 className="font-bold text-sm">{alert.title}</h4>
          <p className="text-xs text-gray-400">{alert.message}</p>
        </div>
      </div>
      <button
        onClick={() => dismissAlert(alert.id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        ✕
      </button>
    </motion.div>
  ))}
</div>
```

### Bell Modal (Header)

**Trigger**: Click en campana en header

**Contenido**: Las MISMAS alertas que los banners de arriba

**Diferencias**:
- Modal centrado
- Scroll si hay muchas alertas
- Título: "Alertas del Sistema"
- Puede tener filtros (Todas, Warnings, Info, Critical)

**Código Modal**:
```tsx
<Modal isOpen={isAlertsModalOpen} onClose={closeModal}>
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Alertas del Sistema</h2>
    
    {/* Same alerts as top banners */}
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
      
      {alerts.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          Sin alertas activas
        </div>
      )}
    </div>
  </div>
</Modal>
```

---

## 🧭 Sidebar Navigation

### Menú Vertical

![Sidebar Mobile](file:///home/cheko/.gemini/antigravity/brain/96e30e44-4819-4443-a271-94afe681ee88/uploaded_image_1764926764960.png)

**Items del Menú** (en orden):
1. **Overview** - Home/Dashboard principal
2. **Zonas** - Áreas/habitaciones
3. **Gadgets** - Dispositivos
4. **Energy** - Consumo energético
5. **Security** - Seguridad (cámaras, locks)
6. **Scenes** - Escenas
7. **Routines** - Automatizaciones
8. **Battery** - Estado de baterías
9. **VoiceAI** - Chat/Voice assistant

**Estructura Visual**:
```tsx
<nav className="flex flex-col gap-2 p-4">
  {menuItems.map(item => (
    <Link
      key={item.path}
      to={item.path}
      className={`
        flex flex-col items-center gap-2 p-3 rounded-xl
        transition-all duration-300
        ${isActive 
          ? 'bg-nexdom-lime/20 text-nexdom-lime border border-nexdom-lime/30' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <item.Icon size={24} />
      <span className="text-xs font-medium">{item.label}</span>
    </Link>
  ))}
</nav>
```

### Desktop Behavior

- **Siempre visible**
- Width fijo: ~80px
- Iconos + labels pequeños
- Posición: fixed left
- Background: glassmorphic panel

### Mobile Behavior (< 768px)

**Estado Default**: OCULTO
- Off-canvas (fuera de pantalla)
- Content usa full width

**Abrir Sidebar**:
1. **Tap en logo "N"** (logo de NEXDOM en header)
2. **Swipe de izquierda a derecha** (gesture)

**Cuando está abierto**:
- Overlay oscuro sobre contenido (40% opacity)
- Sidebar slide-in desde izquierda
- Animación smooth (300ms ease-out)
- Width: 280px

**Cerrar Sidebar**:
1. Tap en overlay oscuro
2. Swipe de derecha a izquierda
3. Tap en botón X (si hay)

**Código Mobile Toggle**:
```tsx
// Store
const useSidebarStore = create((set) => ({
  isOpen: false,
  toggle: () => set(state => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
}));

// Header - Logo onClick
<div 
  onClick={() => {
    if (window.innerWidth < 768) {
      sidebarStore.toggle();
    }
  }}
  className="cursor-pointer"
>
  <Logo />
</div>

// Sidebar Component
<AnimatePresence>
  {(isMobile && isOpen) || !isMobile ? (
    <>
      {/* Overlay (mobile only) */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}
      
      {/* Sidebar */}
      <motion.aside
        initial={isMobile ? { x: -280 } : false}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`
          fixed top-0 left-0 h-full
          ${isMobile ? 'w-[280px] z-50' : 'w-20'}
          glass-panel border-r border-white/10
        `}
      >
        {/* Menu items */}
      </motion.aside>
    </>
  ) : null}
</AnimatePresence>

// Swipe Gesture (usando framer-motion)
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0.2}
  onDragEnd={(e, { offset, velocity }) => {
    if (offset.x > 100 && velocity.x > 0) {
      openSidebar();
    } else if (offset.x < -100 && velocity.x < 0) {
      closeSidebar();
    }
  }}
>
  {/* Content */}
</motion.div>
```

---

## 📱 Header Structure

### Desktop Header

```
[Logo + "NEXDOM OS"]  [Search Bar]  [PWA Install] [Bell] [Mic] [|] [User Menu]
```

### Mobile Header

```
[Logo]                              [Bell] [Mic] [User]
```

**Logo en Mobile**:
- Tap en "N" → Toggle sidebar
- Visual feedback (scale animation)

---

## 🏠 Home Page Layout

### Sections (en orden):

1. **Alerts** (si hay)
2. **Favoritos**
   - Section header con badge "SYSTEM ONLINE"
   - Grid de devices favoritos
   - Empty state si no hay favoritos
3. **Weather Widget** (optional, a la derecha en desktop)
4. **Quick Stats** (optional)
5. **Recent Activity** (optional)

### Grid Responsive

```css
/* Favoritos grid */
.favorites-grid {
  grid-template-columns: repeat(1, 1fr);  /* Mobile */
}

@media (min-width: 640px) {
  .favorites-grid {
    grid-template-columns: repeat(2, 1fr);  /* Tablet */
  }
}

@media (min-width: 1024px) {
  .favorites-grid {
    grid-template-columns: repeat(3, 1fr);  /* Desktop */
  }
}

@media (min-width: 1280px) {
  .favorites-grid {
    grid-template-columns: repeat(4, 1fr);  /* Large Desktop */
  }
}
```

---

## ✅ Checklist de Implementación

Layout & Navigation:

- [ ] Header fixed top con glassmorphic effect
- [ ] Alerts system (top banners + bell modal)
- [ ] Sidebar navigation con 9 items
- [ ] Sidebar desktop: always visible, 80px width
- [ ] Sidebar mobile: hidden by default
- [ ] Toggle sidebar con tap en logo "N"
- [ ] Swipe gesture para abrir/cerrar sidebar
- [ ] Overlay oscuro cuando sidebar abierto (mobile)
- [ ] Animaciones smooth (Framer Motion)
- [ ] Responsive grid para favorites
- [ ] Empty states (sin favoritos, sin alertas)

---

## 🎨 Visual Specs

### Sidebar
```css
width: 80px (desktop) / 280px (mobile when open)
background: glass-panel
backdrop-blur: 12px
border-right: 1px solid rgba(255,255,255,0.1)
```

### Alert Banners
```css
padding: 16px
border-radius: 12px
gap: 12px between alerts
max-width: 600px (desktop, centered under header)
```

### Header
```css
height: 80px
padding: 24px 32px (desktop) / 16px (mobile)
backdrop-blur: 12px
position: fixed
z-index: 50
```

---

**Estos layouts son fundamentales para la UX del dashboard.**

**Implementar exactamente como se especifica, especialmente mobile behavior.**
