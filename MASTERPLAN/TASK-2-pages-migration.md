# TASK 2: Page Migrations (TODAS LAS PÁGINAS)

**Agent**: AI-2  
**Priority**: 🟡 HIGH  
**Duration**: 12-16 horas (expandido)  
**Dependencies**: TASK 1 complete

---

## 🎯 Objetivo

Migrar **TODAS** las páginas de nexdom_dashboard a @hakit/core hooks. MANTENER UI custom (glassmorphism, neon), SOLO cambiar data fetching.

---

## 📋 Páginas a Migrar (10 TOTAL)

### Core Pages
1. **Dashboard** - Vista principal con stats y resumen
2. **Zones** - Áreas/habitaciones organizadas
3. **Gadgets** - Lista de todos los dispositivos

### Feature Pages
4. **Energy** - Consumos de energía y estadísticas
5. **Scenes** - Escenas/ambientes configurados
6. **Routines** - Automatizaciones y rutinas
7. **Battery** - Dispositivos con batería (no conectados a luz)
8. **Security** - Panel de seguridad (cámaras, locks, alarmas)

### Util Pages
9. **VoiceAI** - Chat/Voice AI (estructura base, no implementado aún)
10. **Debug** - Panel de debugging y diagnostics

---

## 📂 DASHBOARD PAGE

### Archivo: `PWA/src/pages/Dashboard.tsx`

**Antes** (nexdom_dashboard):
```typescript
const { entities, zones, isConnected } = useHomeAssistant();
```

**Después** (@hakit/core):
```typescript
import { useHass, useAreas, useEntity } from '@hakit/core';

export function Dashboard() {
  const { connection } = useHass();
  const areas = useAreas();
  
  // Get stats
  const totalLights = useEntity({ domain: 'light' }).filter(e => e.state === 'on').length;
  const totalDevices = Object.keys(useHass().entities).length;
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Tu UI glassmorphic custom aquí */}
      <StatsCard title="Dispositivos" value={totalDevices} />
      <StatsCard title="Luces Encendidas" value={totalLights} />
      
      {/* Areas grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map(area => (
          <AreaCard key={area.area_id} area={area} />
        ))}
      </div>
    </div>
  );
}
```

**Componentes a mantener**:
- `StatsCard` - Mantener tal cual
- `AreaCard` - Solo cambiar props de `zone` a `area`

---

## 📂 ZONES PAGE

### Archivo: `PWA/src/pages/Zones.tsx`

**Antes**:
```typescript
const { zones } = useHomeAssistant();
zones.map(zone => <ZoneCard zone={zone} />)
```

**Después**:
```typescript
import { useAreas, useEntities } from '@hakit/core';

export function Zones() {
  const areas = useAreas();
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Zonas</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {areas.map(area => {
          const entities = useEntities({ area: area.area_id });
          
          return (
            <ZoneCard
              key={area.area_id}
              area={area}
              entities={entities}
            />
          );
        })}
      </div>
    </div>
  );
}
```

**ZoneCard Component**:
```typescript
interface ZoneCardProps {
  area: Area;
  entities: EntityName[];
}

function ZoneCard({ area, entities }: ZoneCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <motion.div
      className="glassmorphic-card p-6 rounded-2xl"
      onClick={() => setExpanded(!expanded)}
    >
      <h3>{area.name}</h3>
      <p>{entities.length} dispositivos</p>
      
      {expanded && (
        <div className="mt-4 space-y-2">
          {entities.map(entityId => (
            <EntityRow key={entityId} entityId={entityId} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
```

---

## 📂 GADGETS PAGE

### Archivo: `PWA/src/pages/Gadgets.tsx`

**Lógica**:
```typescript
import { useEntities, useEntity } from '@hakit/core';

export function Gadgets() {
  const allDevices = useEntities();
  
  // Group by domain
  const byDomain = {
    lights: allDevices.filter(e => e.split('.')[0] === 'light'),
    switches: allDevices.filter(e => e.split('.')[0] === 'switch'),
    climates: allDevices.filter(e => e.split('.')[0] === 'climate'),
    // ... etc
  };
  
  return (
    <div>
      <Section title="Luces" entities={byDomain.lights} />
      <Section title="Interruptores" entities={byDomain.switches} />
      <Section title="Clima" entities={byDomain.climates} />
    </div>
  );
}

function Section({ title, entities }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {entities.map(entityId => (
          <GadgetCard key={entityId} entityId={entityId} />
        ))}
      </div>
    </div>
  );
}
```

---

## 📂 ENERGY PAGE

### Archivo: `PWA/src/pages/Energy.tsx`

```typescript
import { useEntities, useEntity } from '@hakit/core';

export function Energy() {
  // Get energy sensors
  const energySensors = useEntities({ domain: 'sensor' })
    .filter(id => id.includes('energy') || id.includes('power'));
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Consumo de Energía</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {energySensors.map(sensorId => {
          const sensor = useEntity(sensorId);
          return (
            <EnergySensorCard
              key={sensorId}
              sensor={sensor}
            />
          );
        })}
      </div>
      
      {/* TODO: Agregar gráficas con historia */}
      {/* Usar useHistory() cuando sea necesario */}
    </div>
  );
}
```

