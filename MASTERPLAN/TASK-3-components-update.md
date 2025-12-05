# TASK 3: Component Updates + Advanced Controls

**Agent**: AI-3  
**Priority**: 🟡 HIGH  
**Duration**: 8-10 horas  
**Dependencies**: TASK 1 complete

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

Actualizar componentes UI para trabajar con @hakit/core entities. Implementar controles avanzados (climate, media, camera) usando @hakit/components cuando ayude.

---

## 📋 Componentes a Actualizar

1. **GadgetCard** - Tarjeta individual de dispositivo
2. **DeviceDetailsModal** - Modal con controles avanzados
3. **LiveStatus** - Status bar en tiempo real
4. **Favorites** - Sistema de favoritos

---

## 📂 GADGET CARD

### Archivo: `PWA/src/components/GadgetCard.tsx`

**Objetivo**: Card universal para ANY entity type.

```typescript
import { useEntity } from '@hakit/core';
import type { EntityName } from '@hakit/core';
import { motion } from 'framer-motion';
import { Power, Settings, Star } from 'lucide-react';
import { useFavorites } from '@/store/favoritesStore';

interface GadgetCardProps {
  entityId: EntityName;
  onSettingsClick?: () => void;
}

export function GadgetCard({ entityId, onSettingsClick }: GadgetCardProps) {
  const entity = useEntity(entityId);
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const domain = entityId.split('.')[0];
  const isOn = entity.state !== 'off' && entity.state !== 'unavailable';
  
  const handleToggle = () => {
    // @hakit provides smart toggle for all domains
    entity.service.toggle();
  };
  
  return (
    <motion.div
      layout
      className={`
        relative p-4 rounded-2xl backdrop-blur-lg
        ${isOn ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30' : 'bg-white/5 border-white/10'}
        border transition-all duration-300
      `}
    >
      {/* Favorite Star */}
      <button
        onClick={() => toggleFavorite(entityId)}
        className="absolute top-2 right-2 p-1"
      >
        <Star
          size={16}
          className={isFavorite(entityId) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
        />
      </button>
      
      {/* Device Info */}
      <div className="mb-3">
        <EntityIcon domain={domain} state={entity.state} />
        <h4 className="text-sm font-semibold mt-2">
          {entity.attributes.friendly_name}
        </h4>
        <p className="text-xs text-gray-400">{entity.state}</p>
      </div>
      
      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleToggle}
          className={`
            flex-1 p-2 rounded-lg flex items-center justify-center gap-2
            ${isOn ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300'}
          `}
        >
          <Power size={16} />
          {isOn ? 'On' : 'Off'}
        </button>
        
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg bg-white/10"
          >
            <Settings size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Icon helper
function EntityIcon({ domain, state }) {
  // Map domain to Lucide icon
  // light → Lightbulb
  // switch → ToggleRight
  // climate → Thermometer
  // etc.
}
```

---

## 📂 DEVICE DETAILS MODAL

### Archivo: `PWA/src/components/DeviceDetailsModal.tsx`

**Objetivo**: Modal con controles específicos por domain.

```typescript
import { useEntity } from '@hakit/core';
import { ClimateCard, MediaPlayerCard, CameraCard } from '@hakit/components';
import { Dialog } from '@/components/ui/Dialog';

interface Props {
  entityId: EntityName;
  isOpen: boolean;
  onClose: () => void;
}

export function DeviceDetailsModal({ entityId, isOpen, onClose }: Props) {
  const entity = useEntity(entityId);
  const domain = entityId.split('.')[0];
  
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          {entity.attributes.friendly_name}
        </h2>
        
        {/* Renderizar control específico por domain */}
        {domain === 'climate' && <ClimateControls entityId={entityId} />}
        {domain === 'media_player' && <MediaPlayerControls entityId={entityId} />}
        {domain === 'camera' && <CameraView entityId={entityId} />}
        {domain === 'light' && <LightControls entityId={entityId} />}
        
        {/* Fallback: generic controls */}
        {!['climate', 'media_player', 'camera', 'light'].includes(domain) && (
          <GenericControls entityId={entityId} />
        )}
      </div>
    </Dialog>
  );
}
```

### Climate Controls

```typescript
function ClimateControls({ entityId }: { entityId: EntityName }) {
  const entity = useEntity(entityId);
  
  // Usar @hakit/components si es más rápido
  return <ClimateCard entity={entityId} />;
  
  // O custom:
  const [temp, setTemp] = useState(entity.attributes.temperature);
  
  const handleTempChange = (newTemp: number) => {
    entity.service.setTemperature({ temperature: newTemp });
  };
  
  return (
    <div>
      <h3>Clima</h3>
      <TempSlider value={temp} onChange={handleTempChange} />
      <ModeSelector entity={entity} />
      <FanSelector entity={entity} />
    </div>
  );
}
```

### Light Controls (Brightness + Color)

```typescript
function LightControls({ entityId }: { entityId: EntityName }) {
  const entity = useEntity(entityId);
  const supportsBrightness = 'brightness' in (entity.attributes || {});
  const supportsColor = 'rgb_color' in (entity.attributes || {});
  
  return (
    <div className="space-y-4">
      {supportsBrightness && (
        <div>
          <label>Brillo</label>
          <input
            type="range"
            min="0"
            max="255"
            value={entity.attributes.brightness || 0}
            onChange={(e) => {
              entity.service.turnOn({ brightness: parseInt(e.target.value) });
            }}
          />
        </div>
      )}
      
      {supportsColor && (
        <ColorWheel
          color={entity.attributes.rgb_color}
          onChange={(rgb) => {
            entity.service.turnOn({ rgb_color: rgb });
          }}
        />
      )}
    </div>
  );
}
```

---

## 📂 LIVE STATUS

### Archivo: `PWA/src/components/LiveStatus.tsx`

**Objetivo**: Mostrar resumen de dispositivos activos.

```typescript
import { useEntities } from '@hakit/core';

export function LiveStatus() {
  const lights = useEntities({ domain: 'light' });
  const switches = useEntities({ domain: 'switch' });
  
  const lightsOn = lights.filter(id => {
    const entity = useEntity(id);
    return entity.state === 'on';
  }).length;
  
  const switchesOn = switches.filter(id => {
    const entity = useEntity(id);
    return entity.state === 'on';
  }).length;
  
  return (
    <div className="glass-panel p-4">
      <h3>En Vivo</h3>
      <div className="grid grid-cols-2 gap-4">
        <StatBadge label="Luces" value={lightsOn} total={lights.length} />
        <StatBadge label="Switches" value={switchesOn} total={switches.length} />
      </div>
    </div>
  );
}
```

---

## 📂 FAVORITES STORE

### Archivo: `PWA/src/store/favoritesStore.ts`

**Migrar de HomeAssistant.tsx a Zustand store separado**:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesStore {
  favorites: string[];
  toggleFavorite: (entityId: string) => void;
  isFavorite: (entityId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavorites = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      
      toggleFavorite: (entityId) => {
        set((state) => ({
          favorites: state.favorites.includes(entityId)
            ? state.favorites.filter(id => id !== entityId)
            : [...state.favorites, entityId]
        }));
      },
      
      isFavorite: (entityId) => {
        return get().favorites.includes(entityId);
      },
      
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'nexdom-favorites',
    }
  )
);
```

**Uso**:
```typescript
const { favorites, toggleFavorite, isFavorite } = useFavorites();
```

---

## 🎨 @hakit/components Cuando Ayude

**Usar para**:
- `ClimateCard` - Controles de clima complejos
- `MediaPlayerCard` - Media player con playlist
- `CameraCard` - Streaming de cámara
- `WeatherCard` - Clima con forecast

**NO usar para**:
- Lights - Nuestra UI es más bonita
- Switches - Muy simple
- Sensors - Custom display mejor

---

## ✅ Acceptance Criteria

- [ ] GadgetCard funciona con ANY domain
- [ ] Toggle works para lights, switches, locks, covers
- [ ] DeviceDetailsModal abre y cierra
- [ ] Climate controls cambian temperatura
- [ ] Light brightness slider funciona
- [ ] Favorites persisten entre refreshes
- [ ] LiveStatus muestra datos en tiempo real

---

## 🧪 Testing

### Test Matrix

| Domain | Card | Modal | Service Call |
|--------|------|-------|--------------|
| light | ✅ | ✅ | toggle, brightness |
| switch | ✅ | ✅ | toggle |
| climate | ✅ | ✅ | setTemp, setMode |
| lock | ✅ | ✅ | lock, unlock |
| cover | ✅ | ✅ | open, close |
| camera | ✅ | ✅ | snapshot |

---

## 📦 Deliverables

- ✅ `PWA/src/components/GadgetCard.tsx`
- ✅ `PWA/src/components/DeviceDetailsModal.tsx`
- ✅ `PWA/src/components/LiveStatus.tsx`
- ✅ `PWA/src/store/favoritesStore.ts`
- ✅ Video demo de cada control

---

**LET'S BUILD! 🔨**
