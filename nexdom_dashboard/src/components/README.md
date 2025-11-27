# Documentación Técnica - Nexdom OS Componentes
*Guía para IA - Arquitectura, Patrones y Contratos de Datos*

## Índice
1. [Arquitectura General](#arquitectura-general)
2. [Componentes de Página](#componentes-de-página)
3. [Sistema de Navegación](#sistema-de-navegación)
4. [Sistema de Tarjetas](#sistema-de-tarjetas)
5. [Sistema de Iconos](#sistema-de-iconos)
6. [Sistema de Estados](#sistema-de-estados)
7. [Patrones de Datos](#patrones-de-datos)
8. [Convenciones de Estilo](#convenciones-de-estilo)
9. [Flujos de Interacción](#flujos-de-interacción)

---

## Arquitectura General

### Estructura de Directorios
```
src/
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx           # Barra superior con acciones
│   │   ├── ModuleNav.tsx        # Navegación lateral
│   │   ├── Icon.tsx            # Sistema de iconos reutilizable
│   │   ├── templates/          # Plantillas de componentes
│   │   │   ├── GadgetCard.tsx  # Tarjeta de dispositivo
│   │   │   ├── GadgetGrid.tsx  # Grid de dispositivos
│   │   │   ├── LiveStatus.tsx  # Estado en vivo
│   │   │   └── Alerts.tsx      # Sistema de alertas
│   │   ├── zones/              # Componentes de zonas
│   │   │   └── ZonesPanel.tsx  # Panel de gestión por zonas
│   │   └── account/            # Gestión de cuenta
│   │       └── AccountMenu.tsx # Menú de cuenta
│   └── ui/                     # Componentes de interfaz base
└── pages/                      # Páginas principales
    ├── Dashboard.tsx           # Página principal
    ├── Zones.tsx              # Página de zonas
    ├── Gadgets.tsx            # Página de dispositivos
    ├── Energy.tsx             # Página de energía
    ├── Security.tsx           # Página de seguridad
    ├── Scenes.tsx             # Página de escenas
    ├── Routines.tsx           # Página de rutinas
    └── VoiceAI.tsx            # Página de asistente IA
```

### Stack Tecnológico
- **Framework**: React 18 + TypeScript
- **Bundler**: Vite 7.0.0
- **Styling**: Tailwind CSS 3.4.17
- **Animaciones**: Framer Motion 11.0.8
- **Routing**: React Router DOM 6.30.1
- **Estado**: Zustand 4.4.7
- **Iconos**: Lucide React + SVGs personalizados

---

## Componentes de Página

### Contrato de Página Base
```typescript
interface PageComponent {
  // Todas las páginas deben seguir este patrón
  return (
    <div className="flex-1 min-h-full relative">
      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-nexdom-lime/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
      </div>
      
      {/* Content Container */}
      <div className="max-w-[1600px] mx-auto py-6 px-4 lg:px-8 lg:pl-32 relative z-10">
        {/* Page content here */}
      </div>
    </div>
  );
}
```

### Ejemplo de Página: Zones.tsx
```typescript
import React from 'react';
import { ZonesPanel } from '../components/dashboard/zones/ZonesPanel';

export const Zones: React.FC = () => {
  return (
    <div className="flex-1 min-h-full relative">
      {/* Background ambient effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-nexdom-lime/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto py-6 px-4 lg:px-8 lg:pl-32 relative z-10">
        <ZonesPanel />
      </div>
    </div>
  );
};
```

---

## Sistema de Navegación

### Componente: ModuleNav.tsx

#### Props y Contratos
```typescript
interface NavItem {
  path: string;           // Ruta de React Router
  iconType: 'lucide' | 'svg'; // Tipo de icono
  iconName: string;       // Nombre del icono (Lucide) o tipo (SVG)
  label: string;          // Etiqueta de navegación
}

interface ModuleNavProps {
  // No recibe props - utiliza el store global
}
```

#### Estados del Sistema
```typescript
interface NavigationState {
  isMobile: boolean;           // Detección de dispositivo móvil
  isMobileMenuOpen: boolean;   // Estado del menú móvil
  hoveredItem: string | null;  // Elemento actualmente en hover
}
```

#### Configuración de Items de Navegación
```typescript
const navItems: NavItem[] = [
  { path: '/', iconType: 'lucide', iconName: 'Home', label: 'Overview' },
  { path: '/zones', iconType: 'svg', iconName: 'zones', label: 'Zonas' },
  { path: '/gadgets', iconType: 'svg', iconName: 'gadgets', label: 'Gadgets' },
  { path: '/energy', iconType: 'svg', iconName: 'energy', label: 'Energy' },
  { path: '/security', iconType: 'svg', iconName: 'security', label: 'Security' },
  { path: '/scenes', iconType: 'lucide', iconName: 'Layers', label: 'Scenes' },
  { path: '/routines', iconType: 'lucide', iconName: 'Calendar', label: 'Routines' },
  { path: '/voice', iconType: 'svg', iconName: 'voice', label: 'Voice/AI' },
];
```

#### Interacciones Especiales
- **Desktop**: Tooltip on hover con posición absoluta
- **Mobile**: Auto-hide después de 5 segundos de inactividad
- **Gestos**: Swipe right from left edge para abrir, swipe left para cerrar

---

## Sistema de Tarjetas

### Tarjeta de Dispositivo: GadgetCard.tsx

#### Props y Contratos
```typescript
interface GadgetProps {
  id: string;
  name: string;
  model: string;
  type: 'sensor' | 'camera' | 'actuator' | 'switch' | 'light' | 'security' | 
        'patio' | 'accessory' | 'voice' | 'thermostat' | 'dimmer' | 'lock' | 
        'cover' | 'remote' | 'button';
  iconPath: string;        // URL del icono SVG
  status: string;          // Estado textual
  isActive?: boolean;      // Estado booleano activo/inactivo
  value?: string;          // Valor actual (opcional)
  category?: string;       // Categoría para agrupación
  onPrimaryAction?: () => void;  // Acción principal (toggle)
  onSecondaryAction?: () => void; // Acción secundaria (settings)
}
```

#### Esquema de Colores por Tipo
```typescript
const colorSchemes = {
  sensor: {
    text: 'text-nexdom-gold',
    border: 'border-nexdom-gold/30',
    bg: 'bg-nexdom-gold/10',
    glow: 'shadow-[0_0_20px_rgba(230,195,106,0.2)]',
    activeBg: 'bg-nexdom-gold'
  },
  camera: {
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    activeBg: 'bg-blue-500'
  },
  // ... otros tipos
};
```

#### Funcionalidades
- **Estados Dinámicos**: Active/Inactive con diferentes esquemas de color
- **Iconos Dinámicos**: Coloreado via CSS mask-image
- **Animaciones**: Hover scale, tap scale, layout animations
- **Acciones**: Botón primario (Power) y secundario (Settings)

### Panel de Zonas: ZonesPanel.tsx

#### Estructura de Datos de Zona
```typescript
interface Zone {
  id: string;
  name: string;
  image: string;           // URL de imagen de fondo
  gadgets: GadgetProps[];  // Array de dispositivos en la zona
}

const MOCK_ZONES: Zone[] = [
  {
    id: 'kitchen',
    name: 'Cocina',
    image: '/src/assets/images/kitchen.jpg',
    gadgets: [
      { 
        id: 'light-kitchen-1', 
        name: 'Luz Principal', 
        model: 'Philips Hue', 
        type: 'light', 
        status: 'On', 
        value: '100%', 
        iconPath: '', 
        isActive: true 
      },
      // ... más gadgets
    ]
  },
  // ... más zonas
];
```

#### Estados de Interacción
```typescript
interface ZoneState {
  expandedZone: string | null;  // ID de zona expandida o null
}
```

#### Comportamiento
- **Expand/Collapse**: Al hacer clic en zona, se expande/colapsa
- **Animaciones**: Altura automática con AnimatePresence
- **Contenido**: Grid responsivo de GadgetCard en zona expandida
- **Métricas**: Conteo de dispositivos y dispositivos activos

---

## Sistema de Iconos

### Componente: Icon.tsx

#### Props y Contratos
```typescript
interface IconProps {
  lucideIcon?: keyof typeof LucideIcons;  // Icono de Lucide React
  svgIcon?: 'energy' | 'security' | 'voice' | 'gadgets' | 'zones'; // SVG predefinido
  svgName?: string;                       // Nombre de SVG dinámico
  size?: 'sm' | 'md' | 'lg';             // Tamaño del icono
  className?: string;                     // Clases adicionales
  isActive?: boolean;                     // Estado activo
  isHovering?: boolean;                   // Estado hover
}
```

#### Configuración de Tamaños
```typescript
const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8'
};
```

#### Esquema de Colores de Iconos
```typescript
const getColorClasses = () => {
  if (isActive) {
    return 'text-nexdom-lime drop-shadow-[0_0_5px_rgba(0,255,136,0.8)] brightness-125';
  }
  if (isHovering) {
    return 'text-white';
  }
  return 'text-gray-400';  // Estado inactivo
};
```

#### Técnica de Coloreado de SVG
```css
/* Para SVG dinámicos */
background-image: url(${dynamicSvgSource});
background-size: contain;
background-repeat: no-repeat;
background-position: center;
mask-image: url(${dynamicSvgSource});
mask-size: contain;
mask-repeat: no-repeat;
mask-position: center;
-webkit-mask-image: url(${dynamicSvgSource});
-webkit-mask-size: contain;
-webkit-mask-repeat: no-repeat;
-webkit-mask-position: center;
```

### Carga Dinámica de SVGs
```typescript
// Carga de todos los SVGs en assets/icons
const iconModules = import.meta.glob('../../../assets/icons/*.svg', { 
  eager: true, 
  as: 'url' 
});

const getIconPath = (name: string): string => {
  const key = `../../../assets/icons/${name}.svg`;
  return iconModules[key] || '';
};
```

---

## Sistema de Estados

### Estados Visuales

#### Estados de Navegación
- **Inactivo**: `text-gray-400` - Color gris estándar
- **Hover**: `text-white` - Color blanco al pasar mouse
- **Activo**: `text-nexdom-lime` + efectos de brillo y sombra

#### Estados de Tarjetas
- **Inactivo**: Borde blanco sutil, fondo transparente
- **Hover**: Escala 1.02, elevación -4px
- **Activo**: Borde de color según tipo, glow effect, fondo semi-transparente

#### Estados de Botones
- **Default**: Fondo blanco/5, borde blanco/10
- **Hover**: Fondo blanco/10, texto blanco
- **Active**: Fondo con color del tema, texto negro

### Animaciones y Transiciones

#### Framer Motion Patterns
```typescript
// Entrada de componentes
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
>

// Hover interactions
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  whileTap={{ scale: 0.98 }}
>

// Layout animations
<motion.div layout />
```

#### Duraciones de Transición
- **Colores**: `transition-all duration-300`
- **Transformaciones**: `transition-all duration-500`
- **Layout**: `transition={{ duration: 0.3, ease: "easeInOut" }}`

---

## Patrones de Datos

### Store Global: nexdomStore.ts

#### Estructura del Estado
```typescript
interface NexdomState {
  devices: Device[];
  rooms: Room[];
  alerts: Alert[];
  scenes: Scene[];
  routines: Routine[];
  energy: EnergyStats;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
}
```

#### Tipos de Datos
```typescript
interface Device {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'lock' | 'camera' | 'sensor';
  room: string;
  status: 'on' | 'off' | 'online' | 'offline' | 'locked' | 'unlocked';
  value?: number | string;
  battery?: number;
  lastUpdated: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  message: string;
  timestamp: string;
  read: boolean;
}
```

#### Actions del Store
```typescript
// Manipulación de dispositivos
toggleDevice: (id: string) => void;
setDeviceValue: (id: string, value: any) => void;

// Gestión de escenas y rutinas
activateScene: (id: string) => void;
toggleRoutine: (id: string) => void;

// Gestión de alertas
markAlertRead: (id: string) => void;
addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void;

// Estado de UI
toggleMobileMenu: () => void;
setMobileMenuOpen: (isOpen: boolean) => void;
```

---

## Convenciones de Estilo

### Variables de Color Custom
```css
/* En tailwind.config.js */
colors: {
  'nexdom-lime': '#00FF88',
  'nexdom-gold': '#E6C36A',
  'nexdom-glass': 'rgba(255, 255, 255, 0.05)',
  'nexdom-panel': 'rgba(26, 26, 26, 0.95)',
}
```

### Clases de Estilo Reutilizables

#### Glassmorphism
```css
.glass-panel {
  @apply bg-white/5 border border-white/10 backdrop-blur-md;
  border-radius: 2rem; /* 32px */
}
```

#### Sombras y Efectos
```css
/* Glow effects para elementos activos */
.shadow-nexdom-lime {
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
}

/* Drop shadows para iconos activos */
.drop-shadow-nexdom {
  filter: drop-shadow(0 0 5px rgba(0,255,136,0.8));
}
```

#### Espaciado y Layout
```css
/* Contenedor principal de páginas */
.page-container {
  @apply max-w-[1600px] mx-auto py-6 px-4 lg:px-8 lg:pl-32;
}

/* Grid responsive para tarjetas */
.card-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
}
```

### Responsive Design

#### Breakpoints
- **Mobile**: `< 1024px` (gestos, menú lateral móvil)
- **Desktop**: `>= 1024px` (sidebar fijo, tooltips)

#### Patrones Responsive
```typescript
// Detección de media queries
const isMobile = useMedia('(max-width: 1024px)', false);

// Clases condicionales
<div className={`
  ${isMobile ? 'mobile-classes' : 'desktop-classes'}
`}>
```

---

## Flujos de Interacción

### Flujo de Navegación

#### Desktop
1. Usuario hace hover sobre item de navegación
2. Aparece tooltip con label del item
3. Click navega a ruta correspondiente
4. Se actualiza indicador visual activo

#### Mobile
1. Usuario hace swipe desde borde izquierdo (0-50px)
2. Menú se desliza desde la izquierda
3. Auto-hide después de 5 segundos de inactividad
4. Swipe hacia la izquierda cierra el menú

### Flujo de Tarjetas de Dispositivo

#### Estados y Transiciones
1. **Carga**: Animación de entrada con opacity + y-offset
2. **Hover**: Scale 1.02, elevación -4px, glow effect
3. **Click Primary**: Toggle estado activo/inactivo + actualización de status
4. **Click Secondary**: Abrir modal de configuraciones

#### Gestión de Estado
```typescript
const handleToggle = (id: string) => {
  setGadgets(prev => prev.map(gadget => {
    if (gadget.id === id) {
      const newActive = !gadget.isActive;
      let newStatus = gadget.status;
      
      // Lógica específica por tipo de dispositivo
      if (gadget.type === 'lock') 
        newStatus = newActive ? 'Locked' : 'Unlocked';
      else if (gadget.type === 'camera') 
        newStatus = newActive ? 'Live' : 'Standby';
      // ... más lógica

      return { ...gadget, isActive: newActive, status: newStatus };
    }
    return gadget;
  }));
};
```

### Flujo de Expansión de Zonas

#### Estados
- **Collapsed**: Tarjeta con imagen de fondo y métricas básicas
- **Expanded**: Altura automática con grid de dispositivos internos
- **Transition**: Animación suave de altura con AnimatePresence

#### Lógica de Control
```typescript
const [expandedZone, setExpandedZone] = useState<string | null>(null);

const toggleZone = (id: string) => {
  setExpandedZone(expandedZone === id ? null : id);
};

// Renderizado condicional con AnimatePresence
<AnimatePresence>
  {expandedZone === zone.id && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Contenido expandido */}
    </motion.div>
  )}
</AnimatePresence>
```

### Flujo de Modales

#### Estructura de Modal Base
```typescript
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
          >
            {/* Modal content */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

#### Estados de Modales
- **Closed**: No renderizado
- **Opening**: Animación de entrada (opacity + scale + y-offset)
- **Open**: Visible y interactivo
- **Closing**: Animación de salida

---

## Configuración de Build y Deploy

### Scripts de npm
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Configuración de Vite
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [youwareVitePlugin(), react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    sourcemap: true,
  },
});
```

### Variables de Entorno
```env
# Configuración local
VITE_APP_TITLE=Nexdom OS
VITE_API_URL=http://localhost:3000
```

---

## Patrones de Testing y QA

### Estructura de Tests Sugerida
```
src/
├── components/
│   ├── __tests__/
│   │   ├── GadgetCard.test.tsx
│   │   ├── ModuleNav.test.tsx
│   │   └── ZonesPanel.test.tsx
│   └── utils/
│       └── test-utils.tsx
```

### Ejemplo de Test Unitario
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { GadgetCard } from '../GadgetCard';

describe('GadgetCard', () => {
  const mockGadget = {
    id: 'test-1',
    name: 'Test Device',
    model: 'Test Model',
    type: 'light' as const,
    iconPath: '/test-icon.svg',
    status: 'Off',
    isActive: false,
  };

  it('renders gadget information correctly', () => {
    render(<GadgetCard {...mockGadget} />);
    
    expect(screen.getByText('Test Device')).toBeInTheDocument();
    expect(screen.getByText('Test Model')).toBeInTheDocument();
    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('calls onPrimaryAction when power button is clicked', () => {
    const onPrimaryAction = jest.fn();
    render(<GadgetCard {...mockGadget} onPrimaryAction={onPrimaryAction} />);
    
    fireEvent.click(screen.getByRole('button', { name: /activate/i }));
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });
});
```

---

## Notas para IA - Ajustes Finos

### Métricas de Performance
- **Bundle Size**: ~1.3MB (optimizable con code splitting)
- **First Paint**: < 100ms
- **Interactive**: < 200ms

### Puntos de Optimización
1. **Lazy Loading**: Implementar `React.lazy()` para rutas
2. **Code Splitting**: Separar vendor bundles
3. **Image Optimization**: WebP format para imágenes de zona
4. **Icon Bundling**: Tree shaking para Lucide icons

### Consideraciones de Accesibilidad
- **ARIA Labels**: Añadir para todos los controles interactivos
- **Focus Management**: Implementar focus trap en modales
- **Keyboard Navigation**: Soporte completo para navegación por teclado
- **Screen Readers**: Texto alternativo descriptivo

### Mejoras Sugeridas para IA
1. **Theming System**: Sistema de temas dinámico
2. **Animation Library**: Integrar Reactbits para animaciones avanzadas
3. **Backend Integration**: Conectar con Youware Backend para datos reales
4. **Real-time Updates**: WebSocket para actualizaciones en tiempo real
5. **PWA Features**: Service worker para funcionalidad offline

---

*Documentación generada para Nexdom OS - Smart Home Dashboard v1.0*
*Fecha: 2025-11-27*
*Propósito: Guía técnica para IA y desarrolladores*