---

## 📂 SCENES PAGE

### Archivo: `PWA/src/pages/Scenes.tsx`

```typescript
import { useEntities, useService } from '@hakit/core';

export function Scenes() {
  const scenes = useEntities({ domain: 'scene' });
  const callService = useService();
  
  const activateScene = (sceneId: string) => {
    callService({
      domain: 'scene',
      service: 'turn_on',
      serviceData: { entity_id: sceneId }
    });
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Escenas</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {scenes.map(sceneId => {
          const scene = useEntity(sceneId);
          return (
            <SceneCard
              key={sceneId}
              scene={scene}
              onActivate={() => activateScene(sceneId)}
            />
          );
        })}
      </div>
    </div>
  );
}
```

---

## 📂 ROUTINES PAGE (AUTOMATIONS)

### Archivo: `PWA/src/pages/Routines.tsx`

```typescript
import { useEntities, useEntity } from '@hakit/core';

export function Routines() {
  const automations = useEntities({ domain: 'automation' });
  const scripts = useEntities({ domain: 'script' });
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Automatizaciones</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Automatizaciones</h2>
        <div className="space-y-4">
          {automations.map(autoId => {
            const automation = useEntity(autoId);
            return (
              <AutomationCard
                key={autoId}
                automation={automation}
              />
            );
          })}
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">Scripts</h2>
        <div className="space-y-4">
          {scripts.map(scriptId => {
            const script = useEntity(scriptId);
            return (
              <ScriptCard
                key={scriptId}
                script={script}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

---

## 📂 BATTERY PAGE

### Archivo: `PWA/src/pages/Battery.tsx`

```typescript
import { useEntities, useEntity } from '@hakit/core';

export function Battery() {
  // Get all battery sensors
  const batteryEntities = useEntities()
    .filter(id => {
      const entity = useEntity(id);
      return entity.attributes?.device_class === 'battery' ||
             id.includes('battery');
    });
  
  // Sort by battery level (low first)
  const sortedByLevel = batteryEntities.sort((a, b) => {
    const aEntity = useEntity(a);
    const bEntity = useEntity(b);
    const aLevel = parseFloat(aEntity.state) || 100;
    const bLevel = parseFloat(bEntity.state) || 100;
    return aLevel - bLevel;
  });
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Baterías</h1>
      
      {/* Low battery warning */}
      <div className="mb-6">
        {sortedByLevel.filter(id => {
          const entity = useEntity(id);
          return parseFloat(entity.state) < 20;
        }).length > 0 && (
          <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg">
            ⚠️ {sortedByLevel.filter(id => parseFloat(useEntity(id).state) < 20).length} dispositivos con batería baja
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedByLevel.map(entityId => {
          const entity = useEntity(entityId);
          const level = parseFloat(entity.state) || 0;
          
          return (
            <BatteryCard
              key={entityId}
              entity={entity}
              level={level}
            />
          );
        })}
      </div>
    </div>
  );
}
```

---

## 📂 SECURITY PAGE

### Archivo: `PWA/src/pages/Security.tsx`

```typescript
import { useEntities, useEntity } from '@hakit/core';

export function Security() {
  const cameras = useEntities({ domain: 'camera' });
  const locks = useEntities({ domain: 'lock' });
  const alarms = useEntities({ domain: 'alarm_control_panel' });
  const doorSensors = useEntities({ domain: 'binary_sensor' })
    .filter(id => {
      const entity = useEntity(id);
      return entity.attributes?.device_class === 'door' ||
             entity.attributes?.device_class === 'window';
    });
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Seguridad</h1>
      
      {/* Alarm Panel */}
      {alarms.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl mb-4">Panel de Alarma</h2>
          {alarms.map(alarmId => (
            <AlarmPanel key={alarmId} alarmId={alarmId} />
          ))}
        </section>
      )}
      
      {/* Cameras */}
      <section className="mb-8">
        <h2 className="text-2xl mb-4">Cámaras ({cameras.length})</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cameras.map(camId => (
            <CameraCard key={camId} cameraId={camId} />
          ))}
        </div>
      </section>
      
      {/* Locks */}
      <section className="mb-8">
        <h2 className="text-2xl mb-4">Cerraduras ({locks.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {locks.map(lockId => (
            <LockCard key={lockId} lockId={lockId} />
          ))}
        </div>
      </section>
      
      {/* Door/Window Sensors */}
      <section>
        <h2 className="text-2xl mb-4">Sensores ({doorSensors.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {doorSensors.map(sensorId => (
            <SensorCard key={sensorId} sensorId={sensorId} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

## 📂 VOICE AI PAGE (Estructura Base)

### Archivo: `PWA/src/pages/VoiceAI.tsx`

```typescript
import { useState } from 'react';
import { useService } from '@hakit/core';

export function VoiceAI() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');
  const callService = useService();
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    // TODO: Integrar con ChatGPT/Voice AI API
    // Por ahora, solo estructura base
    
    setInput('');
  };
  
  return (
    <div className="p-6 h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Voice AI Assistant</h1>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg ${
              msg.role === 'user'
                ? 'bg-purple-500/20 ml-auto max-w-[80%]'
                : 'bg-white/10 mr-auto max-w-[80%]'
            }`}
          >
            {msg.content}
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="text-center text-gray-400">
            <p>Estructura base para Voice AI</p>
            <p className="text-sm">Por implementar: integración con ChatGPT, control de dispositivos por voz</p>
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 bg-white/10 rounded-lg px-4 py-2"
          placeholder="Escribe tu mensaje..."
        />
        <button
          onClick={sendMessage}
          className="bg-purple-500 px-6 py-2 rounded-lg"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
```

---

## 📂 DEBUG PAGE

### Archivo: `PWA/src/pages/Debug.tsx`

```typescript
import { useHass } from '@hakit/core';
import { useState } from 'react';

export function Debug() {
  const { auth, connection, entities } = useHass();
  const [showRaw, setShowRaw] = useState(false);
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Debug Panel</h1>
      
      {/* Connection Status */}
      <section className="mb-6 bg-white/5 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Connection</h2>
        <pre className="text-sm">
          {JSON.stringify({ connection, auth }, null, 2)}
        </pre>
      </section>
      
      {/* Entity Count */}
      <section className="mb-6 bg-white/5 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Entities</h2>
        <p>Total: {Object.keys(entities).length}</p>
        
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="mt-2 bg-purple-500 px-4 py-2 rounded"
        >
          {showRaw ? 'Hide' : 'Show'} Raw Entities
        </button>
        
        {showRaw && (
          <pre className="mt-4 text-xs overflow-auto max-h-96">
            {JSON.stringify(entities, null, 2)}
          </pre>
        )}
      </section>
      
      {/* System Info */}
      <section className="bg-white/5 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">System Info</h2>
        <ul className="space-y-1 text-sm">
          <li>User Agent: {navigator.userAgent}</li>
          <li>Screen: {window.screen.width}x{window.screen.height}</li>
          <li>Viewport: {window.innerWidth}x{window.innerHeight}</li>
          <li>Online: {navigator.onLine ? '✅' : '❌'}</li>
        </ul>
      </section>
    </div>
  );
}
```

---

## 🎨 UI Components (MANTENER)

### `GadgetCard.tsx` - Solo update props

**Antes**:
```typescript
interface Props {
  entity: any; // Custom entity object
}
```

**Después**:
```typescript
import { useEntity } from '@hakit/core';
import type { EntityName } from '@hakit/core';

interface Props {
  entityId: EntityName;
}

function GadgetCard({ entityId }: Props) {
  const entity = useEntity(entityId);
  
  // entity.state, entity.attributes.friendly_name, etc.
  // MISMO schema que antes, solo que viene de @hakit
  
  return (
    <motion.div className="glassmorphic-card">
      <h4>{entity.attributes.friendly_name}</h4>
      <p>{entity.state}</p>
      <button onClick={() => entity.service.toggle()}>
        Toggle
      </button>
    </motion.div>
  );
}
```

**Nota**: @hakit entities tienen `.service.toggle()` built-in! 🎉

---

## 📱 Mobile Responsive

**CRITICAL**: Todas las páginas deben ser mobile-first.

### Breakpoints (Tailwind):
```css
/* Mobile first */
.container { @apply px-4; }

/* Tablet */
@screen md { .container { @apply px-6; } }

/* Desktop */
@screen lg { .container { @apply px-8 max-w-7xl; } }
```

### Grid Responsive:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

### Touch Targets:
- Mínimo 44x44px para botones
- Spacing entre elementos: min 8px
- Font size: min 16px (evita zoom en iOS)

---

## ✅ Acceptance Criteria

### Functional
- [ ] Dashboard muestra stats correctos
- [ ] Zones muestra todas las áreas del HAOS
- [ ] Gadgets agrupa por dominio
- [ ] Toggle entities funciona
- [ ] Real-time updates visible

### Mobile
- [ ] Responsive en 320px (iPhone SE)
- [ ] Touch targets \u003e 44px
- [ ] No horizontal scroll
- [ ] Smooth animations (no lag)
- [ ] PWA install prompt funciona

### Desktop
- [ ] Responsive hasta 1920px
- [ ] Hover states funcionan
- [ ] Keyboard navigation OK

---

## 🧪 Testing

### Test en dispositivos reales:
```bash
# Get local IP
ip addr show | grep inet

# Run dev server
npm run dev -- --host

# Abrir en móvil:
# http://192.168.X.X:5173
```

### Test responsiveness:
- Chrome DevTools \u003e Device Mode
- Test: iPhone SE (375px), iPad (768px), Desktop (1920px)

---

## 📦 Deliverables

- ✅ `PWA/src/pages/Dashboard.tsx`
- ✅ `PWA/src/pages/Zones.tsx`
- ✅ `PWA/src/pages/Gadgets.tsx`
- ✅ Screenshots mobile + desktop
- ✅ Video demo toggling devices

---

**GO! 🚀**
